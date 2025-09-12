const mongoose = require('mongoose');
const AddressSchema = new mongoose.Schema({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
  coords: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, {_id: false});
const VendorUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'vendor' },
  businessName: { type: String },
  address: { type: AddressSchema, required: false },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('VendorUser', VendorUserSchema);
