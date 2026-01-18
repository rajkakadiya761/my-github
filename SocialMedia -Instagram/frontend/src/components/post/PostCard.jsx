import React, { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaUserPlus, FaUserMinus, FaSmile, FaPaperPlane, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const PostCard = ({ post, currentUser, onLike, onComment, onFollow, onDelete }) => {
  // Add null checks for post and currentUser
  if (!post || !currentUser) {
    return null;
  }

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);
  const [showComments, setShowComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(post.id);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollow(post.userId);
  };

  const handleEmojiClick = (emojiData) => {
    setCommentText(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleCommentSubmit = (e) => {
    if ((e.type === 'click' || e.key === 'Enter') && commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  // Add this check to determine if follow button should be shown
  const shouldShowFollowButton = !post.isOwnPost && post.userId !== currentUser._id;

  return (
    <div className="post-card">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-user-info">
          <div className="post-profile-pic">
            {post.userProfilePic ? (
              <img src={post.userProfilePic} alt="" />
            ) : (
              <div className="post-profile-placeholder"></div>
            )}
          </div>
          <span className="post-username">{post.username}</span>
        </div>
        <span className="post-time">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>
        {shouldShowFollowButton && (
          <button 
            className={`post-action-button ${isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
            title={isFollowing ? 'Unfollow' : 'Follow'}
          >
            {isFollowing ? <FaUserMinus /> : <FaUserPlus />}
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        {post.image && (
          <div className="post-image">
            <img src={post.image} alt="" />
          </div>
        )}
        {post.text && <p className="post-text">{post.text}</p>}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button 
            className={`post-action-button ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span className="post-action-count">{post.likes?.length || 0}</span>
          </button>
          <button 
            className="post-action-button"
            onClick={() => setShowComments(!showComments)}
            title="Comments"
          >
            <FaComment />
            <span className="post-action-count">{post.comments?.length || 0}</span>
          </button>
        </div>
        {post.isOwnPost && onDelete && (
          <div className="post-actions-right">
            <button 
              className="post-action-button delete"
              onClick={() => onDelete(post._id)}
              title="Delete Post"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
          <div className="comments-list">
            {post.comments?.map(comment => (
              <div key={comment._id} className="post-comment">
                <div className="comment-user-info">
                  <span className="comment-username">{comment.userId?.username || 'Unknown User'}</span>
                  <span className="comment-time">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))}
          </div>
          <div className="comment-input-container">
            <div className="comment-input-wrapper">
              <input
                type="text"
                placeholder="Add a comment..."
                className="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={handleCommentSubmit}
              />
              <button 
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <FaSmile />
              </button>
              <button 
                className="submit-comment-button"
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width="100%"
                  height={400}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard; 