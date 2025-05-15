// components/Practice/Games/MatchingGame.js
import React, { useState, useEffect } from 'react';
import './MatchingGame.css';

function MatchingGame({ signs, onSuccess, onFailure }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [timer, setTimer] = useState(90); 
  const [score, setScore] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  // Initialize cards on component mount
  useEffect(() => {
    if (signs.length < 6) {
      // Need at least 6 signs to make a game
      onFailure(0);
      return;
    }

    // Use only the first 8 signs or fewer
    const gameSigns = signs.slice(0, 8);
    
    // Create pairs: one for the sign video and one for the text
    const cardPairs = gameSigns.flatMap(sign => [
      { id: `video-${sign.id}`, type: 'video', content: sign.video_url, matchId: sign.id },
      { id: `text-${sign.id}`, type: 'text', content: sign.text, matchId: sign.id }
    ]);
    
    // Shuffle cards
    const shuffledCards = [...cardPairs].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    
    return () => {
      // Cleanup if needed
    };
  }, [signs, onFailure]);

  // Timer countdown
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

  // Check for win condition
  useEffect(() => {
    // Only check if we have cards loaded and if all are matched
    if (cards.length > 0 && matched.length === cards.length) {
      // Game completed successfully
      const timeBonus = Math.floor(timer / 4);
      const finalScore = score + timeBonus;
      onSuccess(finalScore);
    }
  }, [matched, cards, score, timer, onSuccess]);

  // Handle card flipping
  const handleCardClick = (id) => {
    // Don't allow flipping if disabled or if card is already flipped/matched
    if (
      isDisabled || 
      flipped.includes(id) || 
      matched.some(cardId => cardId === id)
    ) {
      return;
    }

    // Can only flip 2 cards at a time
    if (flipped.length === 1) {
      setIsDisabled(true);
      const newFlipped = [...flipped, id];
      setFlipped(newFlipped);
      
      // Get the two cards
      const firstCard = cards.find(card => card.id === newFlipped[0]);
      const secondCard = cards.find(card => card.id === newFlipped[1]);
      
      // Check if cards match
      if (firstCard.matchId === secondCard.matchId) {
        // It's a match!
        setMatched([...matched, ...newFlipped]);
        setScore(prev => prev + 20);
        setFlipped([]);
        setIsDisabled(false);
      } else {
        // Not a match, flip back after delay
        setTimeout(() => {
          setFlipped([]);
          setIsDisabled(false);
        }, 1000);
      }
    } else {
      // First card of the pair
      setFlipped([id]);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Render the card content based on type
  const renderCardContent = (card, isCardFlipped) => {
    if (!isCardFlipped) {
      return <div className="card-back">?</div>;
    }

    if (card.type === 'video') {
      return (
        <video 
          src={card.content} 
          className="card-video"
          autoPlay
          loop
          muted
        />
      );
    } else {
      return <div className="card-text">{card.content}</div>;
    }
  };

  return (
    <div className="matching-game">
      <div className="game-header">
        <div className="timer">Time: {formatTime(timer)}</div>
        <div className="score">Score: {score}</div>
        <div className="matches">Matched: {matched.length / 2} of {cards.length / 2}</div>
      </div>
      
      <div className="cards-grid">
        {cards.map(card => (
          <div 
            key={card.id}
            className={`
              card 
              ${flipped.includes(card.id) ? 'flipped' : ''} 
              ${matched.includes(card.id) ? 'matched' : ''}
            `}
            onClick={() => handleCardClick(card.id)}
          >
            {renderCardContent(card, flipped.includes(card.id) || matched.includes(card.id))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchingGame;