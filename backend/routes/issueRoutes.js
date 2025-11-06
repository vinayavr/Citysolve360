const express = require('express');
const router = express.Router();
const {
  createIssue,
  getMyCitizenIssues,
  getOfficialIssues,
  getIssueDetails,
  updateIssueStatus,
  escalateIssue,
  getIssueCategories,
  downloadAttachment
} = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  validateCreateIssue,
  validateStatusUpdate,
  validateEscalation,
  validateIssueId,
  validateAttachmentId,
  validateFileUpload,
  sanitizeInput,
  validate
} = require('../middleware/validators');

// Get issue categories
router.get('/categories', protect, getIssueCategories);

// Create new issue (citizen only) with validation
router.post(
  '/',
  protect,
  authorize('citizen'),
  sanitizeInput,
  upload.array('attachments', 5),
  validateFileUpload,
  validateCreateIssue,
  validate,
  createIssue
);

// Get citizen's own issues
router.get('/my-issues', protect, authorize('citizen'), getMyCitizenIssues);

// Get issues for officials/higher officials
router.get('/official-issues', protect, authorize('official', 'higherofficial'), getOfficialIssues);

// Get issue details by ID
router.get(
  '/:issueId',
  protect,
  validateIssueId,
  validate,
  getIssueDetails
);

// Update issue status (officials/higher officials only) with mandatory comment
router.put(
  '/:issueId/status',
  protect,
  authorize('official', 'higherofficial'),
  sanitizeInput,
  upload.array('attachments', 5),
  validateFileUpload,
  validateStatusUpdate,
  validate,
  updateIssueStatus
);

// Escalate issue (citizen only) with mandatory comment
router.post(
  '/:issueId/escalate',
  protect,
  authorize('citizen'),
  sanitizeInput,
  upload.array('attachments', 5),
  validateFileUpload,
  validateEscalation,
  validate,
  escalateIssue
);

// Download attachment
router.get(
  '/attachment/:attachmentId',
  protect,
  validateAttachmentId,
  validate,
  downloadAttachment
);

module.exports = router;
