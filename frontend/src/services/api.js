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
    const token = localStorage.getItem('accessToken');
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('accessToken', newAccessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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

  logout: (refreshToken) => {
    return api.post('/auth/logout/', { refresh_token: refreshToken });
  },

  refreshToken: (refreshToken) => {
    return axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
      refresh: refreshToken,
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
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
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
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await authAPI.logout(refreshToken);
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear everything regardless of API call success
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  return !!token;
};

export const getStoredToken = () => {
  return localStorage.getItem('accessToken');
};

export const getStoredRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// Set token in headers if it exists
const token = getStoredToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Inventory API endpoints
export const inventoryAPI = {
  // Get all inventory items with optional filters
  getItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/inventory/?${queryString}` : '/api/inventory/';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get single inventory item
  getItem: async (id) => {
    const response = await fetch(`/api/inventory/${id}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Create new inventory item
  createItem: async (itemData) => {
    const response = await fetch('/api/inventory/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Update inventory item
  updateItem: async (id, itemData) => {
    const response = await fetch(`/api/inventory/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Partially update inventory item
  patchItem: async (id, itemData) => {
    const response = await fetch(`/api/inventory/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Delete inventory item
  deleteItem: async (id) => {
    const response = await fetch(`/api/inventory/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.status === 204 ? { success: true } : await response.json();
  },

  // Bulk delete inventory items
  bulkDelete: async (itemIds) => {
    const response = await fetch('/api/inventory/bulk-delete/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: itemIds }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Update stock levels
  updateStock: async (id, stockData) => {
    const response = await fetch(`/api/inventory/${id}/update-stock/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stockData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get stock movement history
  getStockHistory: async (id) => {
    const response = await fetch(`/api/inventory/${id}/movements/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Export inventory data
  exportItems: async (format = 'csv', filters = {}) => {
    const params = { ...filters, format };
    const queryString = new URLSearchParams(params).toString();
    
    const response = await fetch(`/api/inventory/export/?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  // Import inventory data
  importItems: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/inventory/import/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get low stock items
  getLowStockItems: async () => {
    const response = await fetch('/api/inventory/low-stock/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get inventory categories
  getCategories: async () => {
    const response = await fetch('/api/inventory/categories/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  // Get inventory locations
  getLocations: async () => {
    const response = await fetch('/api/inventory/locations/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
};

export default api;