import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { FaBan, FaTrash, FaUnlock, FaUser } from 'react-icons/fa';
import { formatImageUrl } from '../utils/imageUtils';

const AdminPortal = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const isAdmin = localStorage.getItem('adminSession');
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}? This will delete all their posts and cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      setError('');
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId, username, currentBanStatus) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} ${username}?`)) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/ban`);
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isBanned: !user.isBanned }
          : user
      ));
      setError('');
    } catch (err) {
      setError(`Failed to ${action} user`);
      console.error(`Error ${action}ning user:`, err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin-login');
  };

  const renderProfilePicture = (user) => {
    if (!user.profilePicture) {
      return (
        <div className="profile-placeholder">
          <FaUser />
        </div>
      );
    }
    
    const profilePicUrl = formatImageUrl(user.profilePicture, 'profile');
    if (!profilePicUrl) {
      return (
        <div className="profile-placeholder">
          <FaUser />
        </div>
      );
    }

    return (
      <img 
        src={profilePicUrl}
        alt={`${user.username}'s profile`}
        onError={(e) => {
          const placeholder = document.createElement('div');
          placeholder.className = 'profile-placeholder';
          placeholder.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>';
          e.target.parentElement.replaceChild(placeholder, e.target);
        }}
      />
    );
  };

  if (loading) {
    return <div className="loading-message">Loading users...</div>;
  }

  return (
    <div className="admin-portal">
      <header className="admin-header">
        <h1>Admin Portal</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>
      <main className="admin-content">
        <div className="admin-section">
          <h2>Manage Users</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="users-grid">
            {users.map(user => (
              <div key={user._id} className="user-card">
                <div className="user-card-header">
                  <div className="user-profile-pic">
                    {renderProfilePicture(user)}
                  </div>
                  <div className="user-info">
                    <h3>{user.username}</h3>
                    <span className={`status-badge ${user.isBanned ? 'banned' : 'active'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="user-card-actions">
                  <button
                    onClick={() => handleToggleBan(user._id, user.username, user.isBanned)}
                    className={`action-button ${user.isBanned ? 'unban' : 'ban'}`}
                    title={user.isBanned ? 'Unban User' : 'Ban User'}
                  >
                    {user.isBanned ? <FaUnlock /> : <FaBan />}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id, user.username)}
                    className="action-button delete"
                    title="Delete User"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPortal; 