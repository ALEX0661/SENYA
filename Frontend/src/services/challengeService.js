import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Helper function to attach the authorization header
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const getDailyChallenges = async () => {
  const token = localStorage.getItem('accessToken');
  const userIdRaw = localStorage.getItem('userId');
  console.debug('challengeService.getDailyChallenges: userId from localStorage is', userIdRaw);
  if (!token || !userIdRaw || userIdRaw === 'undefined' || userIdRaw === 'null') {
    throw new Error('Authentication required. Please log in again.');
  }
  const userId = userIdRaw;
  try {
    const response = await apiClient.get(`/lessons/daily-challenges/${userId}`, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily challenge:', error);
    if (error.response && error.response.status === 400) {
      // The error is expected if the challenge was already completed today
      throw error;
    } else if (error.response && error.response.status === 404) {
      // No completed lessons to use for challenges
      throw error;
    } else if (error.response && error.response.status === 422) {
      throw new Error('Server could not process the request. Please ensure you are logged in properly.');
    }
    throw error;
  }
};

export const completeDailyChallenge = async () => {
  const token = localStorage.getItem('accessToken');
  const userIdRaw = localStorage.getItem('userId');
  console.debug('challengeService.completeDailyChallenge: userId from localStorage is', userIdRaw);
  if (!token || !userIdRaw || userIdRaw === 'undefined' || userIdRaw === 'null') {
    throw new Error('Authentication required. Please log in again.');
  }
  const userId = userIdRaw;
  try {
    const response = await apiClient.post(
      `/lessons/complete-daily-challenge/${userId}`,
      {},
      {
        headers: authHeader(token),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing daily challenge:', error);
    if (error.response && error.response.status === 422) {
      throw new Error('Server could not process the request. Please ensure you are logged in properly.');
    }
    throw error;
  }
};