import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import UserStatus from '../components/Users/UserStatus';
import CertificateModal from '../components/CertificateModal';
import { 
  getUserProfile, 
  updateUserProfile,
  getUnitProgress,
  getLessonProgress,
  uploadProfilePicture,
  generateCertificate,
  getUserStatus
} from '../services/userService';
import { getUnitsAndLessons } from '../services/unitsService';
import '../styles/ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: '',
    profile_url: '',
    progress: {},
    certificate: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [units, setUnits] = useState([]);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userStatus, setUserStatus] = useState({
    hearts: 0,
    rubies: 0,
    streak: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
    const storedCertificate = localStorage.getItem('userCertificate');
    if (storedCertificate) {
      setCertificateData(JSON.parse(storedCertificate));
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      setProfile(userData);
      
      const statusData = await getUserStatus();
      setUserStatus(statusData);
      
      const token = localStorage.getItem('accessToken');
      const unitsData = await getUnitsAndLessons(token);
      const processedUnits = await processUnitsWithProgress(unitsData);
      setUnits(processedUnits);
      calculateOverallProgress(processedUnits);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load profile and progress data');
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

  const toggleUnitExpand = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleEdit = () => setIsEditing(true);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(profile);
      setIsEditing(false);
      setImagePreview(null);
      fetchData();
    } catch {
      setError('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImagePreview(null);
    fetchData();
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create preview before upload
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    try {
      setIsUploading(true);
      const result = await uploadProfilePicture(file);
      if (result.success) {
        setProfile(prev => ({ ...prev, profile_url: result.url }));
      } else {
        setError('Failed to upload profile picture');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    setIsEditing(false);
    fetchData();
  };

  const handleGetCertificate = async () => {
    try {
      const result = await generateCertificate();
      if (result.success) {
        setCertificateData(result.certificate);
        setProfile(prev => ({ ...prev, certificate: true }));
        setShowCertificate(true);
      } else {
        setError('Failed to generate certificate');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError('Failed to generate certificate');
    }
  };

  const handleShowExistingCertificate = () => {
    setShowCertificate(true);
  };

  const navigateToShop = () => {
    navigate('/shop/hearts');
  };

  // Function to get the correct image URL
  const getProfileImageUrl = () => {
    if (imagePreview) {
      return imagePreview;
    }
    
    if (!profile.profile_url) {
      return "/default-profile.png";
    }
    
    // If the profile_url already starts with http or https, use it directly
    if (profile.profile_url.startsWith('http')) {
      return profile.profile_url;
    }
    
    // Otherwise, assume it's a relative path and prepend the API URL
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    // If the profile_url already has a leading slash, don't add another one
    if (profile.profile_url.startsWith('/')) {
      return `${baseUrl}${profile.profile_url}`;
    } else {
      return `${baseUrl}/${profile.profile_url}`;
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <Sidebar activePage="profile" />
        <div className="profile-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Sidebar activePage="profile" />
        <div className="profile-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Sidebar activePage="profile" />
      <div className="profile-content">
        {isEditing ? (
          <div className="edit-profile-container">
            <div className="edit-profile-header">
              <button className="back-button" onClick={handleBack}>
                <span className="back-icon">←</span>
              </button>
              <h1>Edit Profile</h1>
            </div>
            <div className="profile-photo-container">
              <div className="profile-photo">
                <img
                  src={getProfileImageUrl()}
                  alt="Profile"
                  className="profile-image"
                />
                {isUploading && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                className="change-photo-button"
                onClick={handlePhotoClick}
                disabled={isUploading}
              >
                Change Photo
              </button>
            </div>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name || ''}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={profile.email || ''}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={profile.password || ''}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">Save Changes</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <>          
            <div className="user-info-section">
              <div className="user-header">
                <div className="user-avatar">
                  <img
                    src={getProfileImageUrl()}
                    alt="Profile"
                    className="profile-image"
                  />
                </div>
                <div className="user-details">
                  <h2 className="user-name">{profile.name || 'User'}</h2>
                  <p className="user-email">{profile.email}</p>
                  <button className="edit-button" onClick={handleEdit}>
                    <span className="edit-icon">✏️</span>
                  </button>
                </div>
              </div>
              
              <div className="user-stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">❤️</div>
                  <div className="stat-value">{userStatus.hearts}</div>
                  <div className="stat-label">Hearts</div>
                  <button className="buy-button" onClick={navigateToShop}>BUY</button>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">💎</div>
                  <div className="stat-value">{userStatus.rubies}</div>
                  <div className="stat-label">Rubies</div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">{userStatus.streak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>
            </div>

            <div className="progress-section">
              <h2>My Progress</h2>
              <div className="progress-overview">
                <div className="progress-circle-container">
                  <div className="progress-circle">
                    <svg viewBox="0 0 100 100" className="progress-ring">
                      <circle cx="50" cy="50" r="45" className="progress-ring-background" />
                      <circle
                        cx="50" cy="50" r="45"
                        className="progress-ring-circle"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 45}`,
                          strokeDashoffset: `${2 * Math.PI * 45 * (1 - overallProgress / 100)}`
                        }}
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-percentage">{overallProgress}%</span>
                      <span className="progress-label">Overall Complete</span>
                    </div>
                  </div>
                </div>
              
                <div className="units-lists">
            
                  {units.length > 0 ? (
                    <div className="unit-accordion">
                      {units.map(unit => (
                        <div key={unit.id} className="unit-item">
                          <div 
                            className="unit-header" 
                            onClick={() => toggleUnitExpand(unit.id)}
                          >
                            <div className="unit-title">{unit.title}</div>
                            <div className="unit-progress-container">
                              <div className="unit-progress-bar-background">
                                <div 
                                  className="unit-progress-bar" 
                                  style={{ width: `${unit.progress}%` }}
                                ></div>
                              </div>
                              <div className="unit-progress-text">{unit.progress}%</div>
                            </div>
                            <div className="unit-dropdown-icon">
                              {expandedUnits[unit.id] ? '▼' : '▶'}
                            </div>
                          </div>
                          
                          {expandedUnits[unit.id] && (
                            <div className="unit-lessons">
                              {unit.lessons.map(lesson => (
                                <div key={lesson.id} className="lesson-item">
                                  <div className="lesson-info">
                                    <div className="lesson-title">{lesson.title}</div>
                                    <div className="lesson-progress-container">
                                      <div className="lesson-progress-bar-background">
                                        <div 
                                          className="lesson-progress-bar" 
                                          style={{ width: `${lesson.progress}%` }}
                                        ></div>
                                      </div>
                                      <div className="lesson-progress-text">{lesson.progress}%</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-units-message">No units available or you haven't started any lessons yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="certificate-section">
              <h2>Certificate</h2>
              {profile.certificate ? (
                <>
                <p>Congratulations! You have earned your certificate.</p>
                <button
                  className="certificate-button view-certificate"
                  onClick={handleShowExistingCertificate}
                >
                  View Certificate
                </button>
                </>
              ) : (
                <>
                  <p>Complete all the lessons to receive an e-certificate as proof of achievement!</p>
                  <button
                    className="certificate-button"
                    disabled={overallProgress < 100}
                    onClick={handleGetCertificate}
                  >
                    Get Certificate
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      {certificateData && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          certificateData={certificateData}
        />
      )}
    </div>
  );
}

export default ProfilePage;