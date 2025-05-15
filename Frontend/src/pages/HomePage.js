import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnits, getLessonProgress, getLessonDetails } from '../services/lessonService';
import { checkUnitStatus } from '../services/userService';
import UnitCard from '../components/Units/UnitCard';
import LessonCard from '../components/Units/LessonCard';
import UserStatus from '../components/Users/UserStatus';
import DailyChallenge from '../components/DailyChallenge';
import Sidebar from '../components/Layout/Sidebar';
import logo from '../assets/cart.png';
import '../styles/HomePage.css';

function HomePage() {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // flat map: lessonId -> { completed, progress, image_url }
  const [lessonsStatus, setLessonsStatus] = useState({});
  const [unitsStatus, setUnitsStatus] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  // decide lock/unlock of a lesson
  const getLessonStatus = (lesson, unit, index) => {
    // if the *unit* itself is locked, lock all its lessons
    if (unitsStatus[unit.id]?.is_locked) return 'locked';
    // first lesson always unlocked
    if (index === 0) return 'unlocked';

    const prevLesson = unit.lessons[index - 1];
    const prev = lessonsStatus[prevLesson.id];
    return prev?.completed ? 'unlocked' : 'locked';
  };

  // check lock/unlock for units
  const checkAllUnitsStatus = async (allUnits) => {
    if (!allUnits.length) return;
    const statusMap = {};
    // Unit 1 always unlocked
    statusMap[allUnits[0].id] = { is_locked: false };
    for (let i = 1; i < allUnits.length; i++) {
      try {
        const res = await checkUnitStatus(allUnits[i].id, token);
        statusMap[allUnits[i].id] = res;
      } catch {
        statusMap[allUnits[i].id] = { is_locked: true };
      }
    }
    setUnitsStatus(statusMap);
  };

  // Fetch lesson details to get image_url
  const fetchLessonDetails = async (lessonId) => {
    try {
      const details = await getLessonDetails(lessonId, token);
      return details;
    } catch (error) {
      console.error(`Failed to fetch details for lesson ${lessonId}:`, error);
      return null;
    }
  };

  // fetch and *merge* lesson progress for any given unit
  const checkLessonsStatusForUnit = async (unit) => {
    if (!unit?.lessons) return;
    const newStatus = {};
    
    for (const lesson of unit.lessons) {
      try {
        // Get progress data
        const prog = await getLessonProgress(lesson.id);
        // Get lesson details to ensure we have image_url
        const details = await fetchLessonDetails(lesson.id, token);
        
        newStatus[lesson.id] = {
          completed: prog.completed || false,
          progress: prog.progress || 0,
          // Ensure the lesson has the image_url from detailed fetch
          image_url: details?.image_url || lesson.image_url || null
        };
      } catch {
        newStatus[lesson.id] = { 
          completed: false, 
          progress: 0,
          image_url: lesson.image_url || null
        };
      }
    }
    
    // merge into the global lessonsStatus map
    setLessonsStatus(prev => ({
      ...prev,
      ...newStatus
    }));
  };

  // load units *and* every lesson's status up front
  const fetchUnits = useCallback(async () => {
    try {
      const data = await getUnits(token);
      setUnits(data);
      await checkAllUnitsStatus(data);

      // Fetch progress for all units
      for (const unit of data) {
        await checkLessonsStatusForUnit(unit);
      }
    } catch (err) {
      setError(err.message || 'Failed to load units');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchUnits();
  }, [token, navigate, fetchUnits]);

  const handleUnitClick = async (unit) => {
    if (unitsStatus[unit.id]?.is_locked) {
      alert('This unit is locked. Please complete the previous unit first.');
      return;
    }
    setSelectedUnit(unit);
    // ensure this unit's lessons are up to date
    await checkLessonsStatusForUnit(unit);
  };

  const handleBack = () => setSelectedUnit(null);
  const navigateToShop = () => navigate('/shop/hearts');

  if (isLoading) return (
    <div className="home-page">
      <Sidebar activePage="home" />
      <div className="home-content"><div className="loading">Loading...</div></div>
    </div>
  );
  if (error) return (
    <div className="home-page">
      <Sidebar activePage="home" />
      <div className="home-content"><p className="error-message">{error}</p></div>
    </div>
  );

  // apply unit lock state to each unit object for the overview
  const unitsWithStatus = units.map(u => ({
    ...u,
    status: unitsStatus[u.id]?.is_locked ? 'locked' : 'active'
  }));

  // Enhance lessons with status and images before rendering
  const enhanceLessonWithData = (lesson, unit, idx) => {
    const lessonStatus = lessonsStatus[lesson.id] || {};
    return {
      ...lesson,
      status: getLessonStatus(lesson, unit, idx),
      progress_bar: lessonStatus.progress || 0,
      image_url: lessonStatus.image_url || lesson.image_url
    };
  };

  return (
    <div className="home-page">
      <Sidebar activePage="home" />
      <div className="home-content">
        <div className="top-header"><UserStatus/></div>
        <div className="home-main-content">
          <div className="lessons-container">
            {selectedUnit ? (
              // *** LESSONS VIEW ***
              <>
                <h2 className="unit-title-header">{selectedUnit.title}</h2>
                <p className="unit-description">{selectedUnit.description}</p>
                <button onClick={handleBack} className="back-button">← Back to Units</button>
                <div className="lessons-list">
                  {selectedUnit.lessons.map((lesson, idx) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={enhanceLessonWithData(lesson, selectedUnit, idx)}
                    />
                  ))}
                </div>
              </>
            ) : (
              // *** UNITS OVERVIEW ***
              <div className="units-list">
                {unitsWithStatus.map(unit => (
                  <div key={unit.id} className="unit-section">
                    <h2 className="unit-title-header">UNIT {unit.order_index}</h2>
                    <p className="unit-description">{unit.title}</p>
                    <div className="unit-lessons">
                      {unit.lessons?.slice(0, 3).map((lesson, idx) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={enhanceLessonWithData(lesson, unit, idx)}
                        />
                      ))}
                    </div>
                    {unit.lessons?.length > 3 && (
                      <button
                        className="view-all-button"
                        onClick={() => handleUnitClick(unit)}
                        disabled={unit.status === 'locked'}
                      >
                        View All Lessons
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-widgets">
            <DailyChallenge />
            <div className="shop-widget">
              <h3>SenShop</h3>
              <div className="shop-icon-container">
                <img src={logo} alt="SenShop Logo" className="shop-icon"/>
              </div>
              <button className="shop-button" onClick={navigateToShop}>Buy</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HomePage;