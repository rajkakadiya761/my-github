import React, { useState, useEffect } from 'react';
import PostCard from '../components/post/PostCard';
import api from '../utils/axiosConfig';

// Add backend URL constant
const BACKEND_URL = 'http://localhost:5000';

// Helper function to format image URLs
const formatImageUrl = (imagePath, type = 'profile') => {
  if (!imagePath) return null;
  
  // Remove leading slash if exists
  const cleanPath = imagePath.replace(/^\//, '');
  
  // If the path already includes 'uploads/', just add the backend URL
  if (cleanPath.startsWith('uploads/')) {
    return `${BACKEND_URL}/${cleanPath}`;
  }
  
  // Otherwise, add the appropriate prefix based on type
  const prefix = type === 'profile' ? 'uploads/profile-pictures/' : 'uploads/posts/';
  return `${BACKEND_URL}/${prefix}${cleanPath}`;
};

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          api.get('/users/profile'),
          api.get('/posts')
        ]);
        
        setCurrentUser({
          ...userResponse.data,
          profilePicture: formatImageUrl(userResponse.data.profilePicture, 'profile')
        });

        // Transform posts to match frontend structure
        const transformedPosts = postsResponse.data.map(post => {
          const postUserId = post.userId?._id || post.userId;
          const isFollowing = userResponse.data.following.some(
            following => following._id === postUserId
          );

          return {
            ...post,
            id: post._id,
            userId: postUserId,
            username: post.userId?.username || 'Unknown User',
            userProfilePic: formatImageUrl(post.userId?.profilePicture, 'profile'),
            image: post.image ? formatImageUrl(post.image, 'post') : null,
            isLiked: Array.isArray(post.likes) ? post.likes.includes(userResponse.data._id) : false,
            isFollowing: isFollowing,
            likes: post.likes || [],
            comments: (post.comments || []).map(comment => ({
              ...comment,
              username: comment.userId?.username || 'Unknown User',
              userProfilePic: formatImageUrl(comment.userId?.profilePicture, 'profile')
            }))
          };
        });
        
        setPosts(transformedPosts);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load feed data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.isLiked ? post.likes.filter(id => id !== currentUser._id) : [...post.likes, currentUser._id],
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
      // Transform the new comment to include full image URLs if needed
      const newComment = {
        ...response.data,
        username: response.data.userId?.username || 'Unknown User',
        userProfilePic: formatImageUrl(response.data.userId?.profilePicture, 'profile')
      };
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      ));
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      
      // Update currentUser with new following list
      setCurrentUser(response.data);
      
      // Update all posts by this user to reflect new follow state
      setPosts(posts.map(post => 
        post.userId === userId 
          ? { ...post, isFollowing: !post.isFollowing }
          : post
      ));

      // Refresh the data to ensure everything is in sync
      loadData();
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  if (loading || !currentUser) {
    return <div className="feed-container">Loading...</div>;
  }

  if (error) {
    return <div className="feed-container error">{error}</div>;
  }

  return (
    <div className="feed-container">
      <div className="header">
        <h1>Feed</h1>
      </div>
      {posts.length === 0 ? (
        <div className="no-posts">
          <p>No posts yet</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={handleLike}
              onComment={handleComment}
              onFollow={handleFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed; 