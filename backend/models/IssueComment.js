const pool = require('../config/database');

class IssueComment {
  static async create(issueId, userId, comment) {
    const [result] = await pool.query(
      'INSERT INTO issuecomments (issue_id, user_id, comment) VALUES (?, ?, ?)',
      [issueId, userId, comment]
    );
    return result.insertId;
  }

  static async findByIssueId(issueId) {
    const [rows] = await pool.query(
      `SELECT ic.*, u.name as user_name, u.role as user_role
       FROM issuecomments ic
       JOIN users u ON ic.user_id = u.id
       WHERE ic.issue_id = ?
       ORDER BY ic.timestamp ASC`,
      [issueId]
    );
    return rows;
  }

  static async findById(commentId) {
    const [rows] = await pool.query(
      `SELECT ic.*, u.name as user_name, u.role as user_role
       FROM issuecomments ic
       JOIN users u ON ic.user_id = u.id
       WHERE ic.id = ?`,
      [commentId]
    );
    return rows[0];
  }
}

module.exports = IssueComment;
