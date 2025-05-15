// src/services/authService.js

import axios from 'axios';

// Point Axios at your FastAPI; override via .env if you like
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Set the baseURL once; all requests will prepend this
axios.defaults.baseURL = API_URL;

// Add interceptor to attach the authentication token to all requests
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// --- Regular user login ---
export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', {
      email,
      password,
    });

    // Save tokens/userId
    localStorage.setItem('accessToken', response.data.access_token);
    const userId = response.data.user.id;
    localStorage.setItem('userId', String(userId));
    localStorage.setItem('userRole', response.data.user.role || 'user');

    return {
      access_token: response.data.access_token,
      user_id: userId,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// --- Admin login ---
export const loginAdmin = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/admin/login', credentials);

    localStorage.setItem('accessToken', response.data.access_token);
    localStorage.setItem('userId', String(response.data.user.id));
    localStorage.setItem('userRole', 'admin');
    return true;
  } catch (error) {
    console.error('Admin login error:', error);
    throw new Error(error.response?.data?.detail || 'Admin login failed');
  }
};

// --- Sign up ---
export const signup = async (userData) => {
  try {
    const response = await axios.post('/api/auth/signup', userData);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// --- Logout & helpers ---
export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
};

export const isAuthenticated = () => !!localStorage.getItem('accessToken');
export const getUserRole    = () => localStorage.getItem('userRole') || 'user';
export const getAccessToken = () => localStorage.getItem('accessToken');
export const getUserId      = () => localStorage.getItem('userId');