// src/services/adminService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Set up axios with authentication header - updated to use admin_token
const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Units
export const getAdminUnits = async (includeArchived = false) => {
  try {
    const response = await axios.get(`${API_URL}/admin/units/`, {
      headers: getAuthHeader(),
      params: { include_archived: includeArchived }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to fetch units');
  }
};

export const createUnit = async (unitData) => {
  try {
    // Create FormData object to match what the API expects
    const formData = new FormData();
    for (const key in unitData) {
      formData.append(key, unitData[key]);
    }
    
    const response = await axios.post(`${API_URL}/admin/units/`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to create unit');
  }
};

export const updateUnit = async (unitId, unitData) => {
  try {
    const formData = new FormData();
    for (const key in unitData) {
      formData.append(key, unitData[key]);
    }
    
    const response = await axios.put(`${API_URL}/admin/units/${unitId}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to update unit');
  }
};

export const archiveUnit = async (unitId) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/units/${unitId}/archive`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to archive unit');
  }
};

// Lessons
export const getLessonsByUnit = async (unitId, includeArchived = false) => {
  try {
    const response = await axios.get(`${API_URL}/admin/lessons/unit/${unitId}`, {
      headers: getAuthHeader(),
      params: { include_archived: includeArchived }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to fetch lessons');
  }
};

export const createLesson = async (lessonData) => {
  try {
    // For debugging - log what's being sent
    console.log("Creating lesson with data:");
    for (let [key, value] of lessonData.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }

    // Verify that unit_id is set
    if (!lessonData.get('unit_id')) {
      throw new Error('unit_id is required but not provided');
    }
    
    const response = await axios.post(`${API_URL}/admin/lessons/`, lessonData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error Details:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to create lesson');
  }
};

export const updateLesson = async (lessonId, lessonData) => {
  try {
    // For debugging - log what's being sent
    console.log("Updating lesson with data:");
    for (let [key, value] of lessonData.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }
    
    const response = await axios.put(`${API_URL}/admin/lessons/${lessonId}`, lessonData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error Details:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to update lesson');
  }
};

export const archiveLesson = async (lessonId) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/lessons/${lessonId}/archive`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to archive lesson');
  }
};

// Signs
export const getSignsByLesson = async (lessonId, includeArchived = false) => {
  try {
    const response = await axios.get(`${API_URL}/admin/signs/lesson/${lessonId}`, {
      headers: getAuthHeader(),
      params: { include_archived: includeArchived }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to fetch signs');
  }
};

// Updated createSign function in adminService.js
export const createSign = async (formData) => {
    try {
      // Log the FormData entries for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }
      
      const response = await axios.post(`${API_URL}/admin/signs/`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Failed to create sign');
    }
  };

export const updateSign = async (signId, formData) => {
  try {
    const response = await axios.put(`${API_URL}/admin/signs/${signId}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to update sign');
  }
};

export const archiveSign = async (signId) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/signs/${signId}/archive`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data);
    throw new Error(error.response?.data?.detail || 'Failed to archive sign');
  }
};




