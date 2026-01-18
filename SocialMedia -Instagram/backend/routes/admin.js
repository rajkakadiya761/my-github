const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, toggleBanUser } = require('../controllers/adminController');

// Get all users
router.get('/users', getAllUsers);

// Delete user and their data
router.delete('/users/:userId', deleteUser);

// Toggle user ban status
router.put('/users/:userId/ban', toggleBanUser);

module.exports = router; 