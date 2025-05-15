// src/components/Units/LessonCard.jsx
import React, { useEffect, useState } from 'react';
import ProgressBar from '../Common/ProgressBar';
import { useNavigate } from 'react-router-dom';
import { getLessonProgress } from '../../services/lessonService';
import '../../styles/Lessons.css';

function LessonCard({ lesson }) {
  const navigate = useNavigate();
  const [progressPercent, setProgressPercent] = useState(lesson.progress_bar || 0);

  const { id, title = 'Untitled Lesson', status = 'unlocked', image_url = null } = lesson || {};

  useEffect(() => {
    const fetchLessonProgress = async () => {
      if (status.toLowerCase() !== 'locked' && id) {
        try {
          const progress = await getLessonProgress(id);
          setProgressPercent(progress.progress || 0);
        } catch (error) {
          console.error("Failed to fetch lesson progress:", error);
        }
      }
    };
    fetchLessonProgress();
  }, [id, status]);

  const handleClick = () => {
    if (status.toLowerCase() === 'locked') {
      alert('Complete the previous lessons first to unlock this lesson.');
      return;
    }
    navigate(`/lessons/${id}`);
  };

  const getBackgroundGradient = () => {
    switch (status.toLowerCase()) {
      case 'completed': return 'linear-gradient(135deg, rgba(76,175,80,0.7), rgba(46,125,50,0.7))';
      case 'current': return 'linear-gradient(135deg, rgba(59,130,246,0.7), rgba(21,101,192,0.7))';
      case 'locked': return 'linear-gradient(135deg, rgba(158,158,158,0.8), rgba(97,97,97,0.8))';
      default: return 'linear-gradient(135deg, rgba(224,242,254,0.7), rgba(144,202,249,0.7))';
    }
  };

  // Fix image URL handling
  const getImageUrl = (url) => {
    if (!url) return null;
    
    // Handle relative URLs properly
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    // Handle absolute URLs or already properly formatted URLs
    return url;
  };

  const imgUrl = getImageUrl(image_url);

  // Combine gradient overlay and image in one backgroundImage with proper layering
  const style = {
    backgroundImage: imgUrl
      ? `${getBackgroundGradient()}, url("${imgUrl}")`
      : getBackgroundGradient(),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: imgUrl ? '#fff' : undefined,
    position: 'relative' // Ensure proper positioning
  };

  return (
    <div
      className={`lesson-cards ${status.toLowerCase() === 'locked' ? 'lesson-cards-locked' : ''}`}
      onClick={handleClick}
      style={style}
    >
      <div className="lesson-content">
        {title.match(/lesson\s*(\d+)/i) && (
          <div className="lesson-number">Lesson {title.match(/lesson\s*(\d+)/i)[1]}</div>
        )}
        <h3 className="lesson-title">{title.replace(/lesson\s*\d+\s*[-:]\s*/i, '')}</h3>
        <div className="lesson-progress">
          <div className="lesson-progress-label">
            Completed {Math.round(progressPercent)}%
          </div>
          <ProgressBar progress={progressPercent} />
        </div>
      </div>
      {status.toLowerCase() === 'locked' && <div className="lock-overlay">🔒</div>}
    </div>
  );
}

export default LessonCard;