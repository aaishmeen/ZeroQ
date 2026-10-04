import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('zeroq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/users/login');
    const hasToken = !!localStorage.getItem('zeroq_token');
    if (error.response?.status === 401 && !isLoginEndpoint && hasToken) {
      // If unauthorized on an authenticated endpoint with an existing token, clear stored token and trigger global logout event
      localStorage.removeItem('zeroq_token');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);
