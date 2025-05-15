import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminUnits from './AdminUnits';
import AdminLessons from './AdminLessons';
import AdminSigns from './AdminSigns';
import { LogOut, ChevronRight } from 'lucide-react';
import '../../styles/AdminDashboard.css';
import { logout } from '../../services/authService';

function AdminDashboard() {
  const [currentView, setCurrentView] = useState('units');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToUnits = () => {
    setCurrentView('units');
    setSelectedUnit(null);
    setSelectedLesson(null);
  };

  const navigateToLessons = (unit) => {
    setCurrentView('lessons');
    setSelectedUnit(unit);
    setSelectedLesson(null);
  };

  const navigateToSigns = (lesson) => {
    setCurrentView('signs');
    setSelectedLesson(lesson);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo"><h2>Senya</h2></div>
        <nav className="admin-nav">
          <button onClick={navigateToUnits} className={currentView === 'units' ? 'active' : ''}>
            Units
          </button>
          {selectedUnit && (
            <button onClick={() => navigateToLessons(selectedUnit)}
                    className={currentView === 'lessons' ? 'active' : ''}>
              Lessons
            </button>
          )}
          {selectedLesson && (
            <button onClick={() => navigateToSigns(selectedLesson)}
                    className={currentView === 'signs' ? 'active' : ''}>
              Signs
            </button>
          )}
          <button onClick={() => navigate('/admin/analytics')}
                  className={location.pathname === '/admin/analytics' ? 'active' : ''}>
            Analytics
          </button>
        </nav>
        <div className="admin-logout">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div className="admin-main">
        <div className="admin-header">
          <div className="breadcrumb">
            <button onClick={navigateToUnits} className={currentView === 'units' ? 'active' : ''}>
              Units
            </button>
            {selectedUnit && (
              <>
                <ChevronRight size={16} className="breadcrumb-separator" />
                <button onClick={() => navigateToLessons(selectedUnit)}
                        className={currentView === 'lessons' ? 'active' : ''}>
                  {selectedUnit.title}
                </button>
              </>
            )}
            {selectedLesson && (
              <>
                <ChevronRight size={16} className="breadcrumb-separator" />
                <button onClick={() => navigateToSigns(selectedLesson)}
                        className={currentView === 'signs' ? 'active' : ''}>
                  {selectedLesson.title}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="admin-content">
          {currentView === 'units' && <AdminUnits onUnitSelect={navigateToLessons} />}
          {currentView === 'lessons' && selectedUnit &&
            <AdminLessons unit={selectedUnit} onLessonSelect={navigateToSigns} />}
          {currentView === 'signs' && selectedLesson &&
            <AdminSigns lesson={selectedLesson} />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
