// src/utils/errorHandler.js

/**
 * Standard error handler for API responses
 * @param {Error} error - The error object received from API call
 * @param {boolean} checkAuth - Whether to check for authentication errors
 * @returns {Object} Error information object
 */
export const handleApiError = (error, checkAuth = true) => {
    // Check if this is an authentication error
    if (checkAuth && error.message === 'No authentication token found') {
      return { error: 'User not logged in', needsLogin: true };
    }
    
    const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message || 
                         'An unexpected error occurred';
                         
    if (error.response?.status === 401 || error.response?.status === 403) {
      return { error: errorMessage, needsLogin: true };
    }
    
    return { error: errorMessage };
  };
  
  /**
   * Creates an axios request config with authentication
   * @param {string} token - The authentication token
   * @returns {Object} Axios request configuration object
   */
  export const createAuthConfig = (token) => {
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };