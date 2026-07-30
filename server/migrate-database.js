// server/migrate-database.js - Script to add missing columns to existing database

import dotenv from 'dotenv';
import { pool } from './config/database.js';

dotenv.config();

async function migrateDatabase() {
  try {
    console.log('🔧 Migrating database schema...');
    
    // Add is_active column to genres table if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE genres 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE 
        AFTER name
      `);
      console.log('✅ Added is_active column to genres table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  is_active column already exists in genres table');
      } else {
        throw error;
      }
    }

    // Add emoji column to genres table if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE genres
        ADD COLUMN emoji VARCHAR(32) DEFAULT NULL
        AFTER name
      `);
      console.log('✅ Added emoji column to genres table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  emoji column already exists in genres table');
      } else {
        throw error;
      }
    }

    // Add image_url column to genres table if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE genres
        ADD COLUMN image_url VARCHAR(500) DEFAULT NULL
        AFTER emoji
      `);
      console.log('✅ Added image_url column to genres table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  image_url column already exists in genres table');
      } else {
        throw error;
      }
    }
    
    // Add is_active column to genre_characters table if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE genre_characters 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE 
        AFTER image_url
      `);
      console.log('✅ Added is_active column to genre_characters table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  is_active column already exists in genre_characters table');
      } else {
        throw error;
      }
    }
    
    // Update existing records to have is_active = true
    await pool.execute('UPDATE genres SET is_active = TRUE WHERE is_active IS NULL');
    await pool.execute('UPDATE genre_characters SET is_active = TRUE WHERE is_active IS NULL');
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateDatabase();
