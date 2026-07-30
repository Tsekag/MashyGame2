// server/config/database.js (ESM version)

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mashup_game',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool for better performance
export const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        selected_genres JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create genres table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS genres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        emoji VARCHAR(32) DEFAULT NULL,
        image_url VARCHAR(500) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Backfill schema for existing databases created before emoji support.
    const [emojiColumn] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'genres'
         AND COLUMN_NAME = 'emoji'`
    );
    if (emojiColumn.length === 0) {
      await pool.execute(`
        ALTER TABLE genres
        ADD COLUMN emoji VARCHAR(32) DEFAULT NULL
        AFTER name
      `);
      console.log('✅ Added emoji column to genres table');
    }

    const [imageUrlColumn] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'genres'
         AND COLUMN_NAME = 'image_url'`
    );
    if (imageUrlColumn.length === 0) {
      await pool.execute(`
        ALTER TABLE genres
        ADD COLUMN image_url VARCHAR(500) DEFAULT NULL
        AFTER emoji
      `);
      console.log('✅ Added image_url column to genres table');
    }

    // Create genre_characters table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS genre_characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        genre_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
      )
    `);

    // Create uploads table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500) NOT NULL,
        character1_data JSON,
        character2_data JSON,
        genres JSON,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Backfill schema for existing databases created before upload description support.
    const [uploadDescriptionColumn] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'uploads'
         AND COLUMN_NAME = 'description'`
    );
    if (uploadDescriptionColumn.length === 0) {
      await pool.execute(`
        ALTER TABLE uploads
        ADD COLUMN description TEXT
        AFTER title
      `);
      console.log('✅ Added description column to uploads table');
    }

    // Create likes table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        upload_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (user_id, upload_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
      )
    `);

    // Create comments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        upload_id INT NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}
