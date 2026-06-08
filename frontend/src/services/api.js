import axios from 'axios';

// Create API Client pointing to Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aegis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch auth errors (401 / 403 token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if token expired or invalid
    if (error.response && error.response.status === 401) {
      const isLoggingIn = error.config.url.includes('/auth/login');
      const isRegistering = error.config.url.includes('/auth/register');
      
      // If we got unauthorized on standard endpoints, force log out
      if (!isLoggingIn && !isRegistering) {
        localStorage.removeItem('aegis_token');
        localStorage.removeItem('aegis_user');
        localStorage.removeItem('aegis_tenant');
        
        // Redirect to login page
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
