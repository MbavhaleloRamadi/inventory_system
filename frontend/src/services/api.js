// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
        const RefreshTokenn = localStorage.getItem('RefreshTokenn');
        if (RefreshTokenn) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: RefreshTokenn,
          });

          const newaccess_token = response.data.access;
          localStorage.setItem('access_token', newaccess_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${newaccess_token}`;
          originalRequest.headers.Authorization = `Bearer ${newaccess_token}`;

          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('RefreshTokenn');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints that match your backend
export const authAPI = {
  login: (credentials) => {
    // Matches your CustomTokenObtainPairView
    return api.post('/auth/login/', credentials);
  },

  register: (userData) => {
    // Uses public registration endpoint
    return api.post('/auth/register/public/', userData);
  },

  adminRegister: (userData) => {
    // Admin-only registration endpoint
    return api.post('/auth/register/', userData);
  },

  getProfile: () => {
    return api.get('/auth/profile/');
  },

  updateProfile: (userData) => {
    return api.put('/auth/profile/update/', userData);
  },

  changePassword: (passwordData) => {
    return api.post('/auth/profile/change-password/', passwordData);
  },

  getPermissions: () => {
    return api.get('/auth/permissions/');
  },

  getUsersList: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/auth/users/${queryString ? `?${queryString}` : ''}`);
  },

  getUser: (userId) => {
    return api.get(`/auth/users/${userId}/`);
  },

  updateUser: (userId, userData) => {
    return api.put(`/auth/users/${userId}/`, userData);
  },

  deleteUser: (userId) => {
    return api.delete(`/auth/users/${userId}/`);
  },

  getRoleChoices: () => {
    return api.get('/auth/roles/');
  },

  logout: (RefreshTokenn) => {
    return api.post('/auth/logout/', { RefreshToken: RefreshTokenn });
  },

  RefreshTokenn: (RefreshTokenn) => {
    return axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: RefreshTokenn,
    });
  },
};

// Dashboard API endpoints
export const dashboardAPI = {
  getDashboardData: () => {
    return api.get('/dashboard/');
  },

  getStats: () => {
    return api.get('/dashboard/stats/');
  },

  getRecentActivity: () => {
    return api.get('/dashboard/recent-activity/');
  },
};

// Helper functions for authentication
export const loginUser = async (credentials) => {
  try {
    const response = await authAPI.login(credentials);

    // Your backend returns { access, refresh, user }
    const { access, refresh, user } = response.data;

    if (access && refresh) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('RefreshTokenn', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    }

    return { success: true, data: { user, tokens: { access, refresh } } };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.response?.data || 'Login failed'
    };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await authAPI.register(userData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Registration failed'
    };
  }
};

export const logoutUser = async () => {
  try {
    const RefreshTokenn = localStorage.getItem('RefreshTokenn');
    if (RefreshTokenn) {
      await authAPI.logout({ refresh: RefreshTokenn });

    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear everything regardless of API call success
    localStorage.removeItem('access_token');
    localStorage.removeItem('RefreshTokenn');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

export const getStoredToken = () => {
  return localStorage.getItem('access_token');
};

export const getStoredRefreshTokenn = () => {
  return localStorage.getItem('RefreshTokenn');
};

// Set token in headers if it exists
const token = getStoredToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/// Inventory API endpoints - Updated to use axios instance
export const inventoryAPI = {
  // Get all inventory items with optional filters
  getItems: (params = {}) => {
    return api.get('/inventory/', { params });
  },

  // Get single inventory item
  getItem: (id) => {
    return api.get(`/inventory/${id}/`);
  },

  // Create new inventory item
  createItem: (itemData) => {
    return api.post('/inventory/', itemData);
  },

  // Update inventory item
  updateItem: (id, itemData) => {
    return api.put(`/inventory/${id}/`, itemData);
  },

  // Partially update inventory item
  patchItem: (id, itemData) => {
    return api.patch(`/inventory/${id}/`, itemData);
  },

  // Delete inventory item
  deleteItem: (id) => {
    return api.delete(`/inventory/${id}/`);
  },

  // Bulk delete inventory items
  bulkDelete: (itemIds) => {
    return api.post('/inventory/bulk-delete/', { ids: itemIds });
  },

  // Update stock levels
  updateStock: (id, stockData) => {
    return api.post(`/inventory/${id}/update-stock/`, stockData);
  },

  // Get stock movement history
  getStockHistory: (id) => {
    return api.get(`/inventory/${id}/movements/`);
  },

  // Export inventory data
  exportItems: (format = 'csv', filters = {}) => {
    const params = { ...filters, format };
    return api.get('/inventory/export/', { 
      params,
      responseType: 'blob' // Important for file downloads
    });
  },

  // Import inventory data
  importItems: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/inventory/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get low stock items
  getLowStockItems: () => {
    return api.get('/inventory/low-stock/');
  },

  // Get inventory categories
  getCategories: () => {
    return api.get('/inventory/categories/');
  },

  // Get inventory locations
  getLocations: () => {
    return api.get('/inventory/locations/');
  },
};

export default api;