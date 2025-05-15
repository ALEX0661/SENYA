import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Add authorization token to requests
const authHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

export const getUnitsAndLessons = async (token) => {
  const response = await apiClient.get('/lessons/units/', {
    headers: authHeader(token)
  });
  return response.data;
};

export const getUnitDetails = async (unitId, token) => {
  const response = await apiClient.get(`/lessons/units/${unitId}`, {
    headers: authHeader(token)
  });
  return response.data;
};