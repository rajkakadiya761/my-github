import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';
import SideNav from '../components/navigation/SideNav';
import Feed from './Feed';
import Profile from './Profile';
import Chat from './Chat';
import CreatePost from './CreatePost';

const MainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize activePage from URL
  const [activePage, setActivePage] = useState(() => {
    const path = location.pathname.split('/')[2];
    return path || 'feed';
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        await api.get('/users/profile');
        setIsLoading(false);
      } catch (err) {
        console.error('Token validation error:', err);
        setIsLoading(false);
      }
    };

    validateToken();
  }, [navigate]);

  // Update URL when page changes
  useEffect(() => {
    if (activePage === 'feed') {
      navigate('/main', { replace: true });
    } else {
      navigate(`/main/${activePage}`, { replace: true });
    }
  }, [activePage, navigate]);

  // Update page when URL changes
  useEffect(() => {
    const path = location.pathname.split('/')[2];
    if (path) {
      setActivePage(path);
    } else {
      setActivePage('feed');
    }
  }, [location]);

  const handleProfileUpdate = () => {
    setKey(prevKey => prevKey + 1);
  };

  const handlePageChange = (newPage) => {
    console.log('Changing page to:', newPage);
    setActivePage(newPage);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    console.log('Rendering content for page:', activePage);
    switch (activePage) {
      case 'feed':
        return <Feed />;
      case 'chat':
        return <Chat />;
      case 'create':
        return <CreatePost setActivePage={handlePageChange} />;
      case 'profile':
        return <Profile onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="main-layout">
      <SideNav 
        key={key}
        activePage={activePage} 
        setActivePage={handlePageChange} 
      />
      <div className="content-area">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainPage; 