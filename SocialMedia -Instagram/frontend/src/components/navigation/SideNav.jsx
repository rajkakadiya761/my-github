import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt, FaUser, FaComments, FaPlus } from 'react-icons/fa';
import axios from 'axios';

const SideNav = ({ activePage, setActivePage }) => {
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    console.log('SideNav activePage:', activePage);
    fetchUserProfile();
  }, [activePage]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfilePicture(response.data.profilePicture);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="side-nav">
      <div className="nav-top">
        <button
          className={`sidenav-button ${activePage === 'feed' ? 'active' : ''}`}
          onClick={() => setActivePage('feed')}
          title="View Feed"
        >
          <FaHome size={24} />
        </button>
      </div>
      <div className="nav-bottom">
        <button
          className={`sidenav-button ${activePage === 'chat' ? 'active' : ''}`}
          onClick={() => {
            console.log('Clicking chat button');
            setActivePage('chat');
          }}
          title="Open Chat"
        >
          <FaComments size={24} />
        </button>
        <button
          className={`sidenav-button ${activePage === 'create' ? 'active' : ''}`}
          onClick={() => {
            console.log('Clicking create post button');
            setActivePage('create');
          }}
          title="Create Post"
        >
          <FaPlus size={24} />
        </button>
        <button
          className={`sidenav-button ${activePage === 'profile' ? 'active' : ''}`}
          onClick={() => setActivePage('profile')}
          title="View Profile"
          style={{ 
            border: '2px solid white',
            backgroundColor: '#262626',
            padding: '0'
          }}
        >
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt="" 
              className="profile-nav-image"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <FaUser size={24} />
          )}
        </button>
        <button 
          className="sidenav-button logout" 
          onClick={handleLogout}
          title="Sign Out"
        >
          <FaSignOutAlt size={24} />
        </button>
      </div>
    </nav>
  );
};

export default SideNav; 