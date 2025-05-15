import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Add authorization token to requests.
const authHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

export const getUnits = async (token) => {
  const userId = localStorage.getItem('userId'); // if needed by your endpoint
  if (!userId) throw new Error('User ID not found');
  const response = await apiClient.get(`/lessons/units/`, {
    headers: authHeader(token)
  });
  return response.data;
};

export const getLessons = async (token) => {
  const response = await apiClient.get('/lessons/', {
    headers: authHeader(token)
  });
  return response.data;
};

export const getLessonDetails = async (lessonId, token) => {
  try {
    console.log(`Fetching details for lesson ${lessonId} with token ${token?.substring(0, 10)}...`);
    const response = await apiClient.get(`/lessons/${lessonId}`, {
      headers: authHeader(token)
    });
    console.log('Lesson details response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching lesson details for ${lessonId}:`, error);
    return null;
  }
};

export const updateProgress = async (lessonId, progressData, token) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  const response = await apiClient.patch(`/lessons/update-progress/${userId}/${lessonId}`, progressData, {
    headers: authHeader(token)
  });
  return response.data;
};

export const getUserProgress = async (lessonId, token) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  const response = await apiClient.get(`/lessons/user-progress/${userId}/${lessonId}`, {
    headers: authHeader(token)
  });
  return response.data;
};

export const getLessonProgress = async (lessonId) => {
  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  
  try {
    console.log(`Fetching progress for lesson ${lessonId} for user ${userId}`);
    // This endpoint is public per backend change
    const response = await apiClient.get(`/lessons/lesson-progress/${userId}/${lessonId}`);
    console.log('Progress response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return { progress: 0, completed: false };
  }
};