import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    // Will add token from store later
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Will handle logout later
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),

  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password/', { email }),
};
