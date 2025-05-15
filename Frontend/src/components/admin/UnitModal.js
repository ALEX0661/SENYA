// src/components/admin/UnitModal.js
import React, { useState, useEffect } from 'react';
import '../../styles/Modals.css';

function UnitModal({ unit, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [status, setStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with unit data if editing
  useEffect(() => {
    if (unit) {
      setTitle(unit.title || '');
      setDescription(unit.description || '');
      setOrderIndex(unit.order_index || 0);
      setStatus(unit.status || 'active');
    }
  }, [unit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!title.trim()) {
      alert('Title is required');
      setIsSubmitting(false);
      return;
    }
    
    const unitData = {
      title,
      description,
      order_index: orderIndex,
      status
    };
    
    // Save and handle promise
    Promise.resolve(onSave(unitData))
      .catch(err => {
        console.error('Error saving unit:', err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{unit ? 'Edit Unit' : 'Add New Unit'}</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">Unit Title</label>
              <input
                type="text"
                id="title"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter unit title"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter unit description"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderIndex">Order Index</label>
                <input
                  type="number"
                  id="orderIndex"
                  className="form-control"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
              {isSubmitting ? 'Saving...' : unit ? 'Update Unit' : 'Create Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnitModal;