import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const candidatesApi = {
  getAll: (params = {}) => api.get('/api/candidates', { params }),
  scan: (data) => api.post('/api/candidates/scan', data),
  update: (id, data) => api.patch(`/api/candidates/${id}`, data),
  delete: (id) => api.delete(`/api/candidates/${id}`)
};

export const emailApi = {
  send: (id) => api.post(`/api/email/send/${id}`),
  test: () => api.get('/api/email/test')
};

export default api;