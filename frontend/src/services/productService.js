import api from './axiosConfig';

/**
 * Fetches all products for the public marketplace view. Optionally accepts an object { prepared: true }
 */
export const getProducts = (opts = {}) => {
  const params = {};
  if (opts.prepared) params.prepared = true;
  return api.get('/products', { params });
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

// New: fetch products that are prepared
export const getPreparedProducts = () => getProducts({ prepared: true });

// New: fetch supplier profile by id
export const getSupplierProfile = (supplierId) => {
  return api.get(`/suppliers/${supplierId}`);
};
