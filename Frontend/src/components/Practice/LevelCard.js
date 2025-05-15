// components/Practice/LevelCard.js
import React from 'react';
import './LevelCard.css';

function LevelCard({ level, onSelect }) {
  return (
    <div 
      className={`level-card ${level.unlocked ? 'unlocked' : 'locked'}`}
      onClick={onSelect}
    >
      <div className="level-header">
        <h2>{level.name}</h2>
        {!level.unlocked && <span className="lock-icon">🔒</span>}
      </div>
      <p>{level.description}</p>
      <div className="level-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${level.progress}%` }}
          ></div>
        </div>
        <span>{level.progress}% Complete</span>
      </div>
    </div>
  );
}

export default LevelCard;