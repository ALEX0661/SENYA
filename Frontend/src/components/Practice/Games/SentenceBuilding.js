// components/Practice/Games/SentenceBuilding.js
import React, { useState, useEffect } from 'react';
import './SentenceBuilding.css';

function SentenceBuilding({ signs, onSuccess, onFailure }) {
  const [timer, setTimer] = useState(180); // 3 minutes
  const [score, setScore] = useState(0);
  const [currentSentence, setCurrentSentence] = useState(null);
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  
  // Create sentences from signs
  useEffect(() => {
    if (signs.length < 8) {
      // Not enough signs to create sentences
      onFailure();
      return;
    }
    
    // Generate 5 sentences using the available signs
    const generatedSentences = [];
    const usableSigns = signs.slice(0, 12);
    
    // Sample sentences structures
    const sentenceStructures = [
      {
        pattern: "subject + verb",
        length: 2
      },
      {
        pattern: "subject + verb + object",
        length: 3
      },
      {
        pattern: "subject + verb + adjective",
        length: 3
      },
      {
        pattern: "greeting + subject",
        length: 2
      },
      {
        pattern: "question word + verb + subject",
        length: 3
      }
    ];
    
    // Create 5 sentences with different lengths
    for (let i = 0; i < 5; i++) {
      const structureIndex = i % sentenceStructures.length;
      const structure = sentenceStructures[structureIndex];
      const sentenceSigns = [];
      const signIndices = new Set();
      
      // Select random signs for this sentence
      while (sentenceSigns.length < structure.length) {
        const randomIndex = Math.floor(Math.random() * usableSigns.length);
        
        // Avoid using the same sign twice in one sentence
        if (!signIndices.has(randomIndex)) {
          signIndices.add(randomIndex);
          sentenceSigns.push(usableSigns[randomIndex]);
        }
      }
      
      const sentence = {
        id: i + 1,
        signs: sentenceSigns,
        text: sentenceSigns.map(sign => sign.text).join(' ')
      };
      
      generatedSentences.push(sentence);
    }
    
    setSentences(generatedSentences);
    setCurrentSentence(generatedSentences[0]);
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
  
  const handleSignClick = (sign) => {
    // Add or remove sign from selection
    if (selectedSigns.some(s => s.id === sign.id)) {
      setSelectedSigns(selectedSigns.filter(s => s.id !== sign.id));
    } else {
      setSelectedSigns([...selectedSigns, sign]);
    }
  };
  
  const handleCheckSentence = () => {
    if (!currentSentence) return;
    
    const correctSignIds = currentSentence.signs.map(s => s.id).sort();
    const userSignIds = selectedSigns.map(s => s.id).sort();
    
    // Check if arrays match (same length and same elements)
    const isCorrect = correctSignIds.length === userSignIds.length && 
                     correctSignIds.every((id, index) => id === userSignIds[index]);
    
    if (isCorrect) {
      // Correct answer
      const pointsEarned = currentSentence.signs.length * 10;
      setScore(prev => prev + pointsEarned);
      
      setFeedback({
        correct: true,
        message: `Correct! +${pointsEarned} points`
      });
      
      setTimeout(() => {
        setFeedback(null);
        
        // Move to next sentence or finish game
        if (currentIndex < sentences.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setCurrentSentence(sentences[currentIndex + 1]);
          setSelectedSigns([]);
        } else {
          // Game complete
          const timeBonus = Math.floor(timer / 5);
          const finalScore = score + pointsEarned + timeBonus;
          onSuccess(finalScore);
        }
      }, 1500);
    } else {
      // Incorrect
      setFeedback({
        correct: false,
        message: "That's not right. Try again."
      });
      
      setTimeout(() => {
        setFeedback(null);
        setSelectedSigns([]);
      }, 1500);
    }
  };
  
  const handleClearSelection = () => {
    setSelectedSigns([]);
  };
  
  if (!currentSentence) {
    return <div className="loading">Loading sentence building game...</div>;
  }
  
  return (
    <div className="sentence-building">
      <div className="game-header">
        <div className="timer">Time: {timer}s</div>
        <div className="score">Score: {score}</div>
        <div className="progress">Sentence: {currentIndex + 1}/{sentences.length}</div>
      </div>
      
      <h3>Build the sentence by selecting the correct signs in order</h3>
      
      <div className="sentence-target">
        <p>Create this sentence: <strong>"{currentSentence.text}"</strong></p>
      </div>
      
      <div className="user-sentence">
        {selectedSigns.length > 0 ? (
          <>
            <div className="selected-signs">
              {selectedSigns.map((sign, index) => (
                <div key={index} className="selected-sign">
                  <video 
                    src={sign.video_url} 
                    className="sign-video small"
                    autoPlay
                    loop
                    muted
                  />
                  <p>{sign.text}</p>
                </div>
              ))}
            </div>
            <button 
              className="clear-button"
              onClick={handleClearSelection}
            >
              Clear
            </button>
          </>
        ) : (
          <p className="empty-selection">Select signs to build your sentence</p>
        )}
      </div>
      
      <div className="signs-grid">
        {signs.slice(0, 12).map(sign => (
          <div 
            key={sign.id} 
            className={`sign-item ${
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
      
      {selectedSigns.length > 0 && (
        <button 
          className="check-button"
          onClick={handleCheckSentence}
        >
          Check Sentence
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

export default SentenceBuilding;