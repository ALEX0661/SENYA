// components/Practice/Games/SpeedChallenge.js
import React, { useState, useEffect, useRef } from 'react';
import './SpeedChallenge.css';

function SpeedChallenge({ signs, onSuccess, onFailure }) {
  const [currentSign, setCurrentSign] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60); // 1 minute
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [answerTime, setAnswerTime] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [isPenalty, setIsPenalty] = useState(false); // Track if penalty animation is active
  const totalResponseTimeRef = useRef(0);
  const answersCountRef = useRef(0);
  
  // Penalty time in seconds
  const TIME_PENALTY = 3;
  
  // Prepare signs for the game
  useEffect(() => {
    if (signs.length < 5) {
      onFailure(1);
      return;
    }
    
    // Use only the first 10 signs to make the game manageable
    const gameSigns = signs.slice(0, 10);
    
    // Start the first round
    startNewRound(gameSigns);
  }, [signs, onFailure]);
  
  // Handle timer
  useEffect(() => {
    if (timer <= 0) {
      onFailure(1);
      return;
    }
    
    const countdown = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(countdown);
  }, [timer, onFailure]);
  
  // Start tracking answer time when a new sign is displayed
  useEffect(() => {
    if (currentSign) {
      setAnswerTime(Date.now());
    }
  }, [currentSign]);
  
  const startNewRound = (availableSigns) => {
    if (round >= totalRounds) {
      // Game completed
      const timeBonus = Math.floor(timer / 2);
      // Calculate speed bonus based on average response time
      const speedBonus = avgResponseTime < 2000 ? 50 : 
                         avgResponseTime < 3000 ? 30 : 
                         avgResponseTime < 4000 ? 10 : 0;
      
      const finalScore = score + timeBonus + speedBonus;
      onSuccess(finalScore);
      return;
    }
    
    // Select a random sign for this round
    const randomIndex = Math.floor(Math.random() * availableSigns.length);
    const selected = availableSigns[randomIndex];
    
    // Create answer options (1 correct, 3 wrong)
    const wrongOptions = availableSigns
      .filter(s => s.id !== selected.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(s => s.text);
    
    // Mix the correct answer with wrong ones and shuffle
    const allOptions = [...wrongOptions, selected.text].sort(() => Math.random() - 0.5);
    
    setCurrentSign(selected);
    setOptions(allOptions);
    setRound(prev => prev + 1);
  };
  
  const handleAnswer = (answer) => {
    if (!currentSign) return;
    
    const responseTime = Date.now() - answerTime;
    totalResponseTimeRef.current += responseTime;
    answersCountRef.current += 1;
    
    // Update average response time
    setAvgResponseTime(totalResponseTimeRef.current / answersCountRef.current);
    
    const isCorrect = answer === currentSign.text;
    
    if (isCorrect) {
      // Points based on response time (faster = more points)
      let pointsEarned = 10;
      if (responseTime < 1500) pointsEarned += 10;
      if (responseTime < 2500) pointsEarned += 5;
      
      setScore(prev => prev + pointsEarned);
      
      setFeedback({
        correct: true,
        message: `Correct! +${pointsEarned} points`,
        time: `${(responseTime / 1000).toFixed(2)}s`
      });
    } else {
      // Apply time penalty for wrong answers
      setTimer(prev => Math.max(0, prev - TIME_PENALTY));
      setIsPenalty(true);
      
      setFeedback({
        correct: false,
        message: `Wrong! -${TIME_PENALTY}s penalty! Correct answer: "${currentSign.text}"`,
        time: `${(responseTime / 1000).toFixed(2)}s`
      });
      
      // Reset penalty animation after a short delay
      setTimeout(() => {
        setIsPenalty(false);
      }, 1000);
    }
    
    // Show feedback briefly, then start next round
    setTimeout(() => {
      setFeedback(null);
      startNewRound(signs.slice(0, 10));
    }, 1200);
  };
  
  if (!currentSign) {
    return <div className="loading">Loading challenge...</div>;
  }
  
  return (
    <div className="speed-challenge">
      <div className="game-header">
        <div className={`timer ${isPenalty ? 'penalty-flash' : ''}`}>
          Time: {timer}s
          {isPenalty && <span className="penalty-text">-{TIME_PENALTY}s</span>}
        </div>
        <div className="score">Score: {score}</div>
        <div className="progress">Round: {round}/{totalRounds}</div>
      </div>
      
      <h3>Quickly identify the sign!</h3>
      
      <div className="video-container">
        <video
          src={currentSign.video_url}
          className="sign-video"
          autoPlay
          loop
          muted
        />
      </div>
      
      <div className="options-grid">
        {options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            className="option-button"
            onClick={() => !feedback && handleAnswer(option)}
            disabled={feedback !== null}
          >
            {option}
          </button>
        ))}
      </div>
      
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
          <div className="feedback-message">{feedback.message}</div>
          <div className="response-time">Response time: {feedback.time}</div>
        </div>
      )}
      
      <div className="avg-time">
        Average response time: {(avgResponseTime / 1000).toFixed(2)}s
      </div>
    </div>
  );
}

export default SpeedChallenge;