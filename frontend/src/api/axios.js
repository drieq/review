import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // Django backend
  withCredentials: true, // sends session cookies
});

export default axiosInstance;