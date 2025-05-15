import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import {
  FaHome,
  FaLayerGroup,
  FaGamepad,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import './Sidebar.css';

function Sidebar({ activePage }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-circle">
          <span>S</span>
        </div>
        <p className="sidebar-logo-text">Senya</p>
      </div>
      
      <nav className="sidebar-menu">
        <Link to="/Home" className={activePage === 'home' ? 'active' : ''}>
          <div className="sidebar-item">
            <FaHome className="sidebar-icon" />
            <span className="sidebar-text">Home</span>
          </div>
        </Link>
        
        <Link to="/flashcards" className={activePage === 'flashcards' ? 'active' : ''}>
          <div className="sidebar-item">
            <FaLayerGroup className="sidebar-icon" />
            <span className="sidebar-text">Flashcards</span>
          </div>
        </Link>
        
        <Link to="/practice" className={activePage === 'practice' ? 'active' : ''}>
          <div className="sidebar-item">
            <FaGamepad className="sidebar-icon" />
            <span className="sidebar-text">Practice</span>
          </div>
        </Link>
        
        <Link to="/profile" className={activePage === 'profile' ? 'active' : ''}>
          <div className="sidebar-item">
            <FaUser className="sidebar-icon" />
            <span className="sidebar-text">Profile</span>
          </div>
        </Link>
      </nav>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-button">
          <FaSignOutAlt className="sidebar-icon" />
        </button>
      </div>
    </div>
  );
}

export default Sidebar;