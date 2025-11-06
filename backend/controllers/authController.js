const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Citizen = require('../models/Citizen');

/**
 * Register a new citizen
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    console.log('📍 Register request received');
    console.log('Body:', req.body);

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log(`❌ Email already exists: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.'
      });
    }

    console.log('✅ Email is unique');

    // Create user in users table
    const userId = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'citizen'
    });

    console.log(`✅ User created with ID: ${userId}`);

    // Create corresponding citizen entry
    const citizenId = await Citizen.create(userId);

    console.log(`✅ Citizen entry created with ID: ${citizenId}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId, role: 'citizen', citizenId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log('✅ JWT token created');
    console.log('✅ Registration successful');

    res.status(201).json({
      success: true,
      token,
      user: {
        userId,
        name,
        email,
        role: 'citizen',
        citizenId,
        phone,
        address
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Registration failed. Backend error: ' + error.message
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`📍 Login attempt with email: ${email}`);

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Email not registered. Please sign up first.'
      });
    }

    console.log(`✅ User found: ${email}`);

    // Check password
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    console.log(`✅ Password correct for user: ${email}`);

    // Get user type details
    let userDetails = { userId: user.id, role: user.role };

    if (user.role === 'citizen') {
      const citizen = await Citizen.findByUserId(user.id);
      if (!citizen) {
        console.log(`❌ Citizen data not found for user: ${email}`);
        return res.status(500).json({
          success: false,
          message: 'Citizen profile not found. Contact support.'
        });
      }
      userDetails.citizenId = citizen.id;
    }

    // Generate token
    const token = jwt.sign(userDetails, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    console.log(`✅ Login successful for: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        ...userDetails,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error message:', error.message);

    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    console.log(`📍 Get profile for user: ${req.user.userId}`);

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log(`❌ User not found: ${req.user.userId}`);
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    console.log(`✅ Profile retrieved for: ${user.email}`);

    res.json({
      success: true,
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    console.error('Error message:', error.message);

    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

/**
 * Logout user (optional - mainly frontend-side)
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    console.log(`📍 Logout for user: ${req.user.userId}`);
    
    // Token is deleted on frontend by clearing localStorage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);

    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};
