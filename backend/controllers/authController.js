const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to sign JWT Token
const generateToken = (userId, email) => {
  const jwtSecret = process.env.JWT_SECRET || 'evaluation_secret_token_12345';
  return jwt.sign(
    { id: userId, email },
    jwtSecret,
    { expiresIn: '7d' } // Secure and long-lasting session for evaluations
  );
};

// @route   POST api/auth/register
// @desc    Register a new user
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // 1. Thorough Validation
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing credentials. Please fill in all fields (name, email, password).' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password is too weak. Must be at least 6 characters.' 
    });
  }

  try {
    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email address already exists.' 
      });
    }

    // 3. Create User (pre-save handles hashing)
    const newUser = await User.create({ name, email, password });
    
    // 4. Issue JWT Access Token
    const token = generateToken(newUser._id, newUser.email);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error occurred during registration.' 
    });
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic validation
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide both email and password.' 
    });
  }

  try {
    // 2. Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid login credentials (email or password).' 
      });
    }

    // 3. Verify password
    const isMatch = await User.comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid login credentials (email or password).' 
      });
    }

    // 4. Generate JWT
    const token = generateToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error occurred during login.' 
    });
  }
};
