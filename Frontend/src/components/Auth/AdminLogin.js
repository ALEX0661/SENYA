import React, { useState } from 'react';
import { loginAdmin } from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/AdminLogin.css';

function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Use the updated admin login function
      const success = await loginAdmin(formData);
      if (success) {
        // Navigate to admin dashboard after successful authentication
        navigate("/admin");
      } else {
        setError("Authentication failed.");
      }
    } catch (err) {
      setError(err.message);
      console.error('Admin login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Portal</h2>
      {error && <p className="admin-error">{error}</p>}
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-input-group">
          <label htmlFor="email" className="admin-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="admin-input"
            autoComplete="admin-email"
          />
        </div>
        
        <div className="admin-input-group">
          <label htmlFor="password" className="admin-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            className="admin-input"
            autoComplete="admin-password"
          />
        </div>

        <button 
          type="submit" 
          className="admin-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Authenticating...' : 'Login'}
        </button>
      </form>
      
      <div className="user-login-link">
        <Link to="/" className="admin-link">Login as User</Link>
      </div>
    </div>
  );
}

export default AdminLogin;