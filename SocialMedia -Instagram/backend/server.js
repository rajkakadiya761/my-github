const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directories if they don't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const profileUploadsDir = path.join(uploadsDir, 'profile');
const chatUploadsDir = path.join(uploadsDir, 'chat');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
}
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 