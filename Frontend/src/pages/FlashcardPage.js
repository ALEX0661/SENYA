// src/pages/FlashcardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnits } from '../services/lessonService';
import { getUserProgress } from '../services/lessonService';
import UnitCard from '../components/Units/UnitCard';
import Sidebar from '../components/Layout/Sidebar';
import UserStatus from '../components/Users/UserStatus';
import FlashcardList from '../components/Flashcards/FlashcardList';
import '../styles/FlashcardPage.css';

function FlashcardPage() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const fetchUnits = useCallback(async () => {
    try {
      const data = await getUnits(token);
      setUnits(data);
      
      // Check which lessons the user has completed
      const completedMap = {};
      for (const unit of data) {
        for (const lesson of unit.lessons) {
          try {
            const progress = await getUserProgress(lesson.id, token);
            completedMap[lesson.id] = progress.completed;
          } catch (err) {
            // If we get a 404, the user hasn't started this lesson yet
            completedMap[lesson.id] = false;
          }
        }
      }
      setCompletedLessons(completedMap);
    } catch (err) {
      setError(err.message || 'Failed to load units');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchUnits();
  }, [token, navigate, fetchUnits]);

  const handleUnitClick = (unit) => {
    setSelectedUnit(unit);
    setSelectedLesson(null);
  };

  const handleLessonClick = (lesson) => {
    // Only allow completed lessons to be selected
    if (completedLessons[lesson.id]) {
      setSelectedLesson(lesson);
    } else {
      alert('You need to complete this lesson first to access flashcards.');
    }
  };

  const handleBack = () => {
    if (selectedLesson) {
      setSelectedLesson(null);
    } else if (selectedUnit) {
      setSelectedUnit(null);
    }
  };

  if (isLoading) return (
    <div className="flashcard-page">
      <Sidebar activePage="flashcards" />
      <div className="flashcard-content">
        <div className="loading">Loading...</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flashcard-page">
      <Sidebar activePage="flashcards" />
      <div className="flashcard-content">
        <p className="error-message">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="flashcard-page">
      <Sidebar activePage="flashcards" />
      
      <div className="flashcard-content">
        {/* User status component at the top */}
        <div className="flashcard-header">
          <UserStatus />
        </div>
        
        <h1 className="flashcard-title">
          {selectedLesson 
            ? `Flashcards: ${selectedLesson.title}` 
            : selectedUnit 
              ? `${selectedUnit.title} Lessons` 
              : 'Flashcard Practice'}
        </h1>
        
        {(selectedUnit || selectedLesson) && (
          <button className="back-button" onClick={handleBack}>
            &larr; {selectedLesson ? 'Back to Lessons' : 'Back to Units'}
          </button>
        )}
        
        {selectedLesson ? (
          <FlashcardList lessonId={selectedLesson.id} />
        ) : selectedUnit ? (
          <div className="lessons-grid">
            {selectedUnit.lessons.map(lesson => (
              <div 
                key={lesson.id}
                className={`lesson-card ${completedLessons[lesson.id] ? 'completed' : 'locked'}`}
                onClick={() => handleLessonClick(lesson)}
              >
                <h3>{lesson.title}</h3>
                {!completedLessons[lesson.id] && <div className="lock-icon">🔒</div>}
                {completedLessons[lesson.id] && <div className="check-icon">✓</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="units-grid">
            {units.map(unit => (
              <UnitCard 
                key={unit.id} 
                unit={unit} 
                onClick={() => handleUnitClick(unit)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FlashcardPage;