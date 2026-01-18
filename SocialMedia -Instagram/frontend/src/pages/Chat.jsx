import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaSmile, FaImage, FaPaperPlane } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import api from '../utils/axiosConfig';

const Chat = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/all');
        setAllUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/messages/${selectedUser._id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await api.get(`/users/search?username=${searchQuery.trim()}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      const formData = new FormData();
      formData.append('recipientId', selectedUser._id);
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await api.post('/chat/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
      setSelectedImage(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:5000${imageUrl}`;
  };

  const renderUserList = (users) => {
    return users.map((user) => (
      <div 
        key={user._id} 
        className="user-result-item"
        onClick={() => handleUserSelect(user)}
      >
        <div className="user-result-avatar">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <span className="user-result-username">{user.username}</span>
      </div>
    ));
  };

  const handleImageClick = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat</h1>
        <button 
          className="search-toggle-button"
          onClick={() => {
            setShowSearch(!showSearch);
            if (!showSearch) {
              setSearchResults([]);
              setSearchQuery('');
            }
          }}
        >
          <FaSearch />
        </button>
      </div>

      {showSearch ? (
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="search-input"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-button"
                  onClick={handleClear}
                >
                  <FaTimes />
                </button>
              )}
              <button type="submit" className="search-button">
                <FaSearch />
              </button>
            </div>
          </form>

          <div className="search-results">
            {isSearching ? (
              <div className="search-loading">Searching...</div>
            ) : searchResults.length > 0 ? (
              renderUserList(searchResults)
            ) : searchQuery && !isSearching ? (
              <div className="no-results">No users found</div>
            ) : null}
          </div>
        </div>
      ) : !selectedUser ? (
        <div className="users-list">
          {isLoading ? (
            <div className="search-loading">Loading users...</div>
          ) : allUsers.length > 0 ? (
            renderUserList(allUsers)
          ) : (
            <div className="no-results">No users available</div>
          )}
        </div>
      ) : null}

      {selectedUser && (
        <div className="chat-window">
          <div className="chat-window-header">
            <div className="chat-user-info">
              <div className="user-result-avatar">
                {selectedUser.profilePicture ? (
                  <img src={selectedUser.profilePicture} alt={selectedUser.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedUser.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="user-result-username">{selectedUser.username}</span>
            </div>
            <button 
              className="close-chat-button"
              onClick={() => setSelectedUser(null)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`message ${message.sender === selectedUser._id ? 'received' : 'sent'}`}
              >
                {message.image && (
                  <div className="message-image">
                    <img 
                      src={formatImageUrl(message.image)} 
                      alt="Message attachment" 
                      onClick={() => handleImageClick(formatImageUrl(message.image))}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                {message.content && (
                  <div className="message-content">{message.content}</div>
                )}
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-input-form">
            <div className="message-input-wrapper">
              <button
                type="button"
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <FaSmile />
              </button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />

              <button
                type="button"
                className="image-button"
                onClick={() => fileInputRef.current.click()}
              >
                <FaImage />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              <button
                type="submit"
                className="send-button"
                disabled={!newMessage.trim() && !selectedImage}
              >
                <FaPaperPlane />
              </button>
            </div>

            {showEmojiPicker && (
              <div className="emoji-picker-container" onClick={e => e.stopPropagation()}>
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme="dark"
                  emojiStyle="native"
                  searchDisabled
                  skinTonesDisabled
                  height={320}
                  width="100%"
                />
              </div>
            )}

            {selectedImage && (
              <div className="image-preview">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected"
                />
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={() => setSelectedImage(null)}
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat; 