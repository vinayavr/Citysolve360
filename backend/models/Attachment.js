const pool = require('../config/database');

class Attachment {
  static async createForIssue(issueId, filename, mimetype, fileData) {
    const [result] = await pool.query(
      'INSERT INTO attachments (issue_id, filename, mimetype, data) VALUES (?, ?, ?, ?)',
      [issueId, filename, mimetype, fileData]
    );
    return result.insertId;
  }

  static async createForComment(commentId, filename, mimetype, fileData) {
    const [result] = await pool.query(
      'INSERT INTO attachments (comment_id, filename, mimetype, data) VALUES (?, ?, ?, ?)',
      [commentId, filename, mimetype, fileData]
    );
    return result.insertId;
  }

  static async findByIssueId(issueId) {
    const [rows] = await pool.query(
      `SELECT a.*, ic.timestamp as comment_timestamp, u.name as uploaded_by_name
       FROM attachments a
       LEFT JOIN issuecomments ic ON a.comment_id = ic.id
       LEFT JOIN users u ON ic.user_id = u.id
       WHERE a.issue_id = ? OR a.comment_id IN (
         SELECT id FROM issuecomments WHERE issue_id = ?
       )
       ORDER BY COALESCE(ic.timestamp, (SELECT created_at FROM issues WHERE id = ?)) ASC`,
      [issueId, issueId, issueId]
    );
    return rows;
  }

  static async findByCommentId(commentId) {
    const [rows] = await pool.query(
      'SELECT * FROM attachments WHERE comment_id = ?',
      [commentId]
    );
    return rows;
  }

  static async getAttachmentData(attachmentId) {
    const [rows] = await pool.query(
      'SELECT filename, mimetype, data FROM attachments WHERE id = ?',
      [attachmentId]
    );
    return rows[0];
  }
}

module.exports = Attachment;
