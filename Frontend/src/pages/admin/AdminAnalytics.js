// src/pages/admin/AdminAnalytics.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/AdminAnalytics.css';

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [lessonAnalytics, setLessonAnalytics] = useState([]);
  const [signAnalytics, setSignAnalytics] = useState([]);
  const [mostFailed, setMostFailed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [selectedUnit, setSelectedUnit] = useState('all');
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const DIFFICULTY_COLORS = {
    beginner: '#4caf50',
    intermediate: '#ff9800',
    advanced: '#f44336'
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [ovRes, usRes, lsRes, sgRes, mfRes] = await Promise.all([
          axios.get('/api/admin/analytics/overview'),
          axios.get('/api/admin/analytics/users'),
          axios.get('/api/admin/analytics/lessons'),
          axios.get('/api/admin/analytics/signs'),
          axios.get('/api/admin/analytics/most-failed'),
        ]);

        setOverview(ovRes.data);
        setUserStats(usRes.data);
        setLessonAnalytics(lsRes.data);
        setSignAnalytics(sgRes.data);
        setMostFailed(mfRes.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail ||
          err.response?.statusText ||
          err.message ||
          'Unknown error'
        );
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <div className="loading">Loading analytics…</div>;
  if (error)   return <div className="error">Error: {error}</div>;

  // Get unique unit titles for the filter
  const unitTitles = [...new Set(lessonAnalytics.map(l => l.unit_title))];

  // Safely grab arrays or default to empty
  const signups = userStats?.signups_by_day || [];
  const logins = userStats?.logins_by_day || [];
  
  // Create engagement data
  const engagementData = signups.map((signup, idx) => {
    const loginEntry = logins.find(l => l.date === signup.date) || { count: 0 };
    return {
      date: new Date(signup.date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      signups: signup.count,
      logins: loginEntry.count,
      rawDate: signup.date // Keep the original date for reference
    };
  });
  
  // Format data for lesson completion rate
  const filteredLessons = selectedUnit === 'all'
    ? lessonAnalytics
    : lessonAnalytics.filter(l => l.unit_title === selectedUnit);
  
  const completionRateData = filteredLessons
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 10);
    
  // Data for difficulty distribution
  const difficultyData = [
    { label: 'Beginner', value: signAnalytics.filter(s => s.difficulty_level === 'beginner').length },
    { label: 'Intermediate', value: signAnalytics.filter(s => s.difficulty_level === 'intermediate').length },
    { label: 'Advanced', value: signAnalytics.filter(s => s.difficulty_level === 'advanced').length }
  ];
  
  // Calculate total for percentages
  const difficultyTotal = difficultyData.reduce((acc, item) => acc + item.value, 0);
  difficultyData.forEach(item => {
    item.percentage = difficultyTotal > 0 ? Math.round((item.value / difficultyTotal) * 100) : 0;
  });
  
  // Data for most failed lessons
  const failedLessonsData = mostFailed
    .sort((a, b) => b.failure_rate - a.failure_rate)
    .slice(0, 5);

  // Data for top sign error rates
  const topSignErrorData = signAnalytics
    .sort((a, b) => b.error_rate - a.error_rate)
    .slice(0, 5);

  return (
    <div className="admin-analytics">
      <h1>Analytics Dashboard</h1>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="dateRange">Date Range:</label>
          <select 
            id="dateRange" 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="unitFilter">Filter by Unit:</label>
          <select 
            id="unitFilter" 
            value={selectedUnit} 
            onChange={e => setSelectedUnit(e.target.value)}
          >
            <option value="all">All Units</option>
            {unitTitles.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* OVERVIEW */}
      <section className="overview-section">
        <h2>Key Performance Indicators</h2>
        <div className="overview-grid">
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <h3>Total Users</h3>
            <p className="metric-value">{overview.total_users}</p>
            <p className="metric-subtext">
              <span className="metric-positive">+12%</span> from last month
            </p>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🔥</div>
            <h3>Active Users (7d)</h3>
            <p className="metric-value">{overview.active_users_last_week}</p>
            <p className="metric-subtext">
              <span className="metric-positive">+5%</span> from last week
            </p>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📚</div>
            <h3>Lessons</h3>
            <p className="metric-value">{overview.total_lessons}</p>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">✓</div>
            <h3>Completed Lessons</h3>
            <p className="metric-value">{overview.completed_lessons}</p>
            <p className="metric-subtext">
              {Math.round((overview.completed_lessons / (overview.total_users * overview.total_lessons)) * 100)}% completion rate
            </p>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🔄</div>
            <h3>Avg. Streak</h3>
            <p className="metric-value">{overview.average_streak}</p>
            <p className="metric-subtext">days</p>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">💎</div>
            <h3>Total Rubies</h3>
            <p className="metric-value">{overview.total_rubies_earned}</p>
          </div>
        </div>
      </section>

      {/* USER ENGAGEMENT CHART */}
      <section className="chart-section">
        <h2>User Engagement (Last 30 days)</h2>
        
        <div className="vanilla-chart user-engagement-chart">
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#8884d8" }}></span>
              <span>New Signups</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: "#82ca9d" }}></span>
              <span>User Logins</span>
            </div>
          </div>
          
          <div className="chart-bars">
            {engagementData.map((data, index) => (
              <div className="chart-bar-group" key={index}>
                <div className="date-label">{data.date}</div>
                <div className="bar-container">
                  <div 
                    className="bar signup-bar" 
                    style={{ 
                      height: `${Math.min(100, data.signups * 5)}px`,
                      backgroundColor: "#8884d8"
                    }}
                    title={`Signups: ${data.signups}`}
                  ></div>
                  <div 
                    className="bar login-bar"
                    style={{ 
                      height: `${Math.min(100, data.logins * 5)}px`,
                      backgroundColor: "#82ca9d"
                    }}
                    title={`Logins: ${data.logins}`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Condensed user engagement table */}
        <details>
          <summary>Show detailed daily data</summary>
          <table className="details-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Signups</th>
                <th>Who Signed Up?</th>
                <th>Logins</th>
                <th>Who Logged In?</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup, idx) => {
                const loginEntry = logins.find(l => l.date === signup.date) || {};
                const signupNames = Array.isArray(signup.names) ? signup.names : [];
                const loginNames = Array.isArray(loginEntry.names) ? loginEntry.names : [];

                return (
                  <tr key={signup.date}>
                    <td>{new Date(signup.date).toLocaleDateString()}</td>
                    <td>{signup.count}</td>
                    <td>
                      {signupNames.length > 0
                        ? signupNames.join(', ')
                        : <em>— none —</em>}
                    </td>
                    <td>{loginEntry.count ?? 0}</td>
                    <td>
                      {loginNames.length > 0
                        ? loginNames.join(', ')
                        : <em>— none —</em>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      </section>

      {/* TOP COMPLETERS AND STREAKS */}
      <section className="stats-section">
        <div className="stats-column">
          <h2>Top Streak Users</h2>
          <div className="stats-container">
            {userStats.top_streaks.map((user, index) => (
              <div key={user.username} className="stat-item">
                <div className="rank">{index + 1}</div>
                <div className="user-info">
                  <strong>{user.username}</strong>
                  <span className="streak">{user.streak} day streak</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="stats-column">
          <h2>Top Completers</h2>
          <div className="stats-container">
            {userStats.top_completions.map((user, index) => (
              <div key={user.username} className="stat-item">
                <div className="rank">{index + 1}</div>
                <div className="user-info">
                  <strong>{user.username}</strong>
                  <span className="completion">{user.completed_lessons} lessons</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LESSON COMPLETION RATES */}
      <section className="chart-section">
        <h2>Lesson Completion Rates</h2>
        
        <div className="vanilla-chart horizontal-bar-chart">
          {completionRateData.map((lesson, index) => (
            <div className="horizontal-bar-item" key={index}>
              <div className="bar-label">{lesson.lesson_title}</div>
              <div className="bar-container">
                <div 
                  className="horizontal-bar"
                  style={{ 
                    width: `${lesson.completion_rate}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                >
                  <span className="bar-value">{lesson.completion_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Lesson Analytics Table */}
        <details>
          <summary>Show all lesson data</summary>
          <table className="details-table">
            <thead>
              <tr>
                <th>Lesson</th><th>Unit</th><th>Attempts</th>
                <th>Completions</th><th>Rate (%)</th><th>Avg Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map(l => (
                <tr key={l.lesson_id}>
                  <td>{l.lesson_title}</td>
                  <td>{l.unit_title}</td>
                  <td>{l.total_attempts}</td>
                  <td>{l.completions}</td>
                  <td>{l.completion_rate.toFixed(1)}</td>
                  <td>{l.average_progress.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      {/* SIGN ANALYTICS */}
      <section className="chart-grid-section">
        <h2>Sign Analytics</h2>
        
        <div className="chart-grid">
          <div className="chart-card">
            <h3>Sign Difficulty Distribution</h3>
            
            <div className="vanilla-chart pie-chart">
              <div className="pie-container">
                {difficultyData.map((item, index) => {
                  // Calculate the angles for the pie slices
                  const startPercent = difficultyData
                    .slice(0, index)
                    .reduce((acc, d) => acc + d.percentage, 0);
                  const size = item.percentage;
                  
                  return (
                    <div 
                      key={item.label}
                      className="pie-slice"
                      style={{
                        backgroundColor: Object.values(DIFFICULTY_COLORS)[index],
                        clipPath: `conic-gradient(from ${startPercent * 3.6}deg, 
                                  currentColor ${size * 3.6}deg, transparent 0)`
                      }}
                      title={`${item.label}: ${item.percentage}%`}
                    ></div>
                  );
                })}
                <div className="pie-center"></div>
              </div>
              
              <div className="pie-legend">
                {difficultyData.map((item, index) => (
                  <div className="legend-item" key={item.label}>
                    <span 
                      className="legend-color" 
                      style={{ backgroundColor: Object.values(DIFFICULTY_COLORS)[index] }}
                    ></span>
                    <span>{item.label}: {item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="chart-card">
            <h3>Top 5 Signs by Error Rate</h3>
            
            <div className="vanilla-chart horizontal-bar-chart">
              {topSignErrorData.map((sign, index) => (
                <div className="horizontal-bar-item" key={index}>
                  <div className="bar-label">{sign.sign_text}</div>
                  <div className="bar-container">
                    <div 
                      className="horizontal-bar"
                      style={{ 
                        width: `${sign.error_rate}%`,
                        backgroundColor: DIFFICULTY_COLORS[sign.difficulty_level]
                      }}
                    >
                      <span className="bar-value">{sign.error_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
                
        {/* Sign Analytics Table */}
        <details>
          <summary>Show all sign data</summary>
          <table className="details-table">
            <thead>
              <tr>
                <th>Sign</th><th>Lesson</th><th>Unit</th>
                <th>Difficulty</th><th>Error Rate</th><th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {signAnalytics.map(s => (
                <tr key={s.sign_id}>
                  <td>{s.sign_text}</td>
                  <td>{s.lesson_title}</td>
                  <td>{s.unit_title}</td>
                  <td className={`difficulty-${s.difficulty_level}`}>
                    {s.difficulty_level}
                  </td>
                  <td>{s.error_rate.toFixed(1)}%</td>
                  <td>{s.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      {/* MOST FAILED LESSONS */}
      <section className="chart-section">
        <h2>Most Failed Lessons</h2>
        
        <div className="vanilla-chart vertical-bar-chart">
          {failedLessonsData.map((lesson, index) => (
            <div className="vertical-bar-container" key={index}>
              <div 
                className="vertical-bar" 
                style={{ 
                  height: `${lesson.failure_rate}%`,
                  backgroundColor: "#f44336" 
                }}
                title={`${lesson.failure_rate.toFixed(1)}%`}
              >
                <span className="bar-top-value">{lesson.failure_rate.toFixed(1)}%</span>
              </div>
              <div className="vertical-bar-label">{lesson.lesson_title}</div>
            </div>
          ))}
        </div>
                
        {/* Most Failed Lessons Table */}
        <details>
          <summary>Show detailed failure data</summary>
          <table className="details-table">
            <thead>
              <tr>
                <th>Lesson</th><th>Unit</th>
                <th>Attempts</th><th>Failures</th><th>Failure Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {mostFailed.map(item => (
                <tr key={item.lesson_id}>
                  <td>{item.lesson_title}</td>
                  <td>{item.unit_title}</td>
                  <td>{item.total_attempts}</td>
                  <td>{item.failures}</td>
                  <td>{item.failure_rate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
    </div>
  );
};

export default AdminAnalytics;