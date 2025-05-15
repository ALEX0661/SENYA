// src/pages/admin/AdminLessons.js
import React, { useState, useEffect } from 'react';
import { getLessonsByUnit, createLesson, updateLesson, archiveLesson } from '../../services/adminService';
import LessonModal from '../../components/admin/LessonModal';
import { Plus, Edit, Archive, ExternalLink } from 'lucide-react';
import '../../styles/AdminLessons.css';

function AdminLessons({ unit, onLessonSelect }) {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  
  // Fetch lessons data for the selected unit (only active ones)
  useEffect(() => {
    async function fetchLessons() {
      try {
        setIsLoading(true);
        const data = await getLessonsByUnit(unit.id, false); // false to exclude archived
        setLessons(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLessons();
  }, [unit]);
  
  // Handle opening the add lesson modal
  const handleAddLesson = () => {
    setCurrentLesson(null);
    setShowModal(true);
  };
  
  // Handle opening the edit lesson modal
  const handleEditLesson = (lesson) => {
    setCurrentLesson(lesson);
    setShowModal(true);
  };
  
  // Handle saving a lesson (create or update)
  const handleSaveLesson = async (formData) => {
    try {
      let updatedLesson;
      
      // Make sure unit_id is properly set in the FormData
      formData.set('unit_id', unit.id.toString());
      
      // Ensure numeric values are properly formatted
      if (formData.has('order_index')) {
        const orderIndex = formData.get('order_index');
        formData.set('order_index', parseInt(orderIndex, 10).toString());
      }
      
      if (formData.has('rubies_reward')) {
        const rubiesReward = formData.get('rubies_reward');
        formData.set('rubies_reward', parseInt(rubiesReward, 10).toString());
      }
      
      // Debug - log form data
      console.log("Form data being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      if (currentLesson) {
        // Update existing lesson
        updatedLesson = await updateLesson(currentLesson.id, formData);
        // Update the lessons list
        setLessons(lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l));
      } else {
        // Create new lesson
        updatedLesson = await createLesson(formData);
        // Add to the lessons list
        setLessons([...lessons, updatedLesson]);
      }
      
      setShowModal(false);
    } catch (err) {
      console.error("Error saving lesson:", err);
      setError(err.message || 'Failed to save lesson');
    }
  };
  
  // Handle archiving a lesson
  const handleArchiveLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to archive this lesson? It will no longer be visible in the dashboard.')) {
      try {
        await archiveLesson(lessonId);
        // Remove the archived lesson from the list
        setLessons(lessons.filter(l => l.id !== lessonId));
      } catch (err) {
        setError(err.message || 'Failed to archive lesson');
      }
    }
  };
  
  if (isLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading lessons...</p>
    </div>
  );
  
  return (
    <div className="admin-lessons">
      <div className="admin-controls">
        <h2>Lessons in {unit.title}</h2>
        <button className="add-button" onClick={handleAddLesson}>
          <Plus size={16} />
          <span>Add Lesson</span>
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {lessons.length === 0 ? (
        <div className="no-data">
          <p>No lessons found for this unit.</p>
          <button className="add-button-center" onClick={handleAddLesson}>
            <Plus size={16} />
            <span>Add Your First Lesson</span>
          </button>
        </div>
      ) : (
        <div className="lessons-grid">
          {lessons.map(lesson => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-header">
                <h3>{lesson.title}</h3>
                <div className="lesson-actions">
                  <button 
                    className="edit-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditLesson(lesson);
                    }}
                    title="Edit lesson"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="archive-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveLesson(lesson.id);
                    }}
                    title="Archive lesson"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
              <p className="lesson-description">{lesson.description || 'No description'}</p>
              <div className="lesson-footer">
                <div className="lesson-metadata">
                  <span className="lesson-reward">Rubies: {lesson.rubies_reward}</span>
                  <span className="lesson-order">Order: {lesson.order_index}</span>
                </div>
                <button 
                  className="open-button"
                  onClick={() => onLessonSelect(lesson)}
                  title="View signs"
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && (
        <LessonModal 
          lesson={currentLesson}
          onClose={() => setShowModal(false)}
          onSave={handleSaveLesson}
        />
      )}
    </div>
  );
}

export default AdminLessons;