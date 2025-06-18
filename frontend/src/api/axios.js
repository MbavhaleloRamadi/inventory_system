import axios from 'axios';

const token = localStorage.getItem('token'); // or from context

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    Authorization: token ? `Bearer ${token}` : '',
  },
});

export default api;
