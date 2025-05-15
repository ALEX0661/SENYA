// src/components/Flashcards/FlashcardList.jsx
import React, { useState, useEffect } from 'react';
import { getLessonDetails } from '../../services/lessonService';
import Flashcard from './Flashcard';
import './FlashcardList.css';

function FlashcardList({ lessonId }) {
  const [signs, setSigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    const fetchLessonSigns = async () => {
      try {
        setIsLoading(true);
        const lessonData = await getLessonDetails(lessonId, token);

        if (lessonData && lessonData.signs) {
          // Inject the lesson-level video_url onto each sign if missing
          const withVideo = lessonData.signs.map(sign => ({
            ...sign,
            video_url: sign.video_url || lessonData.video_url
          }));
          setSigns(withVideo);
        } else {
          setSigns([]);
        }
      } catch (err) {
        console.error('Error fetching signs:', err);
        setError('Failed to load flashcards');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonSigns();
  }, [lessonId, token]);

  if (isLoading) return <div className="loading">Loading flashcards...</div>;
  if (error)     return <div className="error-message">{error}</div>;
  if (!signs.length) return <div className="no-cards">No signs available for this lesson.</div>;

  return (
    <div className="flashcard-container">
      <div className="flashcards-list">
        {signs.map(sign => (
          <Flashcard key={sign.id} sign={sign} />
        ))}
      </div>
      <div className="flashcard-instructions">
        <p>Click on a card to flip and see the sign video!</p>
        <p>Swipe or use arrow keys to navigate between cards.</p>
      </div>
    </div>
  );
}

export default FlashcardList;
