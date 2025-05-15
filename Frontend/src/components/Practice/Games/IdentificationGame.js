import React, { useState, useEffect, useMemo } from 'react';
import './IdentificationGame.css';

// Utility to shuffle an array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function IdentificationGame({ signs, onSuccess, onFailure }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [timer, setTimer] = useState(75); // 1.5 minutes
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isPenalty, setIsPenalty] = useState(false); // Track if penalty animation is active

  // Penalty time in seconds
  const TIME_PENALTY = 5;

  // Use only the first 10 signs or fewer
  const gameSigns = useMemo(() => signs.slice(0, 10), [signs]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      onFailure();
      return;
    }

    const countdown = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(countdown);
  }, [timer, onFailure]);

  // Generate options when currentIndex changes
  useEffect(() => {
    if (currentIndex >= gameSigns.length) {
      const timeBonus = Math.floor(timer / 3);
      const finalScore = score + timeBonus;
      onSuccess(finalScore);
      return;
    }

    const correctSign = gameSigns[currentIndex];
    const otherSigns = gameSigns.filter((_, i) => i !== currentIndex);

    // Get 3 wrong options or as many as available
    const wrongOptions = shuffleArray([...otherSigns])
      .slice(0, Math.min(3, otherSigns.length))
      .map((s) => s.text);

    // Add correct answer and shuffle
    setOptions(shuffleArray([...wrongOptions, correctSign.text]));
    setIsVideoPlaying(true);
  }, [currentIndex, gameSigns]);

  const handleAnswer = (answer) => {
    const correctAnswer = gameSigns[currentIndex].text;

    if (answer === correctAnswer) {
      setFeedback({ correct: true, message: 'Correct!' });
      setScore((prev) => prev + 10);

      setTimeout(() => {
        setFeedback(null);
        setCurrentIndex((prev) => prev + 1);
      }, 1000);
    } else {
      // Apply time penalty for wrong answers
      setTimer((prev) => Math.max(0, prev - TIME_PENALTY));
      setIsPenalty(true);
      
      setFeedback({ 
        correct: false, 
        message: `Incorrect! -${TIME_PENALTY}s penalty! The answer is "${correctAnswer}"`
      });

      // Reset penalty animation after a short delay
      setTimeout(() => {
        setIsPenalty(false);
      }, 1000);

      setTimeout(() => {
        setFeedback(null);
        setCurrentIndex((prev) => prev + 1);
      }, 2000);
    }
  };

  if (currentIndex >= gameSigns.length) {
    return (
      <div className="identification-game">
        <h3>All questions completed!</h3>
      </div>
    );
  }

  return (
    <div className="identification-game">
      <div className="game-header">
        <div className={`timer ${isPenalty ? 'penalty-flash' : ''}`}>
          Time: {timer}s
          {isPenalty && <span className="penalty-text">-{TIME_PENALTY}s</span>}
        </div>
        <div className="score">Score: {score}</div>
        <div className="progress">Sign {currentIndex + 1} of {gameSigns.length}</div>
      </div>

      <h3>What does this sign mean?</h3>

      <div className="video-container">
        <video
          src={gameSigns[currentIndex].video_url}
          className="id-video"
          autoPlay
          loop
          muted={false}
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
        />
        {!isVideoPlaying && (
          <button
            className="replay-button"
            onClick={(e) => e.currentTarget.previousSibling.play()}
          >Replay</button>
        )}
      </div>

      <div className="options-container">
        {options.map((option, idx) => (
          <button
            key={`${option}-${idx}`}
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
          {feedback.message}
        </div>
      )}
    </div>
  );
}

export default IdentificationGame;