import axios from 'axios';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const computedBaseURL = rawBase 
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`) 
  : '/api';

const axiosClient = axios.create({
  baseURL: computedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

axiosClient.interceptors.response.use(
  (response) => {
    // If SPA redirect returned HTML instead of API JSON
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
      return { success: false, data: null, message: 'Backend service is unreachable.' };
    }
    return response.data;
  },
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export default axiosClient;
