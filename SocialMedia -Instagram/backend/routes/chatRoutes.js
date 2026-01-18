const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// Search users for chat
router.get('/search', authenticateToken, chatController.searchUsers);

module.exports = router; 