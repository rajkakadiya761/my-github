import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import Logo from '../common/Logo';

const Login = () => {
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
    
    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      // Force a page reload to ensure all components recognize the new token
      window.location.href = '/main';
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 403 && err.response?.data?.message?.includes('banned')) {
        setError('Your account has been banned. Please contact the administrator.');
      } else if (err.response?.status === 401) {
        setError('Username not found or incorrect password');
      } else {
        setError('An error occurred. Please try again later.');
      }
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
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            required
          />
          <button type="submit" className="submit-button">
            Log In
          </button>
        </form>
        <div className="link-container">
          <Link to="/signup" className="auth-link">
            Create Account
          </Link>
          <Link to="/admin-login" className="admin-link">
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 