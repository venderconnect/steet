const { User, Product, GroupOrder } = require('../models/model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// --- Auth Controller ---
// (register and login functions remain the same)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, businessName, address } = req.body;
    if (!name || !email || !password || !role || !address) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });


    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role, businessName, address });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address } });


  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// --- Product Controller ---
// (createProduct, getProducts, getMyProducts remain the same)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, pricePerKg, image, category, unit, minOrderQty, isPrepped } = req.body;
    const product = new Product({
      name, description, pricePerKg, image, category, unit, minOrderQty, isPrepped,
      supplier: req.user.id
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('supplier', 'name businessName');
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ supplier: req.user.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


// NEW: Controller function for creating a product review
exports.createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { id: productId } = req.params;
  const { id: userId, name: userName } = req.user;

  if (!rating || !comment) {
    return res.status(400).json({ msg: 'Please provide a rating and a comment.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error('Product not found');

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === userId);
    if (alreadyReviewed) {
      return res.status(400).json({ msg: 'Product already reviewed' });
    }

    const review = { user: userId, userName, rating: Number(rating), comment };
    product.reviews.push(review);
    product.averageRating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save({ session });
    await session.commitTransaction();
    res.status(201).json({ msg: 'Review added' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: err.message });
  } finally {
    session.endSession();
  }
};


// --- Group Order Controller ---
// (All other group order functions remain the same)
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
            .populate('participants.user', 'name');
        res.json(orders);
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
      events.push({ status: 'Delivered', timestamp: groupOrder.updatedAt });
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

