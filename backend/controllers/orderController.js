const { Product, GroupOrder, SupplierUser } = require('../models/model');
const mongoose = require('mongoose');

exports.createGroupOrder = async (req, res) => {
  const { productId, targetQty, quantity } = req.body;
  const { id: userId } = req.user;

  if (!productId || !targetQty || !quantity) {
    return res.status(400).json({ msg: 'Missing required fields for creating a group order.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error('Product not found');

    const newGroupOrder = new GroupOrder({
      productId,
      targetQty,
      currentQty: quantity,
      participants: [{ user: userId, quantity }],
      deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default delivery 7 days from now
    });
    await newGroupOrder.save({ session });
    
    await session.commitTransaction();
    res.status(201).json(newGroupOrder);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: err.message });
  } finally {
    session.endSession();
  }
};

exports.joinGroupOrder = async (req, res) => {
  const { groupOrderId, quantity } = req.body;
  const { id: userId } = req.user;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const groupOrder = await GroupOrder.findById(groupOrderId).session(session);
    if (!groupOrder) throw new Error('Group order not found');
    if (groupOrder.status !== 'open') throw new Error('Order is no longer open');

    const participantIndex = groupOrder.participants.findIndex(p => p.user.toString() === userId);
    if (participantIndex > -1) {
      groupOrder.participants[participantIndex].quantity += quantity;
    } else {
      groupOrder.participants.push({ user: userId, quantity });
    }
    
    groupOrder.currentQty = groupOrder.participants.reduce((sum, p) => sum + p.quantity, 0);

    if (groupOrder.currentQty >= groupOrder.targetQty) {
      groupOrder.status = 'completed';
    }
    
    await groupOrder.save({ session });
    await session.commitTransaction();
    res.status(200).json(groupOrder);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: err.message });
  } finally {
    session.endSession();
  }
};

