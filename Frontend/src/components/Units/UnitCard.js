// src/components/Units/UnitCard.jsx
import React, { useEffect, useState } from 'react';
import ProgressBar from '../Common/ProgressBar';
import { getUnitProgress } from '../../services/userService';
import '../../styles/Units.css';

function UnitCard({ unit, onClick }) {
  const { id, title, description, order_index, status } = unit;
  // A unit is considered locked if the status is set to "locked"
  const isLocked = status.toLowerCase() === 'locked';
  const [unitProgress, setUnitProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUnitProgress = async () => {
      if (!isLocked && id) {
        setIsLoading(true);
        try {
          // Get unit progress percentage from the API (which is computed from lesson progress)
          const progressData = await getUnitProgress(id);
          setUnitProgress(progressData.progress_percentage || 0);
        } catch (error) {
          console.error("Failed to fetch unit progress:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUnitProgress();
  }, [id, isLocked]);

  return (
    <div 
      className={`unit-card ${status.toLowerCase()} ${isLocked ? 'locked' : 'unlocked'}`} 
      onClick={!isLocked ? onClick : undefined}
      role="button"
      tabIndex={0}
    >
      <div className="unit-header">
        <span className="unit-order">Unit {order_index}</span>
        <span className={`unit-status ${status.toLowerCase()}`}>
          {isLocked ? 'Locked' : (unitProgress >= 100 ? 'Completed' : 'Active')}
        </span>
      </div>
      <h2 className="unit-title">{title}</h2>
      <p className="unit-description">{description}</p>
      
      {!isLocked && (
        <div className="unit-progress-container">
          {isLoading ? (
            <div className="progress-loading">Loading...</div>
          ) : (
            <>
              <ProgressBar progress={unitProgress} />
              <span className="progress-text">{Math.round(unitProgress)}% Complete</span>
            </>
          )}
        </div>
      )}
      
      {isLocked && <div className="lock-overlay">🔒</div>}
    </div>
  );
}

export default UnitCard;
