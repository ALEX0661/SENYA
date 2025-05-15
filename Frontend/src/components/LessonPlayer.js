import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getLessonDetails,
  updateProgress,
  getLessonProgress
} from '../services/lessonService';
import { getUserStatus, refreshHearts } from '../services/userService';
import CongratulationModal from '../components/CongratulationModal';
import NoHeartsModal from '../components/NoHeartsModal';
import ZeroHeartsModal from '../components/ZeroHeartsModal';
import ExitConfirmationModal from '../components/ExitConfirmationModal';
import ProgressBar from '../components/Common/ProgressBar';
import HeartModal from '../components/HeartModal';
import '../styles/LessonPlayer.css';
import '../components/HeartModal.css';

function LessonPlayer() {
  const params = useParams();
  // Detect if we're in challenge mode via challengeId param
  const isChallenge = Boolean(params.challengeId);
  const lessonId = params.lessonId || params.challengeId;
  const navigate = useNavigate();

  // Local state
  const [lesson, setLesson] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('video'); // "video", "showName", "quiz"
  const [signIndex, setSignIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState('');
  const [quizFeedbackType, setQuizFeedbackType] = useState(''); // 'correct' or 'incorrect'
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showNoHeartsModal, setShowNoHeartsModal] = useState(false);
  const [showZeroHeartsModal, setShowZeroHeartsModal] = useState(false);
  const [showExitConfirmationModal, setShowExitConfirmationModal] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const [showHeartLoss, setShowHeartLoss] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // User status
  const [hearts, setHearts] = useState(5);
  const [rubies, setRubies] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rubiesReward, setRubiesReward] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Refs for resetting video
  const videoRef = useRef(null);
  const contentCardRef = useRef(null);

  // Compute progress percentage
  const calculateLessonProgress = () => {
    if (!lesson?.signs?.length) return 0;
    const stepsPerSign = 3;
    const totalSteps = lesson.signs.length * stepsPerSign;
    let completed = signIndex * stepsPerSign;
    if (step === 'showName') completed += 1;
    else if (step === 'quiz') completed += 2;
    return Math.round((completed / totalSteps) * 100);
  };

  // Heart animation effect
  useEffect(() => {
    if (heartPulse) {
      const timer = setTimeout(() => {
        setHeartPulse(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [heartPulse]);

  // 1) Load lesson + resume position (skip resume if challenge)
  useEffect(() => {
    async function fetchData() {
      if (!lessonId) {
        setError('Invalid lesson or challenge ID.');
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('accessToken');
      try {
        // Load lesson metadata
        const lessonData = await getLessonDetails(lessonId, token);
        setRubiesReward(lessonData.rubies_reward || 0);

        let savedProgress = 0;
        let completed = false;
        if (!isChallenge) {
          // Only fetch saved progress for normal lessons
          const progressData = await getLessonProgress(lessonId, token);
          savedProgress = progressData.progress || 0;
          completed = progressData.completed;
        }

        lessonData.progress_bar = savedProgress;
        setIsCompleted(completed);
        setLesson(lessonData);

        // If resume needed, compute where to resume
        if (!isChallenge && savedProgress > 0 && lessonData.signs?.length) {
          const stepsPerSign = 3;
          const totalSteps = lessonData.signs.length * stepsPerSign;
          const completedSteps = Math.floor((savedProgress / 100) * totalSteps);

          const newSignIndex = Math.floor(completedSteps / stepsPerSign);
          const remainder = completedSteps % stepsPerSign;

          setSignIndex(Math.min(newSignIndex, lessonData.signs.length - 1));
          if (remainder === 0) setStep('video');
          else if (remainder === 1) setStep('showName');
          else setStep('quiz');
        }
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [lessonId, isChallenge]);

  // 2) Load user status
  useEffect(() => {
    async function fetchStatus() {
      setIsLoading(true);
      try {
        const status = await getUserStatus();
        setHearts(status.hearts);
        setRubies(status.rubies);
        setStreak(status.streak);
        if (status.hearts <= 0) {
          setShowZeroHeartsModal(true);
        }
      } catch (err) {
        console.error('Failed to fetch user status:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, []);

  // Show heart loss animation
  const triggerHeartLossAnimation = () => {
    // Create and animate a floating heart with improved animation
    if (contentCardRef.current) {
      const heartLoss = document.createElement('div');
      heartLoss.className = 'heart-loss-animation';
      heartLoss.innerHTML = '❤️';
      contentCardRef.current.appendChild(heartLoss);
      
      // Apply animation
      heartLoss.style.animation = 'heartFloatUp 1.5s ease-out forwards';
      
      // Remove after animation completes
      setTimeout(() => {
        if (heartLoss.parentNode) {
          heartLoss.parentNode.removeChild(heartLoss);
        }
      }, 1500);
    }
    
    // Pulse the hearts display
    setHeartPulse(true);
    setShowHeartLoss(true);
    
    // Hide the -1 indicator after animation
    setTimeout(() => {
      setShowHeartLoss(false);
    }, 1500);
  };

  // Guard rendering
  if (error) return <p className="error">Error: {error}</p>;
  if (isLoading) return <div className="loading">Loading...</div>;
  if (!lesson) return <div className="loading">Loading lesson...</div>;

  const currentSign = lesson.signs[signIndex];

  // Quiz options
  const getQuizOptions = () => {
    const correct = currentSign.text;
    const others = lesson.signs.filter((_, i) => i !== signIndex);
    const wrong = others.length
      ? others[Math.floor(Math.random() * others.length)].text
      : 'Unknown';
    return Math.random() > 0.5 ? [correct, wrong] : [wrong, correct];
  };

  // Save progress helper (skip in challenge)
  const saveProgress = async () => {
    if (isCompleted || isChallenge) return;
    const token = localStorage.getItem('accessToken');
    const payload = {
      progress: calculateLessonProgress(),
      is_correct: true,
      current_question: signIndex,
      hearts_used: 0
    };
    try {
      await updateProgress(lessonId, payload, token);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  // Exit handlers
  const handleExitClick = () => setShowExitConfirmationModal(true);
  const handleCancelExit = () => setShowExitConfirmationModal(false);
  const handleConfirmExit = async () => {
    await saveProgress();
    navigate('/Home');
  };

  // Step transitions
  const handleVideoEnd = async () => {
    setStep('showName');
    await saveProgress();
  };
  const handleExplanationEnd = async () => {
    setStep('quiz');
    setQuizFeedback('');
    setQuizFeedbackType('');
    await saveProgress();
  };

  // Quiz answer handler
  const handleOptionSelect = async (opt) => {
    setSelectedOption(opt);
    const token = localStorage.getItem('accessToken');
    const isCorrect = opt === currentSign.text;

    if (isCorrect) {
      // Set visual feedback for correct answer
      setQuizFeedback('Correct!');
      setQuizFeedbackType('correct');
      
      setTimeout(async () => {
        if (signIndex < lesson.signs.length - 1) {
          const next = signIndex + 1;
          setSignIndex(next);
          setStep('video');
          setSelectedOption(null);
          if (!isChallenge) {
            await updateProgress(lessonId, {
              progress: calculateLessonProgress(),
              is_correct: true,
              current_question: next,
              hearts_used: 0
            }, token);
          }
        } else {
          // Last sign → complete lesson
          if (!isChallenge) {
            const res = await updateProgress(lessonId, {
              progress: 100,
              is_correct: true,
              current_question: signIndex,
              hearts_used: 0
            }, token);
            setIsCompleted(true);
            setHearts(res.hearts_remaining);
            setRubies(r => r + (res.rubies_earned || 0));
            const status = await getUserStatus();
            setStreak(status.streak);
            setShowCongratsModal(true);
          } else {
            // in challenge, just show congrats
            setIsCompleted(true);
            setShowCongratsModal(true);
          }
        }
      }, 1200);
    } else {
      // Set visual feedback for incorrect answer
      setQuizFeedback('Incorrect! You lost one heart.');
      setQuizFeedbackType('incorrect');
      
      // Trigger heart loss animation
      triggerHeartLossAnimation();
      
      if (!isChallenge) {
        const res = await updateProgress(lessonId, {
          progress: calculateLessonProgress(),
          is_correct: false,
          current_question: signIndex,
          hearts_used: 1
        }, token);
        
        setTimeout(() => {
          setHearts(res.hearts_remaining);
          setSelectedOption(null);
          
          if (res.hearts_remaining <= 0) {
            setShowZeroHeartsModal(true);
          }
        }, 1500);
      } else {
        setTimeout(() => {
          setSelectedOption(null);
        }, 1500);
      }
    }
  };

  // Modal handlers
  const handleModalClose = () => {
    setShowCongratsModal(false);
    navigate('/Home', { state: { showCongrats: true, rubiesEarned: rubiesReward } });
  };
  const handlePurchaseHearts = () => navigate('/shop/hearts');
  const handleCheckHearts = async () => {
    try {
      const res = await refreshHearts();
      if (res.hearts > 0) {
        setHearts(res.hearts);
        setShowZeroHeartsModal(false);
      }
    } catch (err) {
      console.error('Error refreshing hearts:', err);
    }
  };

  // Build video URL
  let videoUrl = lesson.video_url || '';
  if (lesson.video_filename) {
    videoUrl = `https://senya-video-server.10bbfdc0897bf4e826451e6e6054ffff.workers.dev/${lesson.video_filename}`;
  }

  return (
    <div className="lesson-view">
      <div className="wave-overlay"></div>
      <div className="lessons-content">
        {/* Header with Back button and Hearts */}
        <div className="lesson-header">
          <button onClick={handleExitClick} className="back-button">
            <span className="circle-icon">←</span>
          </button>
          <div className="progress-container">
            <ProgressBar progress={calculateLessonProgress()} />
          </div>
          <div className={`hearts-display ${heartPulse ? 'pulse' : ''}`}>
            <span className="heart-icon">
              ❤️
              {showHeartLoss && <span className="heart-loss">-1</span>}
            </span>
            <span className="heart-count">{hearts}</span>
          </div>
        </div>

        {/* Main Content Area with curved white container */}
        <div className="main-content-area">
          <div className="content-card" ref={contentCardRef}>
            {step === 'video' && (
              <>
                <h3 className="lesson-instruction">Learn new sign!</h3>
                <div className="video-container">
                  <video
                    ref={videoRef}
                    src={currentSign.video_url || videoUrl}
                    controls
                    autoPlay
                    onLoadedMetadata={() => {
                      if (!isChallenge && lesson.progress_bar && videoRef.current) {
                        videoRef.current.currentTime = (lesson.progress_bar / 100) * videoRef.current.duration;
                      }
                    }}
                    onEnded={handleVideoEnd}
                    className="lesson-video"
                  />
                </div>
              </>
            )}

            {step === 'showName' && (
              <>
                <h3 className="lesson-instruction">Learn new sign!</h3>
                <div className="video-container">
                  <video 
                    src={currentSign.video_url || videoUrl}
                    className="lesson-video"
                  />
                </div>
                <div className="sign-meaning">
                  <p className="meaning-label">This means</p>
                  <span className="meaning-text">{currentSign.text}</span>
                  <button onClick={handleExplanationEnd} className="continue-button">
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 'quiz' && (
              <>
                <h3 className="lesson-instruction">What sign is this?</h3>
                <div className="video-container">
                  <video
                    src={currentSign.video_url || videoUrl}
                    controls
                    autoPlay
                    className="lesson-video quiz-video"
                  />
                </div>
                <div className="quiz-options">
                  {getQuizOptions().map(opt => {
                    let buttonClass = "quiz-option-button";
                    
                    if (selectedOption === opt) {
                      buttonClass += opt === currentSign.text ? " correct" : " incorrect";
                    }
                    
                    return (
                      <button 
                        key={opt} 
                        onClick={() => !selectedOption && handleOptionSelect(opt)}
                        className={buttonClass}
                        disabled={selectedOption !== null}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizFeedback && (
                  <div className={`quiz-feedback ${quizFeedbackType}`}>
                    {quizFeedback}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showExitConfirmationModal && (
        <ExitConfirmationModal
          onConfirm={handleConfirmExit}
          onCancel={handleCancelExit}
        />
      )}
      {showCongratsModal && (
        <CongratulationModal
          onClose={handleModalClose}
          rubiesEarned={rubiesReward}
          streakCount={streak}
        />
      )}
      {showNoHeartsModal && <NoHeartsModal onClose={() => navigate('/')} />}
      {showZeroHeartsModal && (
        <ZeroHeartsModal
          onClose={() => navigate('/Home')}
          onPurchase={handlePurchaseHearts}
        />
      )}
    </div>
  );
}

export default LessonPlayer;