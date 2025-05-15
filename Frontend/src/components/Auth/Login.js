import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/authService';
import '../../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Using the updated login function that extracts user_id from nested response
      await login(email, password);
      navigate('/Home');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-container">
      <h2 className="user-title">User Login</h2>
      {error && <p className="user-error">{error}</p>}
      <form onSubmit={handleSubmit} className="user-form">
        <div className="user-input-group">
          <label htmlFor="email" className="user-label">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="user-input"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="user-input-group">
          <label htmlFor="password" className="user-label">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="user-input"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          className="user-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="user-links">
        <Link to="/signup" className="user-link">Create Account</Link>
        <Link to="/admin/login" className="user-link">Admin Login</Link>
      </div>
    </div>
  );
}

export default Login;