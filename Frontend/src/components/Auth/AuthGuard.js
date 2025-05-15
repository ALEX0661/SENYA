// src/components/Auth/AuthGuard.js
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../../services/authService';

function AuthGuard({ children, requiredRole = null }) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const userRole = getUserRole();
  
  // Check if user is authenticated
  if (!authenticated) {
    // Redirect to login page, preserving the intended destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // If a specific role is required, check that too
  if (requiredRole && userRole !== requiredRole) {
    // Redirect based on role - admins to admin dashboard, users to home
    const redirectPath = userRole === 'admin' ? '/admin' : '/Home';
    return <Navigate to={redirectPath} replace />;
  }
  
  // User is authenticated and has the required role (if any)
  return children;
}

export default AuthGuard;