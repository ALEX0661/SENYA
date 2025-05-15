// src/pages/LessonPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonDetails } from '../services/lessonService';
import { getUserStatus, refreshHearts } from '../services/userService';
import { checkUserLoggedIn } from '../services/authService';
import LessonQuiz from '../components/Lesson/LessonQuiz';
import '../styles/LessonPage.css';

function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isRefreshingHearts, setIsRefreshingHearts] = useState(false);
  const [completionState, setCompletionState] = useState({
    completed: false,
    rubiesEarned: 0,
    nextLessonUnlocked: false
  });

  useEffect(() => {
    

    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch user status to check hearts
        const status = await getUserStatus();
        
        // Check if we need to redirect to login
        if (status.needsLogin) {
          navigate('/');
          return;
        }
        
        if (status.error) {
          setError(status.error);
          setLoading(false);
          return;
        }
        
        setUserStatus(status);
        
        // Check if user has hearts
        if (status.hearts <= 0) {
          // Attempt to refresh hearts
          setIsRefreshingHearts(true);
          try {
            const refreshedStatus = await refreshHearts();
            
            // Check for login redirect
            if (refreshedStatus.needsLogin) {
              navigate('/');
              return;
            }
            
            setUserStatus(refreshedStatus);
            
            // If still no hearts, show message
            if (refreshedStatus.hearts <= 0) {
              setError('You have no hearts left. Please wait for hearts to regenerate.');
              setLoading(false);
              return;
            }
          } catch (refreshError) {
            setError('Failed to refresh hearts: ' + refreshError.message);
            setLoading(false);
            return;
          } finally {
            setIsRefreshingHearts(false);
          }
        }
        
        // Fetch lesson details
        const lessonData = await getLessonDetails(lessonId);
        
        // Check for login redirect
        if (lessonData.needsLogin) {
          navigate('/');
          return;
        }
        
        if (lessonData.error) {
          setError(lessonData.error);
          setLoading(false);
          return;
        }
        
        setLesson(lessonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [lessonId, navigate]);

  const handleLessonComplete = (result = {}) => {
    setCompletionState({
      completed: true,
      rubiesEarned: result.rubiesEarned || 0,
      nextLessonUnlocked: result.nextLessonUnlocked || false
    });
  };

  const handleContinue = () => {
    navigate('/Home');
  };

  if (loading) return <div className="loading">Loading lesson...</div>;
  if (isRefreshingHearts) return <div className="loading">Refreshing hearts...</div>;
  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
      <button className="retry-button" onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  );
  if (!lesson) return <div className="error-message">Lesson not found</div>;

  // If the lesson is completed, show completion screen
  if (completionState.completed) {
    return (
      <div className="lesson-completion">
        <div className="completion-card">
          <h2>Lesson Completed!</h2>
          
          {completionState.rubiesEarned > 0 && (
            <div className="rubies-earned">
              <p>You earned:</p>
              <div className="rubies-display">
                <span className="rubies-count">{completionState.rubiesEarned}</span>
                <span className="rubies-icon">💎</span>
              </div>
            </div>
          )}
          
          {completionState.nextLessonUnlocked && (
            <p className="next-lesson-message">You've unlocked the next lesson!</p>
          )}
          
          <button className="continue-button" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lesson-container">
      <div className="lesson-header">
        <button className="back-button" onClick={() => navigate('/Home')}>
          &larr; Back to Units
        </button>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="user-hearts">
          {userStatus && (
            <>
              <span className="hearts-label">Hearts:</span>
              {Array(5).fill().map((_, i) => (
                <span key={i} className={i < userStatus.hearts ? "heart-filled" : "heart-empty"}>
                  {i < userStatus.hearts ? "❤️" : "🖤"}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      
      {lesson.video_url && (
        <div className="video-container">
          <video 
            controls 
            src={lesson.video_url}
            className="lesson-video"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      
      {lesson.description && (
        <div className="lesson-description">
          <h2>About this lesson</h2>
          <p>{lesson.description}</p>
        </div>
      )}
      
      <div className="lesson-signs">
        <h2>Signs in this lesson</h2>
        <div className="signs-grid">
          {lesson.signs && lesson.signs.map(sign => (
            <div key={sign.id} className="sign-card">
              <h3>{sign.text}</h3>
              <video 
                controls 
                src={sign.video_url}
                className="sign-video"
              >
                Your browser does not support the video tag.
              </video>
              <p>Difficulty: {sign.difficulty_level}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="lesson-quiz-section">
        <h2>Quiz</h2>
        <p>Test your knowledge of the signs you just learned!</p>
        <LessonQuiz lesson={lesson} onComplete={handleLessonComplete} />
      </div>
    </div>
  );
}

export default LessonPage;