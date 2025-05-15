import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyChallenges, completeDailyChallenge } from '../services/challengeService';
import starImg from '../assets/star.png';
import './DailyChallenge.css';

function DailyChallenge() {
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rubies, setRubies] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const navigate = useNavigate();

  // Fetch daily challenge on mount
  useEffect(() => {
    const fetchChallenge = async () => {
      setIsLoading(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
        const userIdRaw = localStorage.getItem('userId');
        if (!accessToken || !userIdRaw || userIdRaw === 'undefined' || userIdRaw === 'null') {
          throw new Error('Authentication error. Please log in again.');
        }
        const data = await getDailyChallenges();
        setDailyChallenge(data);
        // if user returns after start, restore started flag
        const started = localStorage.getItem(`challengeStarted:${data.id}`) === 'true';
        setHasStarted(started);
      } catch (err) {
        console.error('Error fetching daily challenge:', err);
        if (err.response?.status === 400 && err.response.data.detail.includes('already completed')) {
          setAlreadyCompletedToday(true);
        } else {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, []);

  const toggleOpen = () => {
    setIsOpen(prev => {
      const newOpen = !prev;
      if (newOpen && dailyChallenge) {
        // when opening, re-check if started
        const started = localStorage.getItem(`challengeStarted:${dailyChallenge.id}`) === 'true';
        setHasStarted(started);
      }
      return newOpen;
    });
    setError(null);
  };

  const handleStart = () => {
    if (dailyChallenge && dailyChallenge.id) {
      setHasStarted(true);
      localStorage.setItem(`challengeStarted:${dailyChallenge.id}`, 'true');
      navigate(`/challenge/${dailyChallenge.id}`);
      setIsOpen(false);
    }
  };

  const handleComplete = async () => {
    try {
      const res = await completeDailyChallenge();
      if (res.success) {
        setRubies(res.rubies);
        setChallengeCompleted(true);
        setDailyChallenge(null);
        // clear started flag so next day works fresh
        localStorage.removeItem(`challengeStarted:${dailyChallenge.id}`);
      } else {
        setError(res.message);
      }
    } catch (err) {
      console.error('Error completing challenge:', err);
      setError(err.message);
    }
  };

  const renderContent = () => {
    if (error) return <p className="error-message">{error}</p>;
    if (isLoading) return <p>Loading challenge...</p>;
    if (alreadyCompletedToday) return (
      <>
        <p>You've already completed today's challenge!</p>
        <p>Come back tomorrow.</p>
      </>
    );
    if (challengeCompleted) return (
      <>
        <p>Challenge completed! You now have {rubies} rubies.</p>
        <p>See you tomorrow.</p>
      </>
    );
    if (!dailyChallenge) return <p>Complete lessons to unlock challenges!</p>;

    return (
      <>
        <h3>{dailyChallenge.title}</h3>
        <p>{dailyChallenge.description}</p>
        <button className="start-challenge-btn" onClick={handleStart}>Start Challenge</button>
        {hasStarted ? (
          <button className="complete-challenge-btn" onClick={handleComplete}>Complete Challenge</button>
        ) : (
          <button className="complete-challenge-btn" disabled title="Start the challenge first">Complete Challenge</button>
        )}
      </>
    );
  };

  return (
    <>
      <div className="daily-challenge-widget">
        <h3>Daily Challenge</h3>
        <div className="challenge-star-container" onClick={toggleOpen}>
          <img src={starImg} alt="Star" className="challenge-star" />
        </div>
        <button className="challenge-button" onClick={toggleOpen}>Start</button>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={toggleOpen}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={toggleOpen}>×</button>
            <div className="modal-content">
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DailyChallenge;