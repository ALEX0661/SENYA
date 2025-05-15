// src/components/ExitConfirmationModal.jsx
import React from 'react';
import './ExitModal.css';
import sadCharacterLogo from '../assets/sad-character.png';

function ExitConfirmationModal({ onConfirm, onCancel, progressSaved = true }) {
  return (
    <div className="modal-overlay">
      <div className="exit-modal">
        <img 
          src={sadCharacterLogo} 
          alt="Sad character" 
          className="character-image" 
        />
        
        <h2 className="modal-title">Quit Game</h2>
        <p className="modal-message">Are you sure you want to quit?</p>
        
        <div className="modal-buttons">
          <button 
            className="cancel-btn" 
            onClick={onCancel}
          >
            No
          </button>
          <button 
            className="confirm-btn" 
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitConfirmationModal;