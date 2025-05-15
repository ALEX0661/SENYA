// src/components/admin/SignModal.js
import React, { useState, useEffect } from 'react';
import '../../styles/Modals.css';

function SignModal({ sign, onClose, onSave }) {
  const [text, setText] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('beginner');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data if editing an existing sign
  useEffect(() => {
    if (sign) {
      setText(sign.text || '');
      setDifficultyLevel(sign.difficulty_level || 'beginner');
      setVideoPreview(sign.video_url || '');
    }
  }, [sign]);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      // Create a preview URL for the video
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      
      // Clean up the URL when component unmounts
      return () => URL.revokeObjectURL(previewUrl);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!text) {
      alert('Please enter sign text');
      setIsSubmitting(false);
      return;
    }
    
    // If creating a new sign, video is required
    if (!sign && !videoFile) {
      alert('Please upload a video');
      setIsSubmitting(false);
      return;
    }
    
    // Prepare sign data for submission
    const signData = {
      text,
      difficulty_level: difficultyLevel,
    };
    
    // Only include video file if one was selected
    if (videoFile) {
      signData.video_file = videoFile;
    }
    
    // Call parent's onSave method
    Promise.resolve(onSave(signData))
      .catch((err) => {
        console.error('Error saving sign:', err);
        alert(`Failed to save sign: ${err.message}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{sign ? 'Edit Sign' : 'Add New Sign'}</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Text Field */}
            <div className="form-group">
              <label htmlFor="sign-text">Sign Text</label>
              <input
                id="sign-text"
                type="text"
                className="form-control"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter sign text"
                required
              />
            </div>
            
            {/* Difficulty Level */}
            <div className="form-group">
              <label htmlFor="difficulty-level">Difficulty Level</label>
              <select
                id="difficulty-level"
                className="form-control"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            {/* Video Upload */}
            <div className="form-group">
              <label htmlFor="video-upload">Upload Video</label>
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="file-input"
                // Only require video for new signs
                required={!sign}
              />
            </div>
            
            {/* Video Preview */}
            {videoPreview && (
              <div className="form-group">
                <label>Video Preview</label>
                <video 
                  className="video-preview" 
                  src={videoPreview} 
                  controls 
                  preload="metadata"
                />
              </div>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : sign ? 'Update Sign' : 'Create Sign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignModal;