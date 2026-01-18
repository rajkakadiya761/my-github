const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('followers', '_id username profilePicture')
      .populate('following', '_id username profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format the user data
    const formattedUser = {
      ...user.toObject(),
      followers: user.followers.map(follower => ({
        _id: follower._id.toString(),
        username: follower.username,
        profilePicture: follower.profilePicture ? 
          `http://localhost:5000/uploads/profile-pictures/${follower.profilePicture}` : 
          null
      })),
      following: user.following.map(following => ({
        _id: following._id.toString(),
        username: following.username,
        profilePicture: following.profilePicture ? 
          `http://localhost:5000/uploads/profile-pictures/${following.profilePicture}` : 
          null
      })),
      profilePicture: user.profilePicture ? 
        `http://localhost:5000/uploads/profile-pictures/${user.profilePicture}` : 
        null
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update profile (username and bio)
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, dateOfBirth } = req.body;
    
    // Check if username is taken
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const updateData = {
      username,
      bio,
      dateOfBirth: dateOfBirth || null
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    )
    .select('-password')
    .populate('followers', '_id username profilePicture')
    .populate('following', '_id username profilePicture');

    // Format the user data
    const formattedUser = {
      ...user.toObject(),
      followers: user.followers.map(follower => ({
        _id: follower._id.toString(),
        username: follower.username,
        profilePicture: follower.profilePicture ? 
          `http://localhost:5000/uploads/profile-pictures/${follower.profilePicture}` : 
          null
      })),
      following: user.following.map(following => ({
        _id: following._id.toString(),
        username: following.username,
        profilePicture: following.profilePicture ? 
          `http://localhost:5000/uploads/profile-pictures/${following.profilePicture}` : 
          null
      })),
      profilePicture: user.profilePicture ? 
        `http://localhost:5000/uploads/profile-pictures/${user.profilePicture}` : 
        null
    };

    res.json(formattedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update profile picture
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the old profile picture filename
    const user = await User.findById(req.user.id);
    const oldProfilePicture = user.profilePicture;

    // If there's an old profile picture and it's not the default, delete it
    if (oldProfilePicture && 
        oldProfilePicture !== 'default-avatar.png' && 
        !oldProfilePicture.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'profile-pictures', oldProfilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new profile picture
    const profilePicture = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePicture } },
      { new: true }
    ).select('-password');

    // Construct full URL for profile picture
    updatedUser.profilePicture = `http://localhost:5000/uploads/profile-pictures/${profilePicture}`;

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove profile picture
exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // If there's a profile picture and it's not the default one
    if (user.profilePicture && 
        user.profilePicture !== 'default-avatar.png' && 
        !user.profilePicture.startsWith('http')) {
      const picturePath = path.join(__dirname, '..', 'uploads', 'profile-pictures', user.profilePicture);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    // Reset to default profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePicture: null } },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Follow/Unfollow a user
exports.toggleFollow = async (req, res) => {
  try {
    if (req.user.id === req.params.userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: userToFollow._id }
      });
      await User.findByIdAndUpdate(userToFollow._id, {
        $pull: { followers: currentUser._id }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUser._id, {
        $addToSet: { following: userToFollow._id }
      });
      await User.findByIdAndUpdate(userToFollow._id, {
        $addToSet: { followers: currentUser._id }
      });
    }

    // Get updated user data
    const updatedUser = await User.findById(req.user.id)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports; 