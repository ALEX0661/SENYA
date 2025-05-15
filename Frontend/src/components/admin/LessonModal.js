// src/components/admin/LessonModal.js
import React, { useState, useEffect } from 'react';
import '../../styles/Modals.css';

function LessonModal({ lesson, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rubiesReward, setRubiesReward] = useState(0);
  const [orderIndex, setOrderIndex] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with lesson data if editing
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '');
      setDescription(lesson.description || '');
      setRubiesReward(lesson.rubies_reward || 0);
      setOrderIndex(lesson.order_index || 0);
      
      // Show existing image if available
      if (lesson.image_url) {
        setImagePreview(lesson.image_url);
      }
    }
  }, [lesson]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!title.trim()) {
      alert('Title is required');
      setIsSubmitting(false);
      return;
    }
    
    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('title', title.trim());
    
    // Only add description if it's not empty
    if (description && description.trim()) {
      formData.append('description', description.trim());
    } else {
      formData.append('description', ''); // Sending empty string for null
    }
    
    // Ensure numeric values are sent as strings
    formData.append('rubies_reward', rubiesReward.toString());
    formData.append('order_index', orderIndex.toString());
    
    // Add image if selected
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    // Save and handle promise
    Promise.resolve(onSave(formData))
      .catch(err => {
        console.error('Error saving lesson:', err);
        alert(`Failed to save lesson: ${err.message || 'Unknown error'}`);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">Lesson Title</label>
              <input
                type="text"
                id="title"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter lesson title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-control"
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter lesson description"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="image">Lesson Image</label>
              <input
                type="file"
                id="image"
                className="form-control"
                onChange={handleImageChange}
                accept="image/*"
              />
              {imagePreview && (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Lesson preview" 
                    className="image-preview" 
                  />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={removeImage}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rubiesReward">Rubies Reward</label>
                <input
                  type="number"
                  id="rubiesReward"
                  className="form-control"
                  value={rubiesReward}
                  onChange={(e) => setRubiesReward(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="orderIndex">Order Index</label>
                <input
                  type="number"
                  id="orderIndex"
                  className="form-control"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>
          
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
              {isSubmitting ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LessonModal;