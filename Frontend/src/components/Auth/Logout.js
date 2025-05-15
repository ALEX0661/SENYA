// src/components/Auth/Logout.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';

function Logout() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Execute logout logic
    logout();
    
    // Redirect to login page
    navigate('/', { replace: true });
  }, [navigate]);
  
  // This component doesn't render anything
  return null;
}

export default Logout;