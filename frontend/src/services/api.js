import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------
export const preferencesAPI = {
  get: () => api.get('/preferences/'),
  upsert: (data) => api.put('/preferences/', data),
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export const searchAPI = {
  text: (data) => api.post('/search/text', data),
  voice: (formData) => api.post('/search/voice', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  image: (formData) => api.post('/search/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export const productsAPI = {
  search: (params) => api.get('/products/search', { params }),
  trending: (category) => api.get('/products/trending', { params: { category } }),
  priceHistory: (id) => api.get(`/products/${id}/price-history`),
  compare: (ids) => api.post('/products/compare', ids),
  reviewAnalysis: (id, title) => api.get(`/products/${id}/reviews/analysis`, { params: { product_title: title } }),
  sustainability: (id, platform) => api.get(`/products/${id}/sustainability`, { params: { platform } }),
  priceTrend: (id, title) => api.get(`/products/${id}/price-trend-analysis`, { params: { product_title: title } }),
};

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------
export const agentAPI = {
  query: (data) => api.post('/agent/query', data),
  comparePrices: (query) => api.get('/agent/compare-prices', { params: { query } }),
  dashboard: () => api.get('/agent/dashboard'),
};

// ---------------------------------------------------------------------------
// Shopping Lists & Alerts
// ---------------------------------------------------------------------------
export const listsAPI = {
  getLists: () => api.get('/lists/'),
  createList: (data) => api.post('/lists/', data),
  addItem: (listId, item) => api.post(`/lists/${listId}/items`, item),
  removeItem: (listId, itemId) => api.delete(`/lists/${listId}/items/${itemId}`),
  getAlerts: () => api.get('/lists/alerts'),
  createAlert: (data) => api.post('/lists/alerts', data),
  deleteAlert: (id) => api.delete(`/lists/alerts/${id}`),
};

export default api;
