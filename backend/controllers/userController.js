const { VendorUser, SupplierUser, Product } = require('../models/model');
const mongoose = require('mongoose');

// Helper: haversine distance (km)
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('getProfile: req.user:', req.user);
    let user;
    if (req.user.role === 'vendor') {
      user = await VendorUser.findById(req.user.id).select('-password');
    } else if (req.user.role === 'supplier') {
      user = await SupplierUser.findById(req.user.id).select('-password');
    } else {
      return res.status(400).json({ msg: 'Invalid user role.' });
    }

    if (!user) {
      console.log('getProfile: User not found for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ msg: err.message });
  }
};

// Update user profile location
exports.updateProfileLocation = async (req, res) => {
  try {
    const { location } = req.body;
    if (!location || typeof location.lat === 'undefined' || typeof location.lng === 'undefined') {
      return res.status(400).json({ msg: 'Location (lat, lng) is required.' });
    }

    let Model;
    if (req.user.role === 'vendor') {
      Model = VendorUser;
    } else if (req.user.role === 'supplier') {
      Model = SupplierUser;
    } else {
      return res.status(400).json({ msg: 'Invalid user role.' });
    }

    const updateFields = {
      'address.coords.lat': location.lat,
      'address.coords.lng': location.lng,
    };

    if (location.address) {
      updateFields['address.street'] = location.address;
    }

    const user = await Model.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password'); // Select -password to avoid sending it back

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.json({ msg: 'Location updated successfully', location: user.address.coords });
  } catch (err) {
    console.error('Error updating profile location:', err);
    res.status(500).json({ msg: err.message });
  }
};

// New: Get supplier profile and their products
exports.getSupplierProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await SupplierUser.findById(id).select('-password');
    if (!supplier) return res.status(404).json({ msg: 'Supplier not found' });

    const products = await Product.find({ supplier: id });

    const averageRating = products.length
      ? products.reduce((acc, p) => acc + (p.averageRating || 0), 0) / products.length
      : 0;

    res.json({ supplier, products, averageRating });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update supplier coords
exports.updateSupplierCoords = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ msg: 'lat and lng are required' });

    // Only allow supplier to update their own coords
    if (req.user.id !== id && req.user.role !== 'supplier') {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    const user = await SupplierUser.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.address = user.address || {};
    user.address.coords = { lat: Number(lat), lng: Number(lng) };
    await user.save();
    res.json({ msg: 'Coords updated', coords: user.address.coords });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get nearby suppliers (simple server-side Haversine filter)
exports.getNearbySuppliers = async (req, res) => {
  try {
    const { lat, lng, radiusKm = 50, productId } = req.query;
    if (!lat || !lng) return res.status(400).json({ msg: 'lat and lng query params required' });

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radius = Number(radiusKm);

    // If productId provided, fetch the product and only consider its supplier
    if (productId) {
      const product = await Product.findById(productId).populate('supplier', 'name businessName address');
      if (!product) return res.status(404).json({ msg: 'Product not found' });
      const s = product.supplier;
      const coords = s?.address?.coords;
      if (!coords) return res.json({ suppliers: [] });
      const distance = haversineDistance([latNum, lngNum], [coords.lat, coords.lng]);
      if (distance <= radius) {
        return res.json({ suppliers: [{ supplier: s, distanceKm: distance } ] });
      }
      return res.json({ suppliers: [] });
    }

    // Otherwise fetch all suppliers and compute distance
    const suppliers = await SupplierUser.find().select('name businessName address');
    const result = suppliers
      .map(s => {
        const coords = s.address?.coords;
        if (!coords) return null;
        const distance = haversineDistance([latNum, lngNum], [coords.lat, coords.lng]);
        return { supplier: s, distanceKm: distance };
      })
      .filter(x => x && x.distanceKm <= radius)
      .sort((a,b) => a.distanceKm - b.distanceKm);

    res.json({ suppliers: result });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, email, businessName, address } = req.body;

    let Model;
    if (userRole === 'vendor') {
      Model = VendorUser;
    } else if (userRole === 'supplier') {
      Model = SupplierUser;
    } else {
      return res.status(400).json({ msg: 'Invalid user role.' });
    }

    const updateFields = {};

    if (userRole === 'vendor') {
      if (name) updateFields.name = name;
    } else if (userRole === 'supplier') {
      if (businessName) updateFields.companyName = businessName; // Supplier uses companyName
    }

    if (email) updateFields.email = email;

    if (address) {
      // Handle nested address fields
      if (address.street) updateFields['address.street'] = address.street;
      if (address.city) updateFields['address.city'] = address.city;
      if (address.state) updateFields['address.state'] = address.state;
      if (address.zipCode) updateFields['address.zipCode'] = address.zipCode;
      if (address.coords) {
        if (typeof address.coords.lat !== 'undefined') updateFields['address.coords.lat'] = address.coords.lat;
        if (typeof address.coords.lng !== 'undefined') updateFields['address.coords.lng'] = address.coords.lng;
      }
    }

    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.status(200).json({ msg: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ msg: err.message });
  }
};