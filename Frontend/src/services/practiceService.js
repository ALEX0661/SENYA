// services/practiceService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Automatically attach token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic error handler
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response?.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
    return Promise.reject(error);
  }
  
  return Promise.reject(error);
};

export const getPracticeSigns = async (difficulty) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found in localStorage');
      return [];
    }
    
    try {
      const response = await apiClient.get(`/practice/signs/${userId}/${difficulty}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get practice signs:', error);
      return [];
    }
  };

export const updateLevelProgress = async (levelId, gameId, score, heartsLost = 0) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.error('User ID not found in localStorage');
    throw new Error('User ID not found');
  }
  
  try {
    const response = await apiClient.post(`/practice/update-progress/${userId}`, {
      level_id: levelId,
      game_id: gameId,
      score: score,
      hearts_lost: heartsLost
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update level progress:', error);
    return handleApiError(error);
  }
};

export const getUserHearts = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.error('User ID not found in localStorage');
    return { hearts: 5, rubies: 0, highScores: {} }; // Default values
  }
  
  try {
    const response = await apiClient.get(`/practice/hearts/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get user hearts:', error);
    return { hearts: 5, rubies: 0, highScores: {} }; // Default values on error
  }
};

// New function to get levels and games
export const getLevelsAndGames = async (userId) => {
  if (!userId) {
    console.error('User ID not found');
    return { levels: [], overall_progress: 0 };
  }
  
  try {
    const response = await apiClient.get(`/practice/levels/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get practice levels and games:', error);
    return { levels: [], overall_progress: 0 };
  }
};

// Additional function to get high scores for games
export const getGameHighScores = async (userId) => {
  if (!userId) {
    console.error('User ID not found');
    return {};
  }
  
  try {
    const response = await apiClient.get(`/practice/high-scores/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get high scores:', error);
    return {};
  }
};