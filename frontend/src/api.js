// src/services/api.js
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  refreshToken: (refresh) => api.post('/auth/refresh/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
};

export const inventoryAPI = {
  getItems: (params) => api.get('/inventory/items/', { params }),
  getItem: (id) => api.get(`/inventory/items/${id}/`),
  createItem: (data) => api.post('/inventory/items/', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}/`),
  adjustStock: (id, data) => api.post(`/inventory/items/${id}/adjust/`, data),
  getMovements: (params) => api.get('/inventory/movements/', { params }),
  getLowStockItems: () => api.get('/inventory/items/low-stock/'),
};

export const purchaseOrderAPI = {
  getPOs: (params) => api.get('/purchase-orders/', { params }),
  getPO: (id) => api.get(`/purchase-orders/${id}/`),
  createPO: (data) => api.post('/purchase-orders/', data),
  updatePO: (id, data) => api.put(`/purchase-orders/${id}/`, data),
  approvePO: (id) => api.post(`/purchase-orders/${id}/approve/`),
  receivePO: (id, data) => api.post(`/purchase-orders/${id}/receive/`, data),
};

export const requisitionAPI = {
  getRequisitions: (params) => api.get('/requisitions/', { params }),
  getRequisition: (id) => api.get(`/requisitions/${id}/`),
  createRequisition: (data) => api.post('/requisitions/', data),
  updateRequisition: (id, data) => api.put(`/requisitions/${id}/`, data),
  approveRequisition: (id) => api.post(`/requisitions/${id}/approve/`),
  dispatchRequisition: (id, data) => api.post(`/requisitions/${id}/dispatch/`, data),
};

export const locationAPI = {
  getLocations: () => api.get('/locations/'),
  getLocation: (id) => api.get(`/locations/${id}/`),
  createLocation: (data) => api.post('/locations/', data),
  updateLocation: (id, data) => api.put(`/locations/${id}/`, data),
  deleteLocation: (id) => api.delete(`/locations/${id}/`),
};

export const dashboardAPI = {
  getStockSummary: () => api.get('/dashboard/stock-summary/'),
  getRecentMovements: (limit = 10) => api.get(`/dashboard/recent-movements/?limit=${limit}`),
  getPendingRequisitions: () => api.get('/dashboard/pending-requisitions/'),
  getLocationSummary: () => api.get('/dashboard/location-summary/'),
  getActivityFeed: (limit = 10) => api.get(`/dashboard/activity/?limit=${limit}`),
};

export const reportsAPI = {
  getInventoryReport: (params) => api.get('/reports/inventory/', { params }),
  getMovementReport: (params) => api.get('/reports/movements/', { params }),
  getValuationReport: (params) => api.get('/reports/valuation/', { params }),
  exportReport: (type, params) => api.get(`/reports/${type}/export/`, { 
    params, 
    responseType: 'blob' 
  }),
};

export const userAPI = {
  getUsers: (params) => api.get('/users/', { params }),
  getUser: (id) => api.get(`/users/${id}/`),
  createUser: (data) => api.post('/users/', data),
  updateUser: (id, data) => api.put(`/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  updateProfile: (data) => api.put('/users/profile/', data),
};

export default api;