const db = require('../config/database');

class Citizen {
  static async create(userId) {
    try {
      const query = 'INSERT INTO citizens (user_id) VALUES (?)';

      return new Promise((resolve, reject) => {
        db.query(query, [userId], (error, results) => {
          if (error) {
            console.error('Citizen.create error:', error);
            reject(error);
          } else {
            console.log('✅ Citizen entry created with ID:', results.insertId);
            resolve(results.insertId);
          }
        });
      });
    } catch (error) {
      console.error('Citizen.create exception:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM citizens WHERE id = ?';

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

  static async findByUserId(userId) {
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
}

module.exports = Citizen;
