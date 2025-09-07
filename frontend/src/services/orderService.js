import api from './axiosConfig';

/**
 * Fetches all group orders the current user is a participant in.
 * Used for the "My Orders" page for vendors.
 */
export const getMyGroupOrders = () => {
  return api.get('/group-orders');
};

/**
 * Fetches all group orders for products belonging to the current supplier.
 * Used for the "Supplier Dashboard".
 */
export const getSupplierGroupOrders = () => {
  return api.get('/group-orders/supplier');
};

/**
 * Creates a new group order.
 * @param {string} productId - The ID of the product.
 * @param {number} targetQty - The target quantity for the group order to be completed.
 * @param {number} quantity - The initial quantity the creator is ordering.
 */
export const createGroupOrder = (productId, targetQty, quantity) => {
  return api.post('/group-orders', { productId, targetQty, quantity });
};

/**
 * Allows a user to join an existing group order.
 * @param {string} groupOrderId - The ID of the group order to join.
 * @param {number} quantity - The quantity the user wants to order.
 */
export const joinGroupOrder = (groupOrderId, quantity) => {
  return api.post('/group-orders/join', { groupOrderId, quantity });
};

/**
 * Modifies a user's quantity in an open group order.
 * @param {string} orderId - The ID of the group order.
 * @param {number} newQuantity - The new quantity for the user.
 */
export const modifyOrder = (orderId, newQuantity) => {
  return api.put(`/orders/${orderId}/modify`, { quantity: newQuantity });
};

/**
 * Retrieves tracking information and event history for a specific order.
 * @param {string} orderId - The ID of the order to track.
 */
export const getOrderTracking = (orderId) => {
  return api.get(`/orders/${orderId}/track`);
};
