// components/Practice/Games/AdvancedMatching.js
import React, { useState, useEffect } from 'react';
import './AdvancedMatching.css';

function AdvancedMatching({ signs, onSuccess, onFailure }) {
  const [phrases, setPhrases] = useState([]);
  const [selectedPhrase, setSelectedPhrase] = useState(null);
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [timer, setTimer] = useState(180); // 3 minutes
  const [score, setScore] = useState(0);
  const [matchedPhrases, setMatchedPhrases] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isPenalty, setIsPenalty] = useState(false); // Track if penalty animation is active
  
  // Penalty time in seconds
  const TIME_PENALTY = 5;
  
  // Create phrases from sign combinations
  useEffect(() => {
    if (signs.length < 6) {
      // Not enough signs to create phrases
      onFailure();
      return;
    }
    
    // Create phrases by combining 2-3 signs
    const generatedPhrases = [];
    
    // Use first 8 signs to create phrases
    const usableSigns = signs.slice(0, 8);
    
    // Create 5 phrases
    for (let i = 0; i < 5; i++) {
      const phraseLength = Math.random() > 0.5 ? 2 : 3; // 2 or 3 signs per phrase
      const phraseWords = [];
      const phraseSigns = [];
      
      // Select random signs for this phrase
      for (let j = 0; j < phraseLength; j++) {
        const randomIndex = Math.floor(Math.random() * usableSigns.length);
        const sign = usableSigns[randomIndex];
        phraseWords.push(sign.text);
        phraseSigns.push(sign);
      }
      
      generatedPhrases.push({
        id: i + 1,
        text: phraseWords.join(' '),
        signs: phraseSigns
      });
    }
    
    setPhrases(generatedPhrases);
  }, [signs, onFailure]);
  
  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      onFailure();
      return;
    }
    
    const countdown = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(countdown);
  }, [timer, onFailure]);
  
  // Check if all phrases are matched
  useEffect(() => {
    if (phrases.length > 0 && matchedPhrases.length === phrases.length) {
      // All phrases matched - add time bonus
      const timeBonus = Math.floor(timer / 3);
      const finalScore = score + timeBonus;
      onSuccess(finalScore);
    }
  }, [matchedPhrases, phrases, score, timer, onSuccess]);
  
  const handlePhraseClick = (phrase) => {
    if (matchedPhrases.includes(phrase.id)) return;
    
    setSelectedPhrase(phrase);
    setSelectedSigns([]);
  };
  
  const handleSignClick = (sign) => {
    if (!selectedPhrase) return;
    
    // Add or remove sign from selection
    if (selectedSigns.some(s => s.id === sign.id)) {
      setSelectedSigns(selectedSigns.filter(s => s.id !== sign.id));
    } else {
      if (selectedSigns.length < selectedPhrase.signs.length) {
        setSelectedSigns([...selectedSigns, sign]);
      }
    }
  };
  
  const handleCheckMatch = () => {
    if (!selectedPhrase || selectedSigns.length !== selectedPhrase.signs.length) return;
    
    // Check if selected signs match the phrase
    const correctSigns = selectedPhrase.signs.map(s => s.id).sort();
    const userSigns = selectedSigns.map(s => s.id).sort();
    
    const isMatch = correctSigns.every((signId, index) => signId === userSigns[index]);
    
    if (isMatch) {
      // Correct match
      const pointsEarned = selectedPhrase.signs.length * 10;
      setScore(prev => prev + pointsEarned);
      setMatchedPhrases([...matchedPhrases, selectedPhrase.id]);
      
      setFeedback({
        correct: true,
        message: `Correct match! +${pointsEarned} points`
      });
      
      setTimeout(() => {
        setFeedback(null);
        setSelectedPhrase(null);
        setSelectedSigns([]);
      }, 1500);
    } else {
      // Incorrect match - apply time penalty
      setTimer(prev => Math.max(0, prev - TIME_PENALTY));
      setIsPenalty(true);
      
      setFeedback({
        correct: false,
        message: `Incorrect match. -${TIME_PENALTY}s penalty! Try again.`
      });
      
      // Reset penalty animation after a short delay
      setTimeout(() => {
        setIsPenalty(false);
      }, 1000);
      
      setTimeout(() => {
        setFeedback(null);
        setSelectedSigns([]);
      }, 1500);
    }
  };
  
  return (
    <div className="advanced-matching">
      <div className="game-header">
        <div className={`timer ${isPenalty ? 'penalty-flash' : ''}`}>
          Time: {timer}s
          {isPenalty && <span className="penalty-text">-{TIME_PENALTY}s</span>}
        </div>
        <div className="score">Score: {score}</div>
        <div className="progress">Matched: {matchedPhrases.length}/{phrases.length}</div>
      </div>
      
      <h3>Match the phrases with their corresponding signs</h3>
      
      <div className="phrases-container">
        {phrases.map(phrase => (
          <div 
            key={phrase.id} 
            className={`phrase-item ${
              selectedPhrase?.id === phrase.id ? 'selected' : ''
            } ${
              matchedPhrases.includes(phrase.id) ? 'matched' : ''
            }`}
            onClick={() => !matchedPhrases.includes(phrase.id) && handlePhraseClick(phrase)}
          >
            {phrase.text}
          </div>
        ))}
      </div>
      
      {selectedPhrase && (
        <div className="selection-info">
          <p>Select {selectedPhrase.signs.length} signs for: <strong>{selectedPhrase.text}</strong></p>
          <p className="selection-counter">{selectedSigns.length} of {selectedPhrase.signs.length} selected</p>
        </div>
      )}
      
      <div className="signs-container">
        {signs.slice(0, 12).map(sign => (
          <div 
            key={sign.id} 
            className={`sign-card ${
              selectedSigns.some(s => s.id === sign.id) ? 'selected' : ''
            }`}
            onClick={() => handleSignClick(sign)}
          >
            <video 
              src={sign.video_url} 
              className="sign-video"
              autoPlay={selectedSigns.some(s => s.id === sign.id)}
              loop
              muted
            />
            <p>{sign.text}</p>
          </div>
        ))}
      </div>
      
      {selectedPhrase && selectedSigns.length > 0 && (
        <button 
          className="check-button"
          onClick={handleCheckMatch}
          disabled={selectedSigns.length !== selectedPhrase.signs.length}
        >
          Check Match
        </button>
      )}
      
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}

export default AdvancedMatching;