const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfile, updateProfile, updatePassword, updateProfilePicture, removeProfilePicture, toggleFollow } = require('../controllers/userController');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'profile-pictures'));
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only jpeg, jpg, and png
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Get user profile
router.get('/profile', auth, getProfile);

// Update profile (username and bio)
router.put('/profile', auth, updateProfile);

// Update password
router.put('/password', auth, updatePassword);

// Update profile picture
router.put('/profile-picture', auth, upload.single('profilePicture'), handleMulterError, updateProfilePicture);

// Remove profile picture
router.delete('/profile-picture', auth, removeProfilePicture);

// Follow/Unfollow a user
router.post('/:userId/follow', auth, toggleFollow);

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const searchQuery = req.query.username || '';
    const users = await User.find({
      username: { $regex: searchQuery, $options: 'i' },
      _id: { $ne: req.user.id }, // Exclude current user
      isBanned: false // Only show non-banned users
    })
    .select('username profilePicture')
    .sort({ username: 1 })
    .limit(10);

    // Format users with full profile picture URLs
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture ? 
        `http://localhost:5000/uploads/profile-pictures/${user.profilePicture}` : 
        null
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get all users (for chat)
router.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      isBanned: false // Only show non-banned users
    })
    .select('username profilePicture')
    .sort({ username: 1 }); // Sort alphabetically

    // Format users with full profile picture URLs
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture ? 
        `http://localhost:5000/uploads/profile-pictures/${user.profilePicture}` : 
        null
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router; 