const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  country: { type: String },
  coords: {
    lat: { type: Number },
    lng: { type: Number },
  },
});

const SupplierUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  address: AddressSchema,
  role: { type: String, default: 'supplier' },
  revenue: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SupplierUser', SupplierUserSchema);
