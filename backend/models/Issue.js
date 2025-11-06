const pool = require('../config/database');

class Issue {
  static async create(issueData) {
    const { citizen_id, category, description, created_by, updated_by } = issueData;
    
    const [result] = await pool.query(
      `INSERT INTO issues (citizen_id, category, description, status, created_by, updated_by) 
       VALUES (?, ?, ?, 'created', ?, ?)`,
      [citizen_id, category, description, created_by, updated_by]
    );
    
    return result.insertId;
  }

  static async findByCitizenId(citizenId) {
    const [rows] = await pool.query(
      `SELECT i.*, u.name as citizen_name
       FROM issues i
       JOIN citizens c ON i.citizen_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE i.citizen_id = ?
       ORDER BY i.created_at DESC`,
      [citizenId]
    );
    return rows;
  }

  static async findByDepartment(department) {
    const [rows] = await pool.query(
      `SELECT i.*, c.id as citizen_id, u.name as citizen_name, u.phone, u.address
       FROM issues i
       JOIN citizens c ON i.citizen_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE i.category LIKE ? AND i.status NOT IN ('rejected', 'completed')
       ORDER BY i.created_at DESC`,
      [`%${department}%`]
    );
    return rows;
  }

  static async findEscalatedByDepartment(department) {
    const [rows] = await pool.query(
      `SELECT i.*, c.id as citizen_id, u.name as citizen_name, u.phone, u.address
       FROM issues i
       JOIN citizens c ON i.citizen_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE i.category LIKE ? AND i.status = 'escalated'
       ORDER BY i.created_at DESC`,
      [`%${department}%`]
    );
    return rows;
  }

  static async findById(issueId) {
    const [rows] = await pool.query(
      `SELECT i.*, c.id as citizen_id, u.name as citizen_name, u.phone, u.address
       FROM issues i
       JOIN citizens c ON i.citizen_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE i.id = ?`,
      [issueId]
    );
    return rows[0];
  }

  static async updateStatus(issueId, status, updatedBy) {
    const [result] = await pool.query(
      `UPDATE issues 
       SET status = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, updatedBy, issueId]
    );
    return result.affectedRows > 0;
  }

  static async canEscalate(issueId, citizenId) {
    const [rows] = await pool.query(
      `SELECT id, status, DATEDIFF(NOW(), created_at) as days_old
       FROM issues
       WHERE id = ? AND citizen_id = ? AND status = 'created' AND DATEDIFF(NOW(), created_at) >= 30`,
      [issueId, citizenId]
    );
    return rows.length > 0;
  }
}

module.exports = Issue;
