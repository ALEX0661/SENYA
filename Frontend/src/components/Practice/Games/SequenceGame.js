// components/Practice/Games/SequenceGame.js
import React, { useState, useEffect, useRef } from 'react';
import './SequenceGame.css';

function SequenceGame({ signs, onSuccess, onFailure }) {
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(90); // 1.5 minutes
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [currentShowIndex, setCurrentShowIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameState, setGameState] = useState('ready'); // ready, showing, input, feedback
  const [isPenalty, setIsPenalty] = useState(false); // Track if penalty animation is active
  
  // Penalty time in seconds
  const TIME_PENALTY = 5;
  
  // Prepare signs for the game
  useEffect(() => {
    if (signs.length < 5) {
      onFailure(1);
      return;
    }
    
    // Start with the first round
    startNewRound();
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
  
  // Handle sequence demonstration
  useEffect(() => {
    if (isShowingSequence && sequence.length > 0) {
      if (currentShowIndex < sequence.length) {
        const timeout = setTimeout(() => {
          setCurrentShowIndex(prev => prev + 1);
        }, 1500);
        return () => clearTimeout(timeout);
      } else {
        setIsShowingSequence(false);
        setCurrentShowIndex(0);
        setGameState('input');
      }
    }
  }, [isShowingSequence, currentShowIndex, sequence]);
  
  const startNewRound = () => {
    if (round >= totalRounds) {
      // Game completed
      const timeBonus = Math.floor(timer / 3);
      const finalScore = score + timeBonus;
      onSuccess(finalScore);
      return;
    }
    
    // Generate a new sequence for this round
    const roundLength = 2 + round; // Sequence gets longer each round
    const newSequence = [];
    
    // Use only the first 10 signs to make the game manageable
    const availableSigns = signs.slice(0, 10);
    
    for (let i = 0; i < roundLength; i++) {
      const randomIndex = Math.floor(Math.random() * availableSigns.length);
      newSequence.push(availableSigns[randomIndex]);
    }
    
    setSequence(newSequence);
    setPlayerSequence([]);
    setRound(prev => prev + 1);
    setGameState('showing');
    setIsShowingSequence(true);
  };
  
  const handleSignSelection = (selectedSign) => {
    if (gameState !== 'input') return;
    
    const updatedPlayerSequence = [...playerSequence, selectedSign];
    setPlayerSequence(updatedPlayerSequence);
    
    // Check if sequence is complete
    if (updatedPlayerSequence.length === sequence.length) {
      // Check if the sequence is correct
      const isCorrect = updatedPlayerSequence.every(
        (sign, index) => sign.id === sequence[index].id
      );
      
      if (isCorrect) {
        // Points based on round difficulty
        const pointsEarned = 10 * round;
        setScore(prev => prev + pointsEarned);
        
        setFeedback({
          correct: true,
          message: `Correct sequence! +${pointsEarned} points`
        });
      } else {
        // Apply time penalty for wrong answers
        setTimer(prev => Math.max(0, prev - TIME_PENALTY));
        setIsPenalty(true);
        
        setFeedback({
          correct: false,
          message: `Incorrect sequence. -${TIME_PENALTY}s penalty! Try again!`
        });
        
        // Reset penalty animation after a short delay
        setTimeout(() => {
          setIsPenalty(false);
        }, 1000);
      }
      
      setGameState('feedback');
      
      // Show feedback briefly, then start next round
      setTimeout(() => {
        setFeedback(null);
        if (isCorrect) {
          startNewRound();
        } else {
          // Reset player sequence and try again
          setPlayerSequence([]);
          setGameState('showing');
          setIsShowingSequence(true);
        }
      }, 2000);
    }
  };
  
  const renderAvailableSigns = () => {
    // Use only the first 10 signs for selection
    const availableSigns = signs.slice(0, 10);
    
    return (
      <div className="signs-grid">
        {availableSigns.map(sign => (
          <button
            key={sign.id}
            className="sign-button"
            onClick={() => handleSignSelection(sign)}
            disabled={gameState !== 'input'}
          >
            <div className="sign-thumbnail">
              <img src={sign.thumbnail_url || '/placeholder-thumbnail.png'} alt={sign.text} />
            </div>
            <div className="sign-text">{sign.text}</div>
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="sequence-game">
      <div className="game-header">
        <div className={`timer ${isPenalty ? 'penalty-flash' : ''}`}>
          Time: {timer}s
          {isPenalty && <span className="penalty-text">-{TIME_PENALTY}s</span>}
        </div>
        <div className="score">Score: {score}</div>
        <div className="progress">Round: {round}/{totalRounds}</div>
      </div>
      
      <h3>
        {gameState === 'ready' && 'Get ready to remember the sequence!'}
        {gameState === 'showing' && 'Watch the sequence carefully!'}
        {gameState === 'input' && 'Now repeat the sequence in order!'}
        {gameState === 'feedback' && (feedback?.correct ? 'Well done!' : 'Not quite right.')}
      </h3>
      
      {isShowingSequence && sequence.length > 0 && (
        <div className="sequence-display">
          <div className="video-container">
            <video
              src={sequence[currentShowIndex]?.video_url}
              className="sign-video"
              autoPlay
              muted
            />
          </div>
          <div className="sequence-progress">
            Showing sign {currentShowIndex + 1} of {sequence.length}
          </div>
        </div>
      )}
      
      {!isShowingSequence && (
        <>
          <div className="player-sequence">
            <h4>Your sequence ({playerSequence.length}/{sequence.length}):</h4>
            <div className="sequence-indicators">
              {sequence.map((_, index) => (
                <div 
                  key={index}
                  className={`sequence-indicator ${index < playerSequence.length ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>
          
          {renderAvailableSigns()}
        </>
      )}
      
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
          <div className="feedback-message">{feedback.message}</div>
        </div>
      )}
    </div>
  );
}

export default SequenceGame;