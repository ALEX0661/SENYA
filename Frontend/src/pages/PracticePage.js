// PracticePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserStatus, getUserProfile } from '../services/userService';
import { getUserHearts, getLevelsAndGames } from '../services/practiceService';
import { getUnitsAndLessons } from '../services/unitsService';
import LevelCard from '../components/Practice/LevelCard';
import PracticeGameModal from '../components/Practice/PracticeGameModal';
import Sidebar from '../components/Layout/Sidebar'; // Import the Sidebar component
import '../styles/PracticePage.css';

function PracticePage() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [userStatus, setUserStatus] = useState({ hearts: 5, rubies: 0 });
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [units, setUnits] = useState([]);

  // Fetch user status and progress
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is logged in
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError("You must be logged in to access practice content");
        setIsLoading(false);
        return;
      }
      
      // Try to get user status
      let status = { hearts: 5, rubies: 0 };
      try {
        status = await getUserStatus();
      } catch (err) {
        console.error('Error fetching user status:', err);
      }
      setUserStatus(status);

      // Try to get hearts from practice service
      try {
        const heartsStatus = await getUserHearts();
        setUserStatus(prev => ({
          ...prev,
          hearts: heartsStatus.hearts,
          rubies: heartsStatus.rubies || prev.rubies
        }));
      } catch (err) {
        console.error('Error fetching heart status:', err);
      }

      // Fetch user profile and units data for overall progress calculation
      try {
        const userData = await getUserProfile();
        
        // Fetch units data
        const token = localStorage.getItem('accessToken');
        const unitsData = await getUnitsAndLessons(token);
        const processedUnits = await processUnitsWithProgress(unitsData);
        setUnits(processedUnits);
        
        // Calculate overall progress from the processed units
        calculateOverallProgress(processedUnits);
      } catch (err) {
        console.error('Error fetching user profile or units data:', err);
      }

      // Fetch practice levels and games
      try {
        const userId = localStorage.getItem('userId');
        const practiceData = await getLevelsAndGames(userId);
        
        if (practiceData && practiceData.levels) {
          setLevels(practiceData.levels);
          // If backend provided overall progress, use it
          if (practiceData.overall_progress !== undefined) {
            setOverallProgress(practiceData.overall_progress);
          }
        }
      } catch (err) {
        console.error('Error fetching practice levels:', err);
        setError('Failed to load practice levels. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching practice data:', error);
      setError('Failed to load practice content. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const processUnitsWithProgress = async (unitsData) => {
    try {
      const processedUnits = [];
      for (const unit of unitsData) {
        const unitProgressData = await getUnitProgress(unit.id);
        const unitProgress = unitProgressData.progress_percentage || 0;
        const processedLessons = [];
        for (const lesson of unit.lessons) {
          const lessonProgressData = await getLessonProgress(lesson.id);
          const lessonProgress = lessonProgressData.progress || 0;
          processedLessons.push({
            ...lesson,
            progress: lessonProgress
          });
        }
        processedUnits.push({
          ...unit,
          lessons: processedLessons,
          progress: unitProgress
        });
      }
      return processedUnits;
    } catch (error) {
      console.error('Error processing units with progress:', error);
      return unitsData.map(unit => ({
        ...unit,
        lessons: unit.lessons.map(lesson => ({
          ...lesson,
          progress: 0
        })),
        progress: 0
      }));
    }
  };

  const calculateOverallProgress = (unitsData) => {
    if (!unitsData || unitsData.length === 0) {
      setOverallProgress(0);
      return;
    }
    const totalProgress = unitsData.reduce((sum, unit) => sum + unit.progress, 0);
    const overallPercent = Math.round(totalProgress / unitsData.length);
    setOverallProgress(overallPercent);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectLevel = (level) => {
    if (!level.unlocked) {
      alert(`You need ${level.required_progress}% overall progress to unlock this level. Current progress: ${overallProgress}%`);
      return;
    }
    setSelectedLevel(level);
  };

  const handleGameSelect = (game) => {
    // Check if user has hearts
    if (userStatus.hearts <= 0) {
      alert("You don't have enough hearts to play. Get more hearts from the shop!");
      return;
    }
    
    setSelectedGame(game);
    setIsGameModalOpen(true);
  };

  const handleCloseGameModal = () => {
    setIsGameModalOpen(false);
    setSelectedGame(null);
  };

  const handleGameComplete = async (score) => {
    try {
      // Refresh data after game completion
      await fetchData();
      
      // Close the game modal
      setIsGameModalOpen(false);
    } catch (error) {
      console.error('Error updating after game completion:', error);
      setIsGameModalOpen(false);
    }
  };

  // Function to get unit progress - imported from ProfilePage
  const getUnitProgress = async (unitId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('User ID not found');
    try {
      // Updated endpoint: `/lessons/unit-progress/{userId}/{unitId}`
      const resp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/lessons/unit-progress/${userId}/${unitId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!resp.ok) throw new Error('Failed to fetch unit progress');
      return await resp.json();
    } catch (e) {
      console.error('Error fetching unit progress:', e);
      return { progress_percentage: 0 };
    }
  };

  // Function to get lesson progress - imported from ProfilePage
  const getLessonProgress = async (lessonId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('User ID not found');
    try {
      // Updated endpoint: `/lessons/lesson-progress/{userId}/{lessonId}`
      const resp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/lessons/lesson-progress/${userId}/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!resp.ok) throw new Error('Failed to fetch lesson progress');
      return await resp.json();
    } catch (e) {
      console.error('Error fetching lesson progress:', e);
      return { progress: 0 };
    }
  };

  return (
    <div className="app-container">
      {/* Add Sidebar with active page set to 'practice' */}
      <Sidebar activePage="practice" />
      
      <div className="practice-page">
        <header className="practice-header">
          <h1>Practice Sign Language</h1>
          <div className="user-stats">
            <span>Hearts: {userStatus.hearts}</span>
            <span>Rubies: {userStatus.rubies}</span>
          </div>
        </header>

        {/* Overall Progress Bar Section */}
        <div className="overall-progress-section">
          <div className="overall-progress-container">
            <div className="overall-progress-label">Overall Progress: {overallProgress}%</div>
            <div className="overall-progress-bar-container">
              <div 
                className="overall-progress-bar"
                style={{ width: `${overallProgress}%` }}
                role="progressbar"
                aria-valuenow={overallProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">Loading...</div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : (
          <>
            <div className="levels-container">
              {levels.map(level => (
                <LevelCard
                  key={level.id}
                  level={level}
                  onSelect={() => handleSelectLevel(level)}
                />
              ))}
            </div>

            {selectedLevel && (
              <div className="games-section">
                <h2>{selectedLevel.name} Level Games</h2>
                <div className="games-grid">
                  {selectedLevel.games && selectedLevel.games.map(game => (
                    <div 
                      key={game.id} 
                      className="game-card"
                      onClick={() => handleGameSelect(game)}
                    >
                      <h3>{game.name}</h3>
                      <p>{game.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isGameModalOpen && selectedGame && selectedLevel && (
          <PracticeGameModal
            game={selectedGame}
            level={selectedLevel}
            onClose={handleCloseGameModal}
            onComplete={handleGameComplete}
          />
        )}
      </div>
    </div>
  );
}

export default PracticePage;