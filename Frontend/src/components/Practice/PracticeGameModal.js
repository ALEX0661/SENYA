import React, { useState, useEffect } from 'react';
import MatchingGame from './Games/MatchingGame';
import IdentificationGame from './Games/IdentificationGame';
import SpeedChallenge from './Games/SpeedChallenge';
import SequenceGame from './Games/SequenceGame';
import AdvancedMatching from './Games/AdvancedMatching';
import SentenceBuilding from './Games/SentenceBuilding';
import { getPracticeSigns, updateLevelProgress, getUserHearts } from '../../services/practiceService';
import './PracticeGameModal.css';

function PracticeGameModal({ game, level, onClose, onComplete }) {
  const [signs, setSigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [hearts, setHearts] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [rubiesEarned, setRubiesEarned] = useState(0);
  const [totalRubies, setTotalRubies] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Determine difficulty
        let difficulty = 'beginner';
        const nameLower = level.name.toLowerCase();
        if (nameLower.includes('intermediate')) difficulty = 'intermediate';
        else if (nameLower.includes('advanced')) difficulty = 'advanced';

        // Load signs
        const signData = await getPracticeSigns(difficulty);
        setSigns(signData);

        // Load user hearts and scores
        const userData = await getUserHearts();
        if (userData) {
          setHearts(userData.hearts);
          setTotalRubies(userData.rubies);
          // extract high score for this game
          const key = `${level.id}_${game.id}`;
          if (userData.highScores && userData.highScores[key] !== undefined) {
            setHighScore(userData.highScores[key]);
          }
        }
      } catch (err) {
        console.error('Error loading game data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [level.id, level.name, game.id]);

  const getDifficultyMultiplier = () => {
    const name = level.name.toLowerCase();
    if (name.includes('advanced')) return 3;
    if (name.includes('intermediate')) return 2;
    return 1;
  };

  const updateGameProgress = async (gameScore, lostHearts) => {
    setUpdateInProgress(true);
    try {
      const result = await updateLevelProgress(level.id, game.id, gameScore, lostHearts);
      if (result) {
        if (result.rubies_earned !== undefined) setRubiesEarned(result.rubies_earned);
        if (result.total_rubies !== undefined) setTotalRubies(result.total_rubies);
        if (result.hearts !== undefined) setHearts(result.hearts);
        if (result.game_high_score && result.game_high_score > highScore) {
          setHighScore(result.game_high_score);
        }
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setUpdateInProgress(false);
    }
  };

  // On success, check for low score heart loss
  const handleGameSuccess = (gameScore) => {
    const lost = gameScore < 50 ? 1 : 0;
    setScore(gameScore);
    setHeartsLost(lost);
    if (lost > 0) {
      setHearts(prev => Math.max(0, prev - lost));
    }
    setRubiesEarned(Math.floor((gameScore / 10) * getDifficultyMultiplier()));
    setGameComplete(true);
    updateGameProgress(gameScore, lost);
  };

  const handleGameFailure = () => {
    const lost = 1;
    setScore(0);
    setHeartsLost(lost);
    setHearts(prev => Math.max(0, prev - lost));
    setRubiesEarned(0);
    setGameComplete(true);
    updateGameProgress(0, lost);
  };

  const handleFinish = () => onComplete(score);

  const renderGame = () => {
    if (loading) return <div className="loading">Loading game...</div>;
    switch (game.id) {
      case 'matching': return <MatchingGame signs={signs} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />;
      case 'identification': return <IdentificationGame signs={signs} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />;
      case 'speed': return <SpeedChallenge signs={signs} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />;
      case 'sequence': return <SequenceGame signs={signs} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />;
      case 'advanced-matching': return <AdvancedMatching signs={signs} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />;
      case 'sentence': return <SentenceBuilding signs={signs} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />;
      default: return <div>Game not found</div>;
    }
  };

  return (
    <div className="practice-game-modal">
      <div className="modal-content">
        <div className="modal-header">
          <div className="header-top">
            <h2>{game.name}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="header-stats">
            <span>High Score: {highScore}</span>
            <span>Ruby Bonus: {getDifficultyMultiplier()}x</span>
            <span>Hearts: {hearts}</span>
          </div>
        </div>

        {gameComplete ? (
          <div className="game-results">
            <h3>{score > 50 ? 'Great job!' : 'Try again!'}</h3>
            <p>You scored: {score} points</p>
            {heartsLost > 0 && <p className="hearts-lost">You lost {heartsLost} heart{heartsLost > 1 ? 's' : ''}!</p>}
            <div className="reward-info">
              <p className="rubies-earned">Rubies earned: {rubiesEarned}</p>
              <p className="total-rubies">Total rubies: {totalRubies}</p>
              {updateInProgress && <p className="update-status">(Updating...)</p>}
            </div>
            <button onClick={handleFinish} className="continue-button">Continue</button>
          </div>
        ) : (
          <div className="game-container"> {renderGame()} </div>
        )}
      </div>
    </div>
  );
}

export default PracticeGameModal;
