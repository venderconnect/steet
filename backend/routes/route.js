const router = require('express').Router();

//
// DEBUGGING ROUTE
router.get('/test', (req, res) => res.send('Hello from the test route!'));
//
//

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const chatController = require('../controllers/chatController');
const analyticsController = require('../controllers/analyticsController');

const { auth, authorize } = require('../middleware/middleware');
const upload = require('../middleware/upload'); // Import the upload middleware

// Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-password-reset-otp', authController.verifyPasswordResetOtp);
router.post('/verify-otp', authController.verifyOtp); // NEW: OTP Verification


// User Profile (for any authenticated user)
router.get('/profile', auth, userController.getProfile);
router.patch('/profile', auth, userController.updateProfile); // NEW: Update user profile
router.patch('/profile/location', auth, userController.updateProfileLocation); // NEW: Update user location

// Products
router.post('/products', auth, authorize('supplier'), upload.single('image'), productController.createProduct);
router.patch('/products/:id', auth, authorize('supplier'), upload.single('image'), productController.updateProduct); // NEW: Update product
router.get('/products', auth, productController.getProducts);
router.get('/products/my-products', auth, authorize('supplier'), productController.getMyProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products/:id/review', auth, productController.createProductReview); // NEW
router.delete('/products/:id', auth, authorize('supplier'), productController.deleteProduct); // NEW: Delete product

// Group Orders
router.post('/group-orders', auth, authorize('vendor', 'customer'), orderController.createGroupOrder);
router.post('/group-orders/join', auth, authorize('vendor', 'customer'), orderController.joinGroupOrder);
router.get('/group-orders', auth, orderController.getMyGroupOrders);
router.get('/group-orders/supplier', auth, authorize('supplier'), orderController.getSupplierGroupOrders);
router.get('/orders/:orderId/track', auth, orderController.getOrderTracking);
router.put('/orders/:orderId/modify', auth, authorize('vendor', 'customer'), orderController.modifyOrder);
router.patch('/orders/:orderId/cancel', auth, authorize('vendor', 'customer'), orderController.cancelOrder); // NEW: Cancel order

// Supplier actions on orders
router.put('/orders/:orderId/approve', auth, authorize('supplier'), orderController.approveGroupOrder);
router.put('/orders/:orderId/reject', auth, authorize('supplier'), orderController.rejectGroupOrder);
router.put('/orders/:orderId/deliver', auth, authorize('supplier'), orderController.markOrderAsDelivered);

// Order summary for vendor tracking UI
router.get('/orders/:orderId/summary', auth, orderController.getOrderSummary);

// Get supplier analytics
router.get('/suppliers/analytics', auth, authorize('supplier'), analyticsController.getSupplierAnalytics);
router.get('/suppliers/:id', userController.getSupplierProfile); // NEW: Get supplier profile by ID

// Chat
router.get('/conversations', auth, chatController.getConversations);
router.get('/conversations/unread-count', auth, chatController.getUnreadMessageCount); // NEW: Get unread message count
router.get('/conversations/:conversationId', auth, chatController.getConversationDetails); // NEW: Get conversation details
router.get('/conversations/:conversationId/messages', auth, chatController.getMessages);
router.post('/conversations/:supplierId/:productId', auth, chatController.createOrGetConversation); // Create or get conversation
router.post('/messages', auth, chatController.sendMessage);
router.patch('/conversations/:conversationId/read', auth, chatController.markConversationAsRead);

module.exports = router;
