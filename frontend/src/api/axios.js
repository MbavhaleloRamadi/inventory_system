import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Dynamically add the Authorization header before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization; // clean if no token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

