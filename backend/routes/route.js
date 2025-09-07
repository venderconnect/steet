const router = require('express').Router();
const controller = require('../controllers/controller');
const { auth, authorize } = require('../middleware/middleware');
const upload = require('../middleware/upload'); // Import the upload middleware

// Auth
router.post('/register', controller.register);
router.post('/login', controller.login);

// Products
router.post('/products', auth, authorize('supplier'), upload.single('image'), controller.createProduct);
router.get('/products', auth, controller.getProducts);
router.get('/products/my-products', auth, authorize('supplier'), controller.getMyProducts);
router.post('/products/:id/review', auth, controller.createProductReview); // NEW

// Group Orders
router.post('/group-orders', auth, authorize('vendor', 'customer'), controller.createGroupOrder);
router.post('/group-orders/join', auth, authorize('vendor', 'customer'), controller.joinGroupOrder);
router.get('/group-orders', auth, controller.getMyGroupOrders);
router.get('/group-orders/supplier', auth, authorize('supplier'), controller.getSupplierGroupOrders);
router.get('/orders/:orderId/track', auth, controller.getOrderTracking);
router.put('/orders/:orderId/modify', auth, authorize('vendor', 'customer'), controller.modifyOrder);

// Supplier actions on orders
router.put('/orders/:orderId/approve', auth, authorize('supplier'), controller.approveGroupOrder);
router.put('/orders/:orderId/reject', auth, authorize('supplier'), controller.rejectGroupOrder);

// Order summary for vendor tracking UI
router.get('/orders/:orderId/summary', auth, controller.getOrderSummary);

// Supplier profile
router.get('/suppliers/:id', controller.getSupplierProfile);
// Update supplier coords (supplier only)
router.put('/suppliers/:id/coords', auth, authorize('supplier'), controller.updateSupplierCoords);
// Nearby suppliers
router.get('/suppliers', controller.getNearbySuppliers); // accepts lat,lng,radiusKm,productId as query

module.exports = router;