const Post = require('../models/Post');
const path = require('path');
const fs = require('fs');

// Create a new post
exports.createPost = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Creating post with user:', req.user);
    
    const { text } = req.body;
    let imageUrl = null;

    if (!req.user || !req.user._id) {
      console.error('No user found in request:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.file) {
      // Move the uploaded file to the posts folder
      const postsDir = path.join(__dirname, '..', 'uploads', 'posts');
      if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, { recursive: true });
      }

      const oldPath = path.join(__dirname, '..', 'uploads', req.file.filename);
      const newPath = path.join(postsDir, req.file.filename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        imageUrl = `uploads/posts/${req.file.filename}`;
        console.log('Image URL:', imageUrl);
      } else {
        console.error('Original file not found:', oldPath);
      }
    }

    // Allow empty text if there's an image
    if (!text && !imageUrl) {
      return res.status(400).json({ message: 'Post must contain either text or an image' });
    }

    const postData = {
      userId: req.user._id,
      text: text || '',
      image: imageUrl
    };

    console.log('Creating post with data:', postData);
    const post = new Post(postData);

    console.log('Saving post:', post);
    await post.save();
    
    // Populate user data before sending response
    await post.populate('userId', 'username profilePicture');
    console.log('Post saved successfully:', post);
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      message: 'Error creating post',
      error: error.message,
      details: error.errors
    });
  }
};

// Get all posts with populated user data
exports.getPosts = async (req, res) => {
  try {
    console.log('Fetching posts excluding user:', req.user._id);
    
    // Exclude posts from the current user
    const posts = await Post.find({ userId: { $ne: req.user._id } })
      .populate('userId', 'username profilePicture')
      .populate('comments.userId', 'username profilePicture')
      .sort({ createdAt: -1 });

    // Transform posts to include necessary fields and proper URLs
    const transformedPosts = posts.map(post => {
      const postData = post.toObject();
      return {
        ...postData,
        _id: postData._id,
        id: postData._id,
        username: postData.userId?.username || 'Unknown User',
        userProfilePic: postData.userId?.profilePicture ? 
          `uploads/profile-pictures/${postData.userId.profilePicture}` : 
          null,
        image: postData.image,  // Keep the image path as is since it's already in correct format
        isLiked: Array.isArray(postData.likes) ? postData.likes.includes(req.user._id) : false,
        comments: (postData.comments || []).map(comment => ({
          ...comment,
          username: comment.userId?.username || 'Unknown User',
          userProfilePic: comment.userId?.profilePicture ? 
            `uploads/profile-pictures/${comment.userId.profilePicture}` : 
            null
        }))
      };
    });

    console.log('Sending transformed posts:', transformedPosts.length);
    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Like/Unlike a post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like' });
  }
};

// Add a comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add the comment with current timestamp
    const newComment = {
      userId: req.user._id,
      text,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Fetch the populated post to get the complete user data
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username profilePicture')
      .populate('comments.userId', 'username profilePicture');

    // Get the newly added comment with populated user data
    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    // Return the properly formatted comment
    res.json({
      _id: addedComment._id,
      text: addedComment.text,
      createdAt: addedComment.createdAt,
      userId: {
        _id: addedComment.userId._id,
        username: addedComment.userId.username,
        profilePicture: addedComment.userId.profilePicture
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete image if exists
    if (post.image) {
      const imagePath = path.join(__dirname, '..', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Use findByIdAndDelete instead of remove()
    await Post.findByIdAndDelete(post._id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Get posts by user ID
exports.getUserPosts = async (req, res) => {
  try {
    console.log('Fetching posts for user ID:', req.params.userId);
    
    const posts = await Post.find({ userId: req.params.userId })
      .populate('userId', 'username profilePicture')
      .populate('comments.userId', 'username profilePicture')
      .sort({ createdAt: -1 });

    console.log('Found posts:', posts.length);
    
    // Transform posts to match frontend structure (same as in getPosts)
    const transformedPosts = posts.map(post => {
      const postData = post.toObject();
      return {
        ...postData,
        id: postData._id,
        username: postData.userId?.username || 'Unknown User',
        userProfilePic: postData.userId?.profilePicture ? 
          `http://localhost:5000/uploads/profile-pictures/${postData.userId.profilePicture}` : 
          null,
        image: postData.image ? 
          `http://localhost:5000/${postData.image}` : 
          null,
        isLiked: Array.isArray(postData.likes) ? postData.likes.includes(req.user._id) : false,
        comments: (postData.comments || []).map(comment => ({
          ...comment,
          username: comment.userId?.username || 'Unknown User',
          userProfilePic: comment.userId?.profilePicture ? 
            `http://localhost:5000/uploads/profile-pictures/${comment.userId.profilePicture}` : 
            null
        }))
      };
    });

    console.log('Sending transformed posts:', transformedPosts.length);
    res.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 