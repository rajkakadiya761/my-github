import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../common/Logo';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', response.data.token);
      navigate('/main');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred during registration');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <Logo />
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            name="username"
            placeholder="Username (min. 3 characters)"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            required
            minLength={3}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min. 6 characters)"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            required
            minLength={6}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-field"
            required
          />
          <button type="submit" className="submit-button">
            Sign Up
          </button>
        </form>
        <div className="link-container">
          <Link to="/" className="auth-link">
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 