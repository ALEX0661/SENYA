// src/components/Common/ProgressBar.jsx
import React from 'react';
import './ProgressBar.css';

function ProgressBar({ progress = 0 }) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(0, progress), 100);
  
  // Round to nearest whole percent for display
  const displayProgress = Math.round(safeProgress);
  
  return (
    <div className="progress-bars-container">
      <div 
        className="progress-bars-fill" 
        style={{ width: `${displayProgress}%` }}
        aria-valuenow={displayProgress}
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  );
}

export default ProgressBar;