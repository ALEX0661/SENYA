// src/services/shopService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({ baseURL: API_URL });

// Automatically attach token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic 401 error handler
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
  }
  throw error;
};

export const purchaseHearts = async (packageId) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  
  try {
    const response = await apiClient.post('/shop/purchase-hearts', {
      user_id: userId,
      package_id: packageId
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getHeartPackages = async () => {
  try {
    const response = await apiClient.get('/shop/heart-packages');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};