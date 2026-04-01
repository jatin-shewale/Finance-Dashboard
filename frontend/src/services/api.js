import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and show toasts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, message } = error;

    // Handle different error types
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      let toastMessage = data?.message || 'Something went wrong';

      if (status === 401) {
        toastMessage = 'Session expired. Please login again.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (status === 403) {
        toastMessage = 'Access denied. Insufficient permissions.';
      } else if (status === 404) {
        toastMessage = data?.message || 'Resource not found';
      } else if (status === 400) {
        // Validation errors
        if (data?.errors) {
          toastMessage = data.errors.map(e => e.msg).join(', ');
        }
      }

      toast.error(toastMessage);
    } else if (message === 'Network Error' || message.includes('ECONNREFUSED')) {
      toast.error('Cannot connect to server. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  getAll: (params) => api.get('/users', { params }),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.post(`/users/${id}/deactivate`),
  activate: (id) => api.post(`/users/${id}/activate`),
};

export const recordAPI = {
  getAll: (params) => api.get('/records', { params }),
  getOne: (id) => api.get(`/records/${id}`),
  create: (data) => api.post('/records', data),
  update: (id, data) => api.put(`/records/${id}`, data),
  delete: (id) => api.delete(`/records/${id}`),
  getCategories: () => api.get('/records/categories'),
};

export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getCategorySummary: (params) => api.get('/dashboard/category-summary', { params }),
};

export default api;
