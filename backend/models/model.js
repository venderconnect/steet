const mongoose = require('mongoose');

// NEW: Schema for individual reviews
const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  // Optional geolocation for mapping
  coords: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, {_id: false});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'supplier', 'vendor'], default: 'vendor' },
  businessName: { type: String },
  address: { type: AddressSchema, required: true },
  otp: { type: String }, // NEW: For OTP verification
  otpExpires: { type: Date }, // NEW: OTP expiration time
  isVerified: { type: Boolean, default: false }, // NEW: Email verification status
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
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true },
    _id: false
  }],
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Product: mongoose.model('Product', ProductSchema),
  GroupOrder: mongoose.model('GroupOrder', GroupOrderSchema),
};
