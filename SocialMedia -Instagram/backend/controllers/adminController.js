const User = require('../models/User');
const Post = require('../models/Post');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Delete user and their posts
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // First, remove all comments made by this user from all posts
    await Post.updateMany(
      { 'comments.userId': userId },
      { $pull: { comments: { userId: userId } } }
    );
    console.log(`Removed comments by user ${userId} from all posts`);

    // Then delete all posts by this user
    const deletePostsResult = await Post.deleteMany({ userId: userId });
    console.log(`Deleted ${deletePostsResult.deletedCount} posts from user ${userId}`);

    // Remove user from followers/following lists
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { 
        $pull: { 
          followers: userId,
          following: userId 
        }
      }
    );

    // Finally, delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User, their posts, and comments deleted successfully',
      postsDeleted: deletePostsResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user and their content' });
  }
};

// Ban/unban user
const toggleBanUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      isBanned: user.isBanned
    });
  } catch (error) {
    console.error('Error toggling user ban status:', error);
    res.status(500).json({ message: 'Error updating user ban status' });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  toggleBanUser
}; 