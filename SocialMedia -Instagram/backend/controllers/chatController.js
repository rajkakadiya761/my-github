const User = require('../models/User');

// Search users for chat
exports.searchUsers = async (req, res) => {
  try {
    const searchQuery = req.query.username || '';
    
    // Find users whose username starts with the search query
    const users = await User.find({
      username: { $regex: `^${searchQuery}`, $options: 'i' },
      _id: { $ne: req.user._id }, // Exclude current user
      status: 'active' // Only show active users
    })
    .select('username profilePicture')
    .sort({ username: 1 }) // Sort alphabetically
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
}; 