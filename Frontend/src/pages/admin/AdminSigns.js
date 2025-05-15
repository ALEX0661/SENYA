// src/pages/admin/AdminSigns.js
import React, { useState, useEffect } from 'react';
import { getSignsByLesson, createSign, updateSign, archiveSign } from '../../services/adminService';
import SignModal from '../../components/admin/SignModal';
import { Plus, Edit, Archive } from 'lucide-react';
import '../../styles/AdminSigns.css';

function AdminSigns({ lesson }) {
  const [signs, setSigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSign, setCurrentSign] = useState(null);
  
  // Fetch active signs data for the selected lesson
  useEffect(() => {
    async function fetchSigns() {
      try {
        setIsLoading(true);
        const data = await getSignsByLesson(lesson.id, false); // false to exclude archived
        setSigns(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load signs');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSigns();
  }, [lesson]);
  
  // Handle opening the add sign modal
  const handleAddSign = () => {
    setCurrentSign(null);
    setShowModal(true);
  };
  
  // Handle opening the edit sign modal
  const handleEditSign = (sign) => {
    setCurrentSign(sign);
    setShowModal(true);
  };
  
  // Handle saving a sign (create or update)
  const handleSaveSign = async (signData) => {
    try {
      let updatedSign;
      
      // Create a FormData object for file upload
      const formData = new FormData();
      formData.append('lesson_id', lesson.id);
      formData.append('text', signData.text);
      formData.append('difficulty_level', signData.difficulty_level);
      
      if (signData.video_file) {
        formData.append('file', signData.video_file);
      }
      
      if (currentSign) {
        // Update existing sign
        updatedSign = await updateSign(currentSign.id, formData);
        // Update the signs list
        setSigns(signs.map(s => s.id === updatedSign.id ? updatedSign : s));
      } else {
        // Create new sign
        updatedSign = await createSign(formData);
        // Add to the signs list
        setSigns([...signs, updatedSign]);
      }
      
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to save sign');
    }
  };
  
  // Handle archiving a sign
  const handleArchiveSign = async (signId) => {
    if (window.confirm('Are you sure you want to archive this sign? It will no longer be visible in the dashboard.')) {
      try {
        await archiveSign(signId);
        // Remove the archived sign from the list
        setSigns(signs.filter(s => s.id !== signId));
      } catch (err) {
        setError(err.message || 'Failed to archive sign');
      }
    }
  };
  
  // Render video preview
// Updated renderVideoPreview function for AdminSigns.js
const renderVideoPreview = (videoUrl) => {
  if (!videoUrl) {
    return (
      <div className="sign-video-placeholder">
        <p>No video available</p>
      </div>
    );
  }
  
  return (
    <video 
      className="sign-video-preview" 
      src={videoUrl} 
      controls 
      preload="metadata"
      playsInline // Better mobile support
    />
  );
};
  
  if (isLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading signs...</p>
    </div>
  );
  
  return (
    <div className="admin-signs">
      <div className="admin-controls">
        <h2>Signs in {lesson.title}</h2>
        <button className="add-button" onClick={handleAddSign}>
          <Plus size={16} />
          <span>Add Sign</span>
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {signs.length === 0 ? (
        <div className="no-data">
          <p>No signs found for this lesson.</p>
          <button className="add-button-center" onClick={handleAddSign}>
            <Plus size={16} />
            <span>Add Your First Sign</span>
          </button>
        </div>
      ) : (
        <div className="signs-grid">
          {signs.map(sign => (
            <div key={sign.id} className="sign-card">
              <div className="sign-header">
                <h3>{sign.text}</h3>
                <div className="sign-actions">
                  <button 
                    className="edit-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSign(sign);
                    }}
                    title="Edit sign"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="archive-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveSign(sign.id);
                    }}
                    title="Archive sign"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
              
              <div className="sign-video">
                {renderVideoPreview(sign.video_url)}
              </div>
              
              <div className="sign-footer">
                <span className="difficulty-badge difficulty-{sign.difficulty_level}">
                  {sign.difficulty_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && (
        <SignModal 
          sign={currentSign}
          onClose={() => setShowModal(false)}
          onSave={handleSaveSign}
        />
      )}
    </div>
  );
}

export default AdminSigns;