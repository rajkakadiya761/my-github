const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  deletePost,
  getUserPosts
} = require('../controllers/postController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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

// Routes
router.post('/', auth, upload.single('image'), createPost);
router.get('/', auth, getPosts);
router.get('/user/:userId', auth, getUserPosts);
router.post('/:postId/like', auth, toggleLike);
router.post('/:postId/comments', auth, addComment);
router.delete('/:postId', auth, deletePost);

module.exports = router; 