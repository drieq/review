import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
  baseURL: 'http://localhost:8000', // change to your API base URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 errors and attempt token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try to refresh if the response was 401 and we haven't retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh');

      if (!refreshToken) {
        // No refresh token available, clear all auth data
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('username');
        // Dispatch a custom event to show the session expired modal
        window.dispatchEvent(new Event('sessionExpired'));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken,
        }, {
          withCredentials: true
        });

        const newAccessToken = response.data.access;

        localStorage.setItem('access', newAccessToken);

        // Update the header and retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, clear all auth data
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('username');
        // Dispatch a custom event to show the session expired modal
        window.dispatchEvent(new Event('sessionExpired'));
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;