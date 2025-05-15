// src/components/HeartModal.js
import React, { useState, useEffect } from 'react';
import { getHeartTimer } from '../services/userService';
import './HeartModal.css';

function HeartModal({ onClose, onPurchase, isZero = false }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeartTimer = async () => {
      try {
        setIsLoading(true);
        const secondsUntilNextHeart = await getHeartTimer();
        setTimeRemaining(secondsUntilNextHeart);
      } catch (error) {
        console.error('Error fetching heart timer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isZero) {
      fetchHeartTimer();
    }
  }, [isZero]);

  useEffect(() => {
    if (timeRemaining === null || !isZero) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Close modal or refresh hearts when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isZero, onClose]);

  // Format remaining time
  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return { minutes: '--', seconds: '--' };
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    };
  };

  const time = formatTime(timeRemaining);
  const progressValue = timeRemaining ? (300 - timeRemaining) / 300 * 100 : 0;

  return (
    <div className="heart-modal-overlay">
      <div className="heart-modal">
        <div className="heart-modal-icon">
          <div className="heart-icon-large">❤️</div>
          {isZero && <div className="heart-icon-x">×0</div>}
        </div>
        
        <h2>{isZero ? "Out of Hearts!" : "Not Enough Hearts"}</h2>
        
        <p className="heart-modal-message">
          {isZero 
            ? "You need at least one heart to continue your learning journey." 
            : "You don't have enough hearts to continue this lesson."}
        </p>
        
        {isZero && (
          <div className="heart-timer-container">
            <div className="heart-timer-label">
              Next heart in
            </div>
            
            {isLoading ? (
              <div className="heart-timer-loading">Loading timer...</div>
            ) : (
              <>
                <div className="heart-timer-display">
                  <span className="timer-digit">{time.minutes}</span>
                  <span className="timer-separator">:</span>
                  <span className="timer-digit">{time.seconds}</span>
                </div>
                
                <div className="heart-timer-progress-container">
                  <div 
                    className="heart-timer-progress-bar" 
                    style={{ width: `${progressValue}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="heart-modal-buttons">
          <button className="heart-modal-button-primary" onClick={onPurchase}>
            <span className="button-icon">💎</span>
            Buy Hearts
          </button>
          <button className="heart-modal-button-secondary" onClick={onClose}>
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeartModal;