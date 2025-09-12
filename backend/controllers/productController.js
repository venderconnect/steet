const { Product, SupplierUser, VendorUser } = require('../models/model');
const mongoose = require('mongoose');

exports.createProduct = async (req, res) => {
  try {
    console.log('Received product creation request body:', req.body);
    console.log('Received product image file:', req.file);
    // Accept both multipart file upload (req.file) and JSON body with base64 image (req.body.image)
    const { name, description, pricePerKg, category, unit, minOrderQty, isPrepped, availableQty } = req.body;
    // prefer req.file (Cloudinary) if present, otherwise accept base64 image string from body
    const imageUrl = req.file ? req.file.path : (req.body.image || null);

    // Validate required fields (description optional)
    if (!name || !pricePerKg || !category || !minOrderQty) { // Removed unit from this check
      return res.status(400).json({ msg: 'Please enter all required fields.' });
    }
    // Ensure unit has a default if not provided by frontend
    const productUnit = unit || 'kg'; // Set default to 'kg' if unit is falsy

    const product = new Product({
      name,
      description: description || '',
      pricePerKg: Number(pricePerKg),
      imageUrl,
      category,
      unit: productUnit,
      minOrderQty: Number(minOrderQty),
      availableQty: availableQty ? Number(availableQty) : 0,
      isPrepped: isPrepped === 'true' || isPrepped === true,
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
    const { prepared, search, minPrice, maxPrice, minRating, sortBy, sortOrder } = req.query;
    let filter = {};
    let sort = {};

    if (prepared === 'true') {
      filter.isPrepped = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice) {
      filter.pricePerKg = { ...filter.pricePerKg, $gte: Number(minPrice) };
    }
    if (maxPrice) {
      filter.pricePerKg = { ...filter.pricePerKg, $lte: Number(maxPrice) };
    }

    // For minRating, we need to populate suppliers and then filter
    let productsQuery = Product.find(filter);

    if (minRating) {
      // Populate supplier to access averageRating
      productsQuery = productsQuery.populate({
        path: 'supplier',
        select: 'name businessName address averageRating', // Ensure averageRating is selected
      });
    } else {
      productsQuery = productsQuery.populate('supplier', 'name businessName address');
    }

    // Apply sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'price') {
        sort.pricePerKg = order;
      } else if (sortBy === 'rating') {
        sort.averageRating = order; // Sort by supplier's average rating
      }
    }

    let products = await productsQuery.sort(sort);

    // Post-query filtering for minRating (since it's on populated field)
    if (minRating) {
      products = products.filter(product => {
        // Ensure supplier and averageRating exist before comparing
        return product.supplier && product.supplier.averageRating >= Number(minRating);
      });
    }

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

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name businessName address');
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Product ID
    const { name, description, pricePerKg, category, unit, minOrderQty, isPrepped, availableQty } = req.body;
    const imageUrl = req.file ? req.file.path : (req.body.imageUrl || null); // Use imageUrl from body if no new file

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Ensure only the owner can update the product
    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You do not own this product.' });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (description) product.description = description;
    if (pricePerKg) product.pricePerKg = Number(pricePerKg);
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (minOrderQty) product.minOrderQty = Number(minOrderQty);
    if (typeof isPrepped !== 'undefined') product.isPrepped = isPrepped;
    if (availableQty) product.availableQty = Number(availableQty);
    if (imageUrl) product.imageUrl = imageUrl;

    await product.save();

    res.status(200).json({ msg: 'Product updated successfully', product });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Ensure only the owner can delete the product
    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You do not own this product.' });
    }

    await product.deleteOne(); // Use deleteOne() for Mongoose 5.x and above

    res.status(200).json({ msg: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ msg: err.message });
  }
};
