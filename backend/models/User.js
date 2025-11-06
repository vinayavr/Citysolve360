const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      const { name, email, password, phone, address, role } = userData;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into users table
      const query = `
        INSERT INTO users (name, email, password, phone, address, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      return new Promise((resolve, reject) => {
        db.query(
          query,
          [name, email, hashedPassword, phone, address, role],
          (error, results) => {
            if (error) {
              console.error('User.create error:', error);
              reject(error);
            } else {
              console.log('✅ User created with ID:', results.insertId);
              resolve(results.insertId);
            }
          }
        );
      });
    } catch (error) {
      console.error('User.create exception:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';

      return new Promise((resolve, reject) => {
        db.query(query, [email], (error, results) => {
          if (error) {
            console.error('User.findByEmail error:', error);
            reject(error);
          } else {
            resolve(results[0] || null);
          }
        });
      });
    } catch (error) {
      console.error('User.findByEmail exception:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';

      return new Promise((resolve, reject) => {
        db.query(query, [id], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0] || null);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password comparison error:', error);
      throw error;
    }
  }

  static async getCitizenDetails(userId) {
    try {
      const query = 'SELECT * FROM citizens WHERE user_id = ?';

      return new Promise((resolve, reject) => {
        db.query(query, [userId], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0] || null);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  static async getOfficialDetails(userId) {
    try {
      const query = 'SELECT * FROM officials WHERE user_id = ?';

      return new Promise((resolve, reject) => {
        db.query(query, [userId], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0] || null);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
