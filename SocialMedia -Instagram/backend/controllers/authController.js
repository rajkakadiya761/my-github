const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (user) => {
  try {
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email is already taken' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      isBanned: false // Explicitly set isBanned to false for new users
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Username not found' });
    }

    // Check if user is banned (only if the field exists)
    if (user.isBanned === true) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}; 