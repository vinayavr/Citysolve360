const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getIssues,
  getIssue,
  createIssue,
  uploadImages,
  updateIssue,
  updateIssueStatus,
  assignIssue,
  deleteIssue,
  getIssueStats
} = require('../controllers/issueController');

// Public statistics (if needed)
router.get('/stats', protect, getIssueStats);

// Upload images
router.post('/upload-images', protect, upload.array('images', 5), uploadImages);

// CRUD operations
router.route('/')
  .get(protect, getIssues)
  .post(protect, authorize('citizen'), createIssue);

router.route('/:id')
  .get(protect, getIssue)
  .put(protect, updateIssue)
  .delete(protect, deleteIssue);

// Status update (officials only)
router.put('/:id/status', protect, authorize('official'), updateIssueStatus);

// Assignment (officials only)
router.put('/:id/assign', protect, authorize('official'), assignIssue);

module.exports = router;