import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({ baseURL: API_URL });

// Automatically attach token to requests.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic 401 error handler.
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
  }
  throw error;
};

export const getProfile = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Assuming your user profile endpoint remains at `/users/{userId}`
    const resp = await apiClient.get(`/users/${userId}`);
    return resp.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getUserStatus = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('User ID not found');
    try {
      const response = await apiClient.get(`/status/${userId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  };

export const refreshHearts = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Updated endpoint: `/lessons/refresh-hearts/{userId}`
    const resp = await apiClient.post(`/lessons/refresh-hearts/${userId}`);
    return resp.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const checkUnitStatus = async (unitId) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Updated endpoint: `/lessons/unit-status/{userId}/{unitId}`
    const resp = await apiClient.get(`/lessons/unit-status/${userId}/${unitId}`);
    return resp.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const checkLessonStatus = async (lessonId) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Updated endpoint: `/lessons/lesson-status/{userId}/{lessonId}`
    const resp = await apiClient.get(`/lessons/lesson-status/${userId}/${lessonId}`);
    return resp.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getUnitProgress = async (unitId) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Updated endpoint: `/lessons/unit-progress/{userId}/{unitId}`
    const resp = await apiClient.get(`/lessons/unit-progress/${userId}/${unitId}`);
    return resp.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getLessonProgress = async (lessonId) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Updated endpoint: `/lessons/lesson-progress/{userId}/{lessonId}`
    const resp = await apiClient.get(`/lessons/lesson-progress/${userId}/${lessonId}`);
    return resp.data;
  } catch (e) {
    return handleApiError(e);
  }
};

export const getUserProfile = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Use the updated endpoint with the userId in the URL
    const response = await apiClient.get(`/profile/${userId}`);
    return {
      name: response.data.account.name,
      email: response.data.account.email,
      profile_url: response.data.profile.profile_url,
      progress: response.data.profile.progress || {},
      rubies: response.data.profile.rubies,
      hearts: response.data.profile.hearts,
      streak: response.data.profile.streak,
      certificate: response.data.profile.certificate,
      updated_at: response.data.profile.updated_at
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserProfile = async (profileData) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    // Use the updated endpoint with the userId in the URL for updates as well
    const response = await apiClient.put(`/profile/${userId}`, profileData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Modified function to handle profile picture uploads to local storage
export const uploadProfilePicture = async (file) => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  
  try {
    // Create FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the file to the server
    const uploadResponse = await apiClient.post(
      `/profile/${userId}/upload-profile-picture`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // If successful, return the new URL
    if (uploadResponse.data.success) {
      return { 
        success: true, 
        url: uploadResponse.data.profile_url 
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to upload profile picture' 
      };
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to upload profile picture' 
    };
  }
};

export const generateCertificate = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('User ID not found');
  try {
    const response = await apiClient.post(`/profile/${userId}/certificate`);
    
    // Store the certificate in local storage
    if (response.data.success) {
      localStorage.setItem('userCertificate', JSON.stringify(response.data.certificate));
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getHeartTimer = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) throw new Error('User ID not found')
  try {
    const resp = await apiClient.get(`/status/${userId}/heart-timer`)
    // backend returns { seconds_until_next_heart: N }
    return resp.data.seconds_until_next_heart
  } catch (e) {
    return handleApiError(e)
  }
}