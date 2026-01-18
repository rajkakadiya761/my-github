import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaKey, FaCamera, FaTrash, FaBirthdayCake, FaTimes } from 'react-icons/fa';
import api from '../utils/axiosConfig';
import PostCard from '../components/post/PostCard';

const Profile = ({ onProfileUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingDOB, setIsEditingDOB] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    dateOfBirth: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user?._id) {
      console.log('User ID available, fetching posts for:', user._id);
      fetchUserPosts();
    }
  }, [user?._id]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/profile');
      console.log('User data:', response.data); // Debug log
      
      // Format profile pictures for followers and following
      const formattedUser = {
        ...response.data,
        followers: response.data.followers?.map(follower => ({
          ...follower,
          profilePicture: follower.profilePicture || null
        })) || [],
        following: response.data.following?.map(following => ({
          ...following,
          profilePicture: following.profilePicture || null
        })) || []
      };
      
      setUser(formattedUser);
      setFormData({
        ...formData,
        username: formattedUser.username,
        bio: formattedUser.bio || '',
        dateOfBirth: formattedUser.dateOfBirth ? new Date(formattedUser.dateOfBirth).toISOString().split('T')[0] : ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
      setLoading(false);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      setPostsError('');
      console.log('Fetching posts for user:', user._id);
      const response = await api.get(`/posts/user/${user._id}`);
      console.log('Received posts:', response.data);
      setUserPosts(response.data);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setPostsError('Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setUserPosts(userPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.isLiked ? post.likes.filter(id => id !== user._id) : [...post.likes, user._id],
              isLiked: !post.isLiked 
            }
          : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, { text: commentText });
      const newComment = {
        ...response.data,
        username: response.data.userId?.username || 'Unknown User',
        userProfilePic: response.data.userId?.profilePicture ? 
          `http://localhost:5000/uploads/profile-pictures/${response.data.userId.profilePicture}` : 
          null
      };
      setUserPosts(userPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      ));
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${postId}`);
        // Remove the deleted post from the state
        setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      } catch (err) {
        console.error('Error deleting post:', err);
        setError('Failed to delete post');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/users/profile', {
        username: formData.username,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth || null
      });
      
      setUser(response.data);
      setShowEditModal(false);
      setError('');
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIsChangingPassword(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile-picture',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Clear the input value to allow re-upload of the same file
      e.target.value = '';
      
      setUser(response.data);
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      // Clear the input value even on error
      e.target.value = '';
      setError('Failed to update profile picture');
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        'http://localhost:5000/api/users/profile-picture',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Clear any file input values in the DOM
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
      setUser(response.data);
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      setError('Failed to remove profile picture');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Return empty string if date is invalid
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      // Refresh user data after follow/unfollow
      fetchUserData();
    } catch (err) {
      console.error('Error following user:', err);
      setError('Failed to follow/unfollow user');
    }
  };

  // Add follow button to user items in followers/following lists
  const UserItem = ({ user: listUser, isFollowing }) => (
    <div key={listUser._id} className="user-item">
      <div className="user-item-pic">
        {listUser.profilePicture ? (
          <img src={listUser.profilePicture} alt={`${listUser.username}'s profile`} />
        ) : (
          <div className="user-item-placeholder" />
        )}
      </div>
      <span className="user-item-username">{listUser.username}</span>
      {listUser._id !== user._id && (
        <button
          className={`follow-button ${isFollowing ? 'following' : ''}`}
          onClick={() => handleFollow(listUser._id)}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );

  // Add this new function to handle cancel
  const handleCancel = () => {
    // Reset form data to current user values
    setFormData({
      ...formData,
      username: user.username,
      bio: user.bio || '',
      dateOfBirth: user.dateOfBirth || ''
    });
    setShowEditModal(false);
  };

  if (loading) {
    return <div className="profile-loading">Loading...</div>;
  }

  if (!user) {
    return <div className="profile-error">Failed to load profile</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture-placeholder">
              {user.profilePicture && <img src={user.profilePicture} alt="" />}
            </div>
            <div className="picture-actions">
              <label className="picture-action-button" title="Upload Profile Picture">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
                <FaCamera />
              </label>
              <button 
                className="picture-action-button"
                onClick={handleRemoveProfilePicture}
                title="Remove Profile Picture"
                disabled={!user.profilePicture}
              >
                <FaTrash />
              </button>
            </div>
          </div>
          
          <div className="profile-info">
            <h1 className="username">{user.username}</h1>
            {user.dateOfBirth && (
              <p className="date-of-birth">
                <FaBirthdayCake style={{ marginRight: '8px' }} />
                {formatDate(user.dateOfBirth)}
              </p>
            )}
            <div className="profile-stats">
              <button 
                className="stat-button"
                onClick={() => setShowFollowers(true)}
              >
                <span className="stat-count">{user.followers?.length || 0}</span>
                <span className="stat-label">Followers</span>
              </button>
              <button 
                className="stat-button"
                onClick={() => setShowFollowing(true)}
              >
                <span className="stat-count">{user.following?.length || 0}</span>
                <span className="stat-label">Following</span>
              </button>
            </div>
            <div className="profile-actions">
              <button 
                className="icon-button" 
                onClick={() => setShowEditModal(true)}
                title="Edit Profile"
              >
                <FaEdit />
              </button>
              <button 
                className="icon-button" 
                onClick={() => setIsChangingPassword(true)}
                title="Change Password"
              >
                <FaKey />
              </button>
            </div>
            <p className="bio">{user.bio || 'No bio yet'}</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* My Posts Section */}
        <div className="my-posts-section">
          <h2>My Posts</h2>
          {postsError && <div className="error-message">{postsError}</div>}
          {loadingPosts ? (
            <div className="posts-loading">Loading posts...</div>
          ) : (
            <div className="posts-grid">
              {userPosts.length > 0 ? (
                userPosts.map(post => (
                  <PostCard
                    key={post._id}
                    post={{
                      ...post,
                      isOwnPost: true
                    }}
                    currentUser={user}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDeletePost}
                  />
                ))
              ) : (
                <p className="no-posts">No posts yet</p>
              )}
            </div>
          )}
        </div>

        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Edit Profile</h2>
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    maxLength="160"
                    placeholder="Write a short bio about yourself..."
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-button">Save Changes</button>
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isChangingPassword && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-button">Update Password</button>
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFollowers && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Followers</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowFollowers(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="users-list">
                {user.followers?.map(follower => (
                  <UserItem 
                    key={follower._id}
                    user={follower}
                    isFollowing={user.following.some(f => f._id === follower._id)}
                  />
                ))}
                {(!user.followers || user.followers.length === 0) && (
                  <p className="no-users">No followers yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showFollowing && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Following</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowFollowing(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="users-list">
                {user.following?.map(following => (
                  <UserItem 
                    key={following._id}
                    user={following}
                    isFollowing={true}
                  />
                ))}
                {(!user.following || user.following.length === 0) && (
                  <p className="no-users">Not following anyone yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 