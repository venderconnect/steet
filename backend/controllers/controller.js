const authController = require('./authController');
const userController = require('./userController');
const productController = require('./productController');
const orderController = require('./orderController');
const chatController = require('./chatController');
const analyticsController = require('./analyticsController');

module.exports = {
  ...authController,
  ...userController,
  ...productController,
  ...orderController,
  ...chatController,
  ...analyticsController,
};