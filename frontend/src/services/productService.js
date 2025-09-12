import api from './axiosConfig';

/**
 * Fetches all products for the public marketplace view. Optionally accepts an object { prepared: true }
 */
export const getProducts = (opts = {}) => {
  const params = {};
  if (opts.prepared) params.prepared = true;
  if (opts.search) params.search = opts.search;
  if (opts.minPrice) params.minPrice = opts.minPrice;
  if (opts.maxPrice) params.maxPrice = opts.maxPrice;
  if (opts.minRating) params.minRating = opts.minRating;
  if (opts.sortBy) params.sortBy = opts.sortBy;
  if (opts.sortOrder) params.sortOrder = opts.sortOrder;
  return api.get('/products', { params });
};


export const createProduct = (data) => {
  // data is already a FormData object from AddProductDialog.jsx
  // Axios can directly send FormData objects, which will set the correct Content-Type header.
  return api.post('/products', data);
};

export const updateProduct = (productId, data) => {
  // data is expected to be a FormData object
  return api.patch(`/products/${productId}`, data);
};

/**
 * Fetches only the products listed by the currently logged-in supplier.
 */
export const getMyProducts = () => {
  return api.get('/products/my-products');
};

export const getProductById = (id) => {
  return api.get(`/products/${id}`);
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

// Update supplier coords (must be supplier or authorized)
export const updateSupplierCoords = (supplierId, coords) => {
  return api.put(`/suppliers/${supplierId}/coords`, coords);
};

export const getNearbySuppliers = (lat, lng, radiusKm = 50, productId) => {
  const params = { lat, lng, radiusKm };
  if (productId) params.productId = productId;
  return api.get('/suppliers', { params });
};

export const deleteProduct = (productId) => {
  return api.delete(`/products/${productId}`);
};
