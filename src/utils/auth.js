// src/utils/auth.js
export const authUtils = {
    // Get the stored token
    getToken: () => localStorage.getItem('authToken'),
  
    // Store the token
    setToken: (token) => localStorage.setItem('authToken', token),
  
    // Remove the token
    removeToken: () => localStorage.removeItem('authToken'),
  
    // Check if user is authenticated
    isAuthenticated: () => !!localStorage.getItem('authToken'),
  
    // Get auth header
    getAuthHeader: () => ({
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }),
  
    // Logout user
    logout: () => {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  };