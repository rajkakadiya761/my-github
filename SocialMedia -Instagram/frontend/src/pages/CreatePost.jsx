import React, { useState, useEffect } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import api from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

const CreatePost = ({ setActivePage }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) {
      setError('Please add some text or an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a post');
        navigate('/login');
        return;
      }

      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (image) formData.append('image', image);

      const response = await api.post('/posts', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Post created successfully:', response.data);

      // Reset form and redirect to feed
      setText('');
      setImage(null);
      setImagePreview(null);
      setActivePage('feed');
    } catch (err) {
      console.error('Error creating post:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to create post');
        console.error('Error details:', err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <h1>Create Post</h1>
      <form onSubmit={handleSubmit} className="create-post-form">
        <div className="form-group">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="post-text-input"
          />
        </div>

        <div className="image-upload-section">
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                onClick={removeImage}
                className="remove-image-button"
                title="Remove Image"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <label htmlFor="image-upload" className="image-upload-label">
                <FaImage size={24} />
                <span>Add Photo</span>
              </label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => setActivePage('feed')}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading || (!text.trim() && !image)}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost; 