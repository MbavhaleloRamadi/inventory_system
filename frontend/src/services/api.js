// services/api.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
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

// Auth API endpoints
export const authAPI = {
  login: (credentials) => {
    // Expects: { email, password }
    return apiClient.post('/auth/login/', credentials);
  },

  register: (userData) => {
    // Expects: { name, email, password, confirmPassword }
    return apiClient.post('/auth/register/', userData);
  },

  getProfile: () => {
    return apiClient.get('/auth/profile/');
  },

  updateProfile: (userData) => {
    // Expects: { name, email }
    return apiClient.put('/auth/profile/update/', userData);
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      // Call logout endpoint to blacklist refresh token
      apiClient.post('/auth/logout/', { refresh_token: refreshToken });
    }
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return axios.post(`${BASE_URL}/auth/token/refresh/`, {
      refresh: refreshToken,
    });
  },
};

// Dashboard API endpoints
export const dashboardAPI = {
  getDashboardData: () => {
    return apiClient.get('/dashboard/');
  },

  getInventorySummary: () => {
    return apiClient.get('/dashboard/inventory-summary/');
  },

  getRecentTransactions: () => {
    return apiClient.get('/dashboard/recent-transactions/');
  },

  getLowStockItems: () => {
    return apiClient.get('/dashboard/low-stock/');
  },

  getAnalytics: () => {
    return apiClient.get('/dashboard/analytics/');
  },

  getRevenue: (period = 'monthly') => {
    return apiClient.get(`/dashboard/revenue/?period=${period}`);
  },
};

// Inventory API endpoints
export const inventoryAPI = {
  getInventory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/inventory/${queryString ? `?${queryString}` : ''}`);
  },

  getInventoryItem: (id) => {
    return apiClient.get(`/inventory/${id}/`);
  },

  createInventoryItem: (data) => {
    return apiClient.post('/inventory/', data);
  },

  updateInventoryItem: (id, data) => {
    return apiClient.put(`/inventory/${id}/`, data);
  },

  deleteInventoryItem: (id) => {
    return apiClient.delete(`/inventory/${id}/`);
  },

  updateStock: (id, data) => {
    return apiClient.patch(`/inventory/${id}/stock/`, data);
  },

  getStockHistory: (id) => {
    return apiClient.get(`/inventory/${id}/stock-history/`);
  },

  getCategories: () => {
    return apiClient.get('/inventory/categories/');
  },

  createCategory: (data) => {
    return apiClient.post('/inventory/categories/', data);
  },

  updateCategory: (id, data) => {
    return apiClient.put(`/inventory/categories/${id}/`, data);
  },

  deleteCategory: (id) => {
    return apiClient.delete(`/inventory/categories/${id}/`);
  },
};

// Helper functions for common authentication tasks
export const registerUser = async (userData) => {
  try {
    const response = await authAPI.register({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await authAPI.login({
      email: credentials.email,
      password: credentials.password
    });
    
    // Store tokens if they exist in response
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
    }
    if (response.data.refresh) {
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

export const logoutUser = () => {
  authAPI.logout();
  // Optionally redirect to login page
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const getStoredToken = () => {
  return localStorage.getItem('access_token');
};

export const getStoredRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

// Generic API methods for future use
export const api = {
  get: (url) => apiClient.get(url),
  post: (url, data) => apiClient.post(url, data),
  put: (url, data) => apiClient.put(url, data),
  patch: (url, data) => apiClient.patch(url, data),
  delete: (url) => apiClient.delete(url),
};

export default apiClient;