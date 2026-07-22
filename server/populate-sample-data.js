// server/populate-sample-data.js - Script to populate database with sample data matching the uploaded UI

import dotenv from 'dotenv';
import { pool } from './config/database.js';

dotenv.config();

async function populateSampleData() {
  try {
    console.log('🎭 Populating database with sample data...');
    
    // Clear existing data
    await pool.execute('DELETE FROM genre_characters');
    await pool.execute('DELETE FROM genres');
    
    // Add sample genres matching the uploaded UI
    console.log('📚 Adding sample genres...');
    const sampleGenres = [
      { name: 'ADVENTURE', is_active: true },
      { name: 'FANTASY', is_active: true },
      { name: 'HORROR', is_active: true },
      { name: 'MYSTERY', is_active: true },
      { name: 'ROMANCE', is_active: false },
      { name: 'SCI-FI', is_active: false }
    ];
    
    const genreIds = {};
    for (const genre of sampleGenres) {
      const [result] = await pool.execute(
        'INSERT INTO genres (name, is_active) VALUES (?, ?)',
        [genre.name, genre.is_active]
      );
      genreIds[genre.name] = result.insertId;
      console.log(`  ✅ Added genre: ${genre.name} (${genre.is_active ? 'Active' : 'Inactive'})`);
    }
    
    // Add sample characters matching the uploaded UI
    console.log('👥 Adding sample characters...');
    const sampleCharacters = [
      {
        name: 'ELARA VANCE',
        description: 'Starship Captain',
        genre: 'SCI-FI',
        is_active: true
      },
      {
        name: 'JAX "IRONHIDE"',
        description: 'Mercenary Leader',
        genre: 'ADVENTURE',
        is_active: false
      },
      {
        name: 'KAELEN THORNE',
        description: 'Arcane Scholar',
        genre: 'FANTASY',
        is_active: true
      },
      {
        name: 'LORD VOLKOV',
        description: 'Vampire Noble',
        genre: 'HORROR',
        is_active: false
      },
      {
        name: 'LYRA SHADOWFEN',
        description: 'Rogue Assassin',
        genre: 'MYSTERY',
        is_active: true
      },
      {
        name: 'ZOE "GLITCH"',
        description: 'Cyber Hacker',
        genre: 'SCI-FI',
        is_active: true
      }
    ];
    
    for (const character of sampleCharacters) {
      const genreId = genreIds[character.genre];
      if (genreId) {
        await pool.execute(
          'INSERT INTO genre_characters (name, description, genre_id, is_active) VALUES (?, ?, ?, ?)',
          [character.name, character.description, genreId, character.is_active]
        );
        console.log(`  ✅ Added character: ${character.name} (${character.is_active ? 'Active' : 'Inactive'})`);
      }
    }
    
    console.log('🎉 Sample data populated successfully!');
    console.log('🚀 You can now access the admin panel at: http://localhost:5176/admin/login');
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  } finally {
    await pool.end();
  }
}

populateSampleData();
