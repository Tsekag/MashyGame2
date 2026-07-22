// server/routes/user.js

import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

function toAbsoluteImageUrl(req, imageUrl) {
  if (!imageUrl) return null;
  if (typeof imageUrl !== 'string') return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/uploads/${imageUrl}`;
  return `${req.protocol}://${req.get('host')}${normalizedPath}`;
}


// GET /api/genres
router.get('/genres', async (req, res) => {
  try {
    const [genres] = await pool.execute(
      'SELECT id, name, emoji FROM genres WHERE is_active = 1 ORDER BY name ASC'
    );
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// GET /api/characters?genre_id=...
router.get('/characters', async (req, res) => {
  try {
    const { genre_id } = req.query;
    if (!genre_id) {
      return res.status(400).json({ error: 'genre_id query parameter is required' });
    }

    const [characters] = await pool.execute(
      `SELECT 
         gc.id, 
         gc.name, 
         gc.description, 
         gc.image_url, 
         g.name AS genre
       FROM genre_characters gc
       JOIN genres g ON gc.genre_id = g.id
       WHERE gc.genre_id = ? AND gc.is_active = 1
       ORDER BY gc.created_at DESC`,
      [genre_id]
    );

    // ✅ Add full URL for images
    const withFullUrl = characters.map(c => ({
      ...c,
      image: toAbsoluteImageUrl(req, c.image_url)
    }));

    res.json(withFullUrl);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

export default router;
