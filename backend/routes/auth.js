const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  getOfficials,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

// Public routes
router.post('/register', upload.single('avatar'), register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/officials', protect, authorize('official'), getOfficials);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;