const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });

    console.log('📦 Connected to MySQL server');

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'Citysolve360'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'Citysolve360'}' created/verified`);

    await connection.query(`USE ${process.env.DB_NAME || 'Citysolve360'}`);

    const sqlFile = fs.readFileSync(path.join(__dirname, '../../DB.sql'), 'utf8');
    
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✅ Database schema initialized successfully');
    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
