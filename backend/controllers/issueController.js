const db = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Create a new issue
 * POST /api/issues
 */
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category_id, priority, attachment_ids } = req.body;
    const userId = req.user.userId;

    console.log('📍 Creating issue for user:', userId);

    // Validate required fields
    if (!title || !description || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    // Insert issue
    const issueQuery = `
      INSERT INTO issues (citizen_id, title, description, category_id, priority, status, created_by, created_at)
      VALUES ((SELECT id FROM citizens WHERE user_id = ?), ?, ?, ?, ?, ?, ?, NOW())
    `;

    return new Promise((resolve, reject) => {
      db.query(
        issueQuery,
        [userId, title, description, category_id, priority || 'medium', 'open', userId],
        (error, results) => {
          if (error) {
            console.error('Issue creation error:', error);
            reject(error);
          } else {
            const issueId = results.insertId;
            console.log('✅ Issue created with ID:', issueId);
            
            res.status(201).json({
              success: true,
              message: 'Issue created successfully',
              data: {
                issueId,
                title,
                description,
                status: 'open',
                createdAt: new Date()
              }
            });
            resolve();
          }
        }
      );
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating issue',
      error: error.message
    });
  }
};

/**
 * Get citizen's own issues
 * GET /api/issues/my-issues
 */
exports.getMyCitizenIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('📍 Fetching issues for citizen user:', userId);

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id, 
        i.title, 
        i.description, 
        i.category_id, 
        ic.name as category_name,
        i.priority, 
        i.status, 
        i.created_at,
        COUNT(ia.id) as attachment_count
      FROM issues i
      LEFT JOIN issue_categories ic ON i.category_id = ic.id
      LEFT JOIN issue_attachments ia ON i.id = ia.issue_id
      WHERE i.created_by = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) {
          console.error('Fetch citizen issues error:', error);
          reject(error);
        } else {
          console.log('✅ Fetched', results.length, 'issues');
          
          res.json({
            success: true,
            message: 'Issues retrieved successfully',
            data: results,
            pagination: {
              page,
              limit,
              total: results.length
            }
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Get citizen issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
      error: error.message
    });
  }
};

/**
 * Get official's assigned issues
 * GET /api/issues/official
 */
exports.getOfficialIssues = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('📍 Fetching issues for official user:', userId);

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id, 
        i.title, 
        i.description, 
        i.category_id, 
        ic.name as category_name,
        i.priority, 
        i.status, 
        i.created_at,
        c.id as citizen_id,
        u.name as citizen_name,
        COUNT(ia.id) as attachment_count
      FROM issues i
      LEFT JOIN issue_categories ic ON i.category_id = ic.id
      LEFT JOIN citizens c ON i.citizen_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN issue_attachments ia ON i.id = ia.issue_id
      WHERE i.assigned_to = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) {
          console.error('Fetch official issues error:', error);
          reject(error);
        } else {
          console.log('✅ Fetched', results.length, 'issues for official');
          
          res.json({
            success: true,
            message: 'Issues retrieved successfully',
            data: results,
            pagination: {
              page,
              limit,
              total: results.length
            }
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Get official issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
      error: error.message
    });
  }
};

/**
 * Get issue details by ID
 * GET /api/issues/:id
 */
exports.getIssueDetails = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📍 Fetching issue details for ID:', id);

    const issueQuery = `
      SELECT 
        i.*, 
        ic.name as category_name,
        c.id as citizen_id,
        u.name as citizen_name,
        u.phone as citizen_phone,
        u.address as citizen_address
      FROM issues i
      LEFT JOIN issue_categories ic ON i.category_id = ic.id
      LEFT JOIN citizens c ON i.citizen_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE i.id = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(issueQuery, [id], (error, results) => {
        if (error) {
          console.error('Fetch issue details error:', error);
          reject(error);
        } else if (results.length === 0) {
          res.status(404).json({
            success: false,
            message: 'Issue not found'
          });
          resolve();
        } else {
          const issue = results[0];
          
          // Get attachments
          const attachmentQuery = 'SELECT * FROM issue_attachments WHERE issue_id = ?';
          db.query(attachmentQuery, [id], (attachError, attachments) => {
            if (attachError) {
              console.error('Fetch attachments error:', attachError);
            }

            console.log('✅ Issue details retrieved');
            
            res.json({
              success: true,
              message: 'Issue details retrieved successfully',
              data: {
                ...issue,
                attachments: attachments || []
              }
            });
            resolve();
          });
        }
      });
    });
  } catch (error) {
    console.error('Get issue details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue details',
      error: error.message
    });
  }
};

/**
 * Update issue status
 * PUT /api/issues/:id/status
 */
exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const userId = req.user.userId;

    console.log('📍 Updating issue', id, 'status to:', status);

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateQuery = `
      UPDATE issues 
      SET status = ?, remarks = ?, modified_by = ?, modified_at = NOW()
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(updateQuery, [status, remarks || null, userId, id], (error, results) => {
        if (error) {
          console.error('Update issue status error:', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          res.status(404).json({
            success: false,
            message: 'Issue not found'
          });
          resolve();
        } else {
          console.log('✅ Issue status updated');
          
          res.json({
            success: true,
            message: 'Issue status updated successfully',
            data: {
              issueId: id,
              status,
              remarks,
              modifiedAt: new Date()
            }
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue status',
      error: error.message
    });
  }
};

/**
 * Escalate issue to higher official
 * POST /api/issues/:id/escalate
 */
exports.escalateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log('📍 Escalating issue', id);

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason is required'
      });
    }

    const escalateQuery = `
      UPDATE issues 
      SET priority = 'high', 
          status = 'escalated',
          remarks = ?,
          modified_by = ?,
          modified_at = NOW()
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      db.query(escalateQuery, [reason, userId, id], (error, results) => {
        if (error) {
          console.error('Escalate issue error:', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          res.status(404).json({
            success: false,
            message: 'Issue not found'
          });
          resolve();
        } else {
          console.log('✅ Issue escalated');
          
          res.json({
            success: true,
            message: 'Issue escalated successfully',
            data: {
              issueId: id,
              status: 'escalated',
              priority: 'high',
              reason,
              escalatedAt: new Date()
            }
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Escalate issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error escalating issue',
      error: error.message
    });
  }
};

/**
 * Get all issue categories
 * GET /api/issues/categories
 */
exports.getIssueCategories = async (req, res) => {
  try {
    console.log('📍 Fetching issue categories');

    const query = 'SELECT id, name, description FROM issue_categories WHERE active = 1 ORDER BY name';

    return new Promise((resolve, reject) => {
      db.query(query, (error, results) => {
        if (error) {
          console.error('Fetch categories error:', error);
          reject(error);
        } else {
          console.log('✅ Fetched', results.length, 'categories');
          
          res.json({
            success: true,
            message: 'Categories retrieved successfully',
            data: results
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

/**
 * Download attachment for an issue
 * GET /api/issues/:id/attachment/:attachmentId
 */
exports.downloadAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    console.log('📍 Downloading attachment:', attachmentId, 'for issue:', id);

    const query = 'SELECT * FROM issue_attachments WHERE id = ? AND issue_id = ?';

    return new Promise((resolve, reject) => {
      db.query(query, [attachmentId, id], (error, results) => {
        if (error) {
          console.error('Fetch attachment error:', error);
          reject(error);
        } else if (results.length === 0) {
          res.status(404).json({
            success: false,
            message: 'Attachment not found'
          });
          resolve();
        } else {
          const attachment = results[0];
          const filePath = path.join(__dirname, '..', 'uploads', attachment.file_path);

          // Check if file exists
          if (!fs.existsSync(filePath)) {
            return res.status(404).json({
              success: false,
              message: 'File not found on server'
            });
          }

          console.log('✅ Downloading file:', filePath);

          res.download(filePath, attachment.file_name);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading attachment',
      error: error.message
    });
  }
};