const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { validateRegister, validateLogin, validate } = require('../middleware/validators');
const { sanitizeInput } = require('../middleware/sanitize');
const { authMiddleware } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new citizen
 */
router.post(
  '/register',
  sanitizeInput,      // Remove HTML/scripts
  validateRegister,   // Validate fields
  validate,           // Check validation errors
  register            // Process registration
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  sanitizeInput,      // Remove HTML/scripts
  validateLogin,      // Validate fields
  validate,           // Check validation errors
  login               // Process login
);

/**
 * GET /api/auth/profile
 * Get logged-in user's profile
 */
router.get(
  '/profile',
  authMiddleware,     // Check if user is authenticated
  getProfile          // Get profile
);

/**
 * POST /api/auth/logout
 * Logout user (optional - mainly frontend-side)
 */
router.post(
  '/logout',
  authMiddleware,     // Check if user is authenticated
  (req, res) => {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
);

module.exports = router;