exports.getMyGroupOrders = async (req, res) => {
  try {
    const orders = await GroupOrder.find({ 'participants.user': req.user.id })
      .populate({ path: 'productId', populate: { path: 'supplier', select: 'name businessName' } })
      .populate('participants.user', 'name');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getSupplierGroupOrders = async (req, res) => {
  try {
    const products = await Product.find({ supplier: req.user.id }).select('_id');
    const productIds = products.map(p => p._id);
    const orders = await GroupOrder.find({ productId: { $in: productIds } })
      .populate('productId', 'name unit')
      .populate('participants.user', 'name address');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Supplier approves an order: set supplierLocation (from supplier's address.coords) and mark approved
exports.approveGroupOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await GroupOrder.findById(orderId).populate('productId');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // verify supplier owns the product
    if (!order.productId) return res.status(404).json({ msg: 'Product associated with this order not found' });
    const product = await Product.findById(order.productId._id).select('supplier');
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.supplier.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const supplier = await SupplierUser.findById(req.user.id).select('address');
    const coords = supplier?.address?.coords;
    if (!coords) return res.status(400).json({ msg: 'Supplier location not set. Please set your location first.' });

    order.supplierLocation = { lat: coords.lat, lng: coords.lng };
    order.supplierApproved = true;
    order.status = 'approved';
    await order.save();
    res.json({ msg: 'Order approved', order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Supplier rejects an order
exports.rejectGroupOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await GroupOrder.findById(orderId).populate('productId');
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    const product = await Product.findById(order.productId._id).select('supplier');
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    if (product.supplier.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    order.status = 'rejected';
    order.supplierApproved = false;
    await order.save();
    res.json({ msg: 'Order rejected', order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.markOrderAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await GroupOrder.findById(orderId).populate('productId');
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Verify supplier owns the product associated with the order
    if (!order.productId) {
      return res.status(404).json({ msg: 'Product not found for this order.' });
    }
    if (order.productId.supplier.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You do not own this product.' });
    }

    // Only mark as delivered if the status is 'approved'
    if (order.status !== 'approved') {
      return res.status(400).json({ msg: 'Order must be in "approved" status to be marked as delivered.' });
    }

    // Update order status to 'delivered' and set the delivered date
    order.status = 'delivered';
    order.deliveryDate = new Date(); // Set current date and time as delivered date
    await order.save();

    // Calculate order total and update supplier revenue
    const orderTotal = order.currentQty * (order.productId?.pricePerKg || 0);

    await SupplierUser.findByIdAndUpdate(req.user.id, { $inc: { revenue: orderTotal } });

    res.json({ msg: 'Order marked as delivered and revenue updated.', order });

  } catch (err) {
    console.error('Error marking order as delivered:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Provide order summary used by vendor tracking UI (includes supplier coords if approved)
exports.getOrderSummary = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await GroupOrder.findById(orderId).populate({ path: 'productId', populate: { path: 'supplier', select: 'name businessName address' } });
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    res.json({
      orderId: order._id,
      status: order.status,
      supplierLocation: order.supplierLocation || order.productId.supplier.address?.coords || null,
      product: { id: order.productId._id, name: order.productId.name }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.modifyOrder = async (req, res) => {
  const { orderId } = req.params;
  const { quantity: newQuantity } = req.body;
  const { id: userId } = req.user;

  if (!newQuantity || newQuantity <= 0) {
    return res.status(400).json({ msg: 'Invalid quantity.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const groupOrder = await GroupOrder.findById(orderId).session(session);
    if (!groupOrder) throw new Error('Group order not found');
    if (groupOrder.status !== 'open') throw new Error('This order cannot be modified.');

    const participantIndex = groupOrder.participants.findIndex(p => p.user.toString() === userId);
    if (participantIndex === -1) throw new Error('You are not a participant in this order.');

    groupOrder.participants[participantIndex].quantity = newQuantity;
    groupOrder.currentQty = groupOrder.participants.reduce((sum, p) => sum + p.quantity, 0);

    if (groupOrder.currentQty > groupOrder.targetQty) throw new Error('New quantity exceeds the group order limit.');

    await groupOrder.save({ session });
    await session.commitTransaction();
    res.json(groupOrder);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: err.message });
  } finally {
    session.endSession();
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const groupOrder = await GroupOrder.findById(orderId).populate('productId', 'name');
    if (!groupOrder) return res.status(404).json({ msg: 'Order not found' });

    const events = [{ status: 'Order Placed', timestamp: groupOrder.createdAt }];
    if (groupOrder.status === 'completed') {
      events.push({ status: 'Order Confirmed & Processing', timestamp: new Date() });
    } else if (groupOrder.status === 'delivered') {
      events.push({ status: 'Order Confirmed & Processing', timestamp: new Date(groupOrder.updatedAt - 86400000) });
      events.push({ status: 'Delivered', timestamp: groupOrder.deliveryDate });
    }

    const trackingInfo = {
      orderId: groupOrder._id,
      productName: groupOrder.productId.name,
      status: groupOrder.status,
      estimatedDelivery: groupOrder.deliveryDate,
      events: events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    };
    res.json(trackingInfo);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cancellationMessage } = req.body;
    const userId = req.user.id;

    const order = await GroupOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found.' });
    }

    // Ensure the user cancelling is a participant in the order
    const isParticipant = order.participants.some(p => p.user.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ msg: 'You are not authorized to cancel this order.' });
    }

    // Check if the order is already cancelled, completed, or delivered
    if (['cancelled', 'completed', 'delivered', 'rejected'].includes(order.status)) {
      return res.status(400).json({ msg: `Order cannot be cancelled as it is already ${order.status}.` });
    }

    // Allow cancellation if status is 'open' or 'approved'
    if (order.status === 'open' || order.status === 'approved') {
      order.status = 'cancelled';
      order.cancellationMessage = cancellationMessage || 'Cancelled by vendor.';
      await order.save();
      return res.status(200).json({ msg: 'Order cancelled successfully.', order });
    } else {
      return res.status(400).json({ msg: 'Order cannot be cancelled in its current status.' });
    }
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ msg: err.message });
  }
};