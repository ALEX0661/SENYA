import React from 'react';
import '../styles/CongratulationModal.css';
// 1) import the trophy from your assets folder
import trophie from '../assets/trophie.png';

function CongratulationModal({ onClose, rubiesEarned, streakCount }) {
  return (
    <div className="modal">
      <div className="modal-content celebration-modal">
        {/* Confetti elements */}
        <div className="confetti-container">
          <div className="confetti left-confetti"></div>
          <div className="confetti right-confetti"></div>
        </div>
        
        {/* Trophy image */}
        <div className="trophy-container">
          <img 
            src={trophie} 
            alt="Trophy" 
            className="trophy-image" 
          />
        </div>
        
        <h2 className="celebration-title">Congratulations!</h2>
        <p className="completion-message">You completed the lesson!</p>
        
        {/* Ruby reward badge */}
        <div className="reward-badge">
          <span className="ruby-icon">💎</span>
          <span className="reward-text">+{rubiesEarned}</span>
        </div>
        
        {/* Optional streak display */}
        {streakCount > 0 && (
          <p className="streak-count">
            Current streak: {streakCount} {streakCount === 1 ? "day" : "days"}
          </p>
        )}
        
        <button 
          onClick={onClose} 
          className="continue-button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default CongratulationModal;
