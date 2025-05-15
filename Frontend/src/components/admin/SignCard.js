// src/components/SignCard.jsx
import React from 'react';
import '../styles/SignCard.css';

function SignCard({ sign, onEdit, onDelete }) {
  // Get the appropriate difficulty badge color
  const getDifficultyColor = (difficultyLevel) => {
    const level = difficultyLevel?.toLowerCase() || 'beginner';
    switch (level) {
      case 'intermediate': return 'difficulty-intermediate';
      case 'advanced': return 'difficulty-advanced';
      default: return 'difficulty-beginner';
    }
  };

  return (
    <div className="sign-card">
      <video 
        src={sign.video_url} 
        controls 
        className="sign-video"
        poster={sign.thumbnail_url}
        preload="metadata"
      />
      <h3 className="sign-title">{sign.text}</h3>
      <div className={`sign-difficulty ${getDifficultyColor(sign.difficulty_level)}`}>
        {sign.difficulty_level || 'Beginner'}
      </div>
      <div className="sign-actions">
        <button onClick={() => onEdit(sign)} className="edit-button">
          Edit
        </button>
        <button onClick={() => onDelete(sign)} className="archive-button">
          Archive
        </button>
      </div>
    </div>
  );
}

export default SignCard;