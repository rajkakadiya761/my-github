import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import Logo from '../common/Logo';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check hardcoded admin credentials
    if (formData.username === 'admin' && formData.password === 'admin1234') {
      // Store admin session
      localStorage.setItem('adminSession', 'true');
      navigate('/admin-portal');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <Logo />
        <div className="admin-portal-text">Admin Portal</div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            name="username"
            placeholder="Admin Username"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Admin Password"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            required
          />
          <button type="submit" className="submit-button">
            Admin Login
          </button>
        </form>
        <div className="link-container">
          <Link to="/" className="auth-link">
            Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 