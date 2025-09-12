const mongoose = require('mongoose');
const VendorUser = require('./VendorUser');
const SupplierUser = require('./SupplierUser');

// NEW: Schema for individual reviews
const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorUser', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

// UPDATED: ProductSchema now includes reviews and an average rating
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  pricePerKg: { type: Number, required: true },
  imageUrl: { type: String }, // Changed from 'image' to 'imageUrl'
  category: { type: String, required: true },
  unit: { type: String, default: 'kg' },
  minOrderQty: { type: Number, required: true },
  availableQty: { type: Number, default: 0 },
  isPrepped: { type: Boolean, default: false },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierUser', required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  reviews: [ReviewSchema], // NEW
  averageRating: { type: Number, default: 0 }, // NEW
}, { timestamps: true });

const GroupOrderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  targetQty: { type: Number, required: true },
  currentQty: { type: Number, default: 0 },
  // Expanded statuses to support supplier approval flow and delivery tracking
  status: { type: String, enum: ['open', 'approved', 'processing', 'completed', 'delivered', 'cancelled', 'rejected'], default: 'open' },
  deliveryDate: { type: Date },
  // Captured when supplier approves the order so vendor can route to supplier
  supplierLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  supplierApproved: { type: Boolean, default: false },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorUser', required: true },
    quantity: { type: Number, required: true },
    _id: false
  }],
  cancellationMessage: { type: String }, // NEW: For vendor cancellation reason
}, { timestamps: true });

const Conversation = require('./Conversation');
const Message = require('./Message');

module.exports = {
  VendorUser,
  SupplierUser,
  Product: mongoose.model('Product', ProductSchema),
  GroupOrder: mongoose.model('GroupOrder', GroupOrderSchema),
  Conversation,
  Message,
};