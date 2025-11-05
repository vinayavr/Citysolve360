const { promisePool } = require('../config/database');
const { uploadImage, deleteImage } = require('../config/imagekit');

// @desc    Get all issues with filters
// @route   GET /api/issues
// @access  Private
exports.getIssues = async (req, res, next) => {
  try {
    const { status, category, priority, sortBy = 'latest' } = req.query;
    
    let query = `
      SELECT 
        i.*,
        u.name as citizen_name,
        u.email as citizen_email,
        o.name as assigned_official_name
      FROM issues i
      LEFT JOIN users u ON i.citizen_id = u.id
      LEFT JOIN users o ON i.assigned_to = o.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by citizen for citizens role
    if (req.user.role === 'citizen') {
      query += ' AND i.citizen_id = ?';
      params.push(req.user.id);
    }
    
    // Filter by status
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    // Filter by category
    if (category) {
      query += ' AND i.category = ?';
      params.push(category);
    }
    
    // Filter by priority
    if (priority) {
      query += ' AND i.priority = ?';
      params.push(priority);
    }
    
    // Sorting
    switch (sortBy) {
      case 'oldest':
        query += ' ORDER BY i.created_at ASC';
        break;
      case 'priority':
        query += ' ORDER BY FIELD(i.priority, "urgent", "high", "medium", "low")';
        break;
      case 'status':
        query += ' ORDER BY FIELD(i.status, "pending", "assigned", "in_progress", "resolved", "closed")';
        break;
      default: // latest
        query += ' ORDER BY i.created_at DESC';
    }
    
    const [issues] = await promisePool.query(query, params);
    
    res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
exports.getIssue = async (req, res, next) => {
  try {
    const [issues] = await promisePool.query(
      `SELECT 
        i.*,
        u.name as citizen_name,
        u.email as citizen_email,
        u.phone as citizen_phone,
        o.name as assigned_official_name,
        o.department as assigned_official_department
      FROM issues i
      LEFT JOIN users u ON i.citizen_id = u.id
      LEFT JOIN users o ON i.assigned_to = o.id
      WHERE i.id = ?`,
      [req.params.id]
    );
    
    if (issues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const issue = issues[0];
    
    // Check authorization - citizens can only view their own issues
    if (req.user.role === 'citizen' && issue.citizen_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this issue'
      });
    }
    
    res.json({
      success: true,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private (Citizens)
exports.createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      priority = 'medium',
      location_address,
      landmark,
      ward_number,
      before_images
    } = req.body;
    
    // Validation
    if (!title || !description || !category || !location_address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Insert issue
    const [result] = await promisePool.query(
      `INSERT INTO issues 
      (title, description, category, priority, location_address, landmark, ward_number, before_images, citizen_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        category,
        priority,
        location_address,
        landmark,
        ward_number,
        JSON.stringify(before_images || []),
        req.user.id
      ]
    );
    
    // Get created issue
    const [issues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      issue: issues[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload images for issue
// @route   POST /api/issues/upload-images
// @access  Private
exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }
    
    const uploadPromises = req.files.map(file => uploadImage(file, 'issues'));
    const uploadedImages = await Promise.all(uploadPromises);
    
    res.json({
      success: true,
      images: uploadedImages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private
exports.updateIssue = async (req, res, next) => {
  try {
    // Get existing issue
    const [issues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [req.params.id]
    );
    
    if (issues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const issue = issues[0];
    
    // Check authorization
    if (req.user.role === 'citizen' && issue.citizen_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this issue'
      });
    }
    
    const {
      title,
      description,
      category,
      priority,
      location_address,
      landmark,
      ward_number
    } = req.body;
    
    const fieldsToUpdate = {};
    if (title) fieldsToUpdate.title = title;
    if (description) fieldsToUpdate.description = description;
    if (category) fieldsToUpdate.category = category;
    if (priority) fieldsToUpdate.priority = priority;
    if (location_address) fieldsToUpdate.location_address = location_address;
    if (landmark !== undefined) fieldsToUpdate.landmark = landmark;
    if (ward_number !== undefined) fieldsToUpdate.ward_number = ward_number;
    
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    const setClause = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(fieldsToUpdate), req.params.id];
    
    await promisePool.query(
      `UPDATE issues SET ${setClause} WHERE id = ?`,
      values
    );
    
    // Get updated issue
    const [updatedIssues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Issue updated successfully',
      issue: updatedIssues[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue status (Officials only)
// @route   PUT /api/issues/:id/status
// @access  Private (Officials)
exports.updateIssueStatus = async (req, res, next) => {
  try {
    const { status, resolution_notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Get existing issue
    const [issues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [req.params.id]
    );
    
    if (issues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const issue = issues[0];
    const oldStatus = issue.status;
    
    // Update issue
    const updateData = { status };
    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes;
    }
    if (status === 'resolved') {
      updateData.resolved_at = new Date();
    }
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), req.params.id];
    
    await promisePool.query(
      `UPDATE issues SET ${setClause} WHERE id = ?`,
      values
    );
    
    // Log status change
    await promisePool.query(
      `INSERT INTO issue_updates (issue_id, updated_by, old_status, new_status, update_type, comment)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, req.user.id, oldStatus, status, 'status_change', resolution_notes]
    );
    
    // Get updated issue
    const [updatedIssues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Status updated successfully',
      issue: updatedIssues[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign issue to official
// @route   PUT /api/issues/:id/assign
// @access  Private (Officials)
exports.assignIssue = async (req, res, next) => {
  try {
    const { assigned_to } = req.body;
    
    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        message: 'Official ID is required'
      });
    }
    
    // Verify official exists
    const [officials] = await promisePool.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [assigned_to, 'official']
    );
    
    if (officials.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Official not found'
      });
    }
    
    // Update issue
    await promisePool.query(
      'UPDATE issues SET assigned_to = ?, status = ? WHERE id = ?',
      [assigned_to, 'assigned', req.params.id]
    );
    
    // Log assignment
    await promisePool.query(
      `INSERT INTO issue_updates (issue_id, updated_by, update_type, comment)
      VALUES (?, ?, ?, ?)`,
      [req.params.id, req.user.id, 'assignment', `Assigned to official ID ${assigned_to}`]
    );

    // Get updated issue
    const [updatedIssues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Issue assigned successfully',
      issue: updatedIssues[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Own issues only for citizens, all for officials)
exports.deleteIssue = async (req, res, next) => {
  try {
    // Get existing issue
    const [issues] = await promisePool.query(
      'SELECT * FROM issues WHERE id = ?',
      [req.params.id]
    );
    
    if (issues.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const issue = issues[0];
    
    // Check authorization
    if (req.user.role === 'citizen' && issue.citizen_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this issue'
      });
    }
    
    // Delete associated images from ImageKit if needed
    // Parse and delete before_images
    if (issue.before_images) {
      const beforeImages = JSON.parse(issue.before_images);
      for (const image of beforeImages) {
        if (image.fileId) {
          await deleteImage(image.fileId);
        }
      }
    }
    
    // Parse and delete after_images
    if (issue.after_images) {
      const afterImages = JSON.parse(issue.after_images);
      for (const image of afterImages) {
        if (image.fileId) {
          await deleteImage(image.fileId);
        }
      }
    }
    
    // Delete issue (cascade will delete related records)
    await promisePool.query('DELETE FROM issues WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get issue statistics
// @route   GET /api/issues/stats
// @access  Private
exports.getIssueStats = async (req, res, next) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high
      FROM issues
    `;
    
    const params = [];
    
    // Filter by citizen for citizens
    if (req.user.role === 'citizen') {
      query += ' WHERE citizen_id = ?';
      params.push(req.user.id);
    }
    
    const [stats] = await promisePool.query(query, params);
    
    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    next(error);
  }
};