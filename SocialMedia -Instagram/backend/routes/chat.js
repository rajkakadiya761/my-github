const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const multer = require('multer');
const path = require('path');

// Configure multer for chat image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/chat');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get messages between current user and another user
router.get('/messages/:userId', auth, async (req, res) => {
  try {
    const messages = await Chat.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    })
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a new message
router.post('/messages', auth, upload.single('image'), async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    
    const newMessage = new Chat({
      sender: req.user.id,
      recipient: recipientId,
      content: content || '',
      image: req.file ? `/uploads/chat/${req.file.filename}` : null
    });

    const savedMessage = await newMessage.save();
    res.json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 