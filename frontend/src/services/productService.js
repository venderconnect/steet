import api from './axiosConfig';

/**
 * Fetches all products for the public marketplace view.
 */
export const getProducts = () => {
  return api.get('/products');
};


export const createProduct = (data) => {
  return api.post('/products', data);
};

/**
 * Fetches only the products listed by the currently logged-in supplier.
 */
export const getMyProducts = () => {
  return api.get('/products/my-products');
};


export const addProductReview = (productId, reviewData) => {
  return api.post(`/products/${productId}/review`, reviewData);
};
