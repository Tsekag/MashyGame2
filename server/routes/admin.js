// server/routes/admin.js (ESM version)

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const serverRoutesDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(serverRoutesDir, '..');
const uploadsDir = path.join(serverDir, 'uploads');
const legacyUploadsDir = path.resolve(serverDir, '..', 'uploads');

function getStoredImagePath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const fileName = path.basename(imageUrl);
  const currentPath = path.join(uploadsDir, fileName);
  if (fs.existsSync(currentPath)) return currentPath;
  const legacyPath = path.join(legacyUploadsDir, fileName);
  if (fs.existsSync(legacyPath)) return legacyPath;
  return currentPath;
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'character-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// ===== GENRES ROUTES =====

// GET /api/admin/genres - List all genres
router.get('/genres', async (req, res) => {
  try {
    const [genres] = await pool.execute(
      'SELECT id, name, emoji, is_active, created_at, updated_at FROM genres ORDER BY name ASC'
    );
    res.json({ genres });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

// Input validation functions for admin routes
function sanitizeGenreName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/[<>]/g, '');
}

function validateGenreName(name) {
  const genreRegex = /^[a-zA-Z0-9\s\-_]{1,50}$/;
  return genreRegex.test(name);
}

// POST /api/admin/genres - Create new genre
router.post('/genres', async (req, res) => {
  try {
    const { name, emoji = '', is_active = true } = req.body;
    
    // Input validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Genre name is required' });
    }
    
    // Sanitize and validate
    const sanitizedName = sanitizeGenreName(name);
    if (sanitizedName.length < 1 || sanitizedName.length > 50) {
      return res.status(400).json({ error: 'Genre name must be between 1-50 characters' });
    }
    
    if (!validateGenreName(sanitizedName)) {
      return res.status(400).json({ error: 'Genre name contains invalid characters' });
    }

    const sanitizedEmoji = typeof emoji === 'string' ? emoji.trim() : '';

    const [result] = await pool.execute(
      'INSERT INTO genres (name, emoji, is_active) VALUES (?, ?, ?)',
      [sanitizedName, sanitizedEmoji || null, is_active]
    );

    res.status(201).json({
      message: 'Genre created successfully',
      genre: {
        id: result.insertId,
        name: sanitizedName,
        emoji: sanitizedEmoji || null,
        is_active: is_active,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Genre already exists' });
    } else {
      console.error('Error creating genre:', error);
      res.status(500).json({ error: 'Failed to create genre' });
    }
  }
});

// PUT /api/admin/genres/:id - Update genre
router.put('/genres/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emoji = '', is_active } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Genre name is required' });
    }

    // Sanitize and validate
    const sanitizedName = sanitizeGenreName(name);
    if (sanitizedName.length < 1 || sanitizedName.length > 50) {
      return res.status(400).json({ error: 'Genre name must be between 1-50 characters' });
    }
    
    if (!validateGenreName(sanitizedName)) {
      return res.status(400).json({ error: 'Genre name contains invalid characters' });
    }

    const sanitizedEmoji = typeof emoji === 'string' ? emoji.trim() : '';

    const [result] = await pool.execute(
      'UPDATE genres SET name = ?, emoji = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sanitizedName, sanitizedEmoji || null, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    res.json({
      message: 'Genre updated successfully',
      genre: {
        id: parseInt(id),
        name: sanitizedName,
        emoji: sanitizedEmoji || null,
        is_active: is_active,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Genre already exists' });
    } else {
      console.error('Error updating genre:', error);
      res.status(500).json({ error: 'Failed to update genre' });
    }
  }
});

// PATCH /api/admin/genres/:id/toggle - Toggle genre active status
router.patch('/genres/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'UPDATE genres SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    // Get updated genre data
    const [genres] = await pool.execute(
      'SELECT id, name, emoji, is_active, created_at, updated_at FROM genres WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Genre status updated successfully',
      genre: genres[0]
    });
  } catch (error) {
    console.error('Error toggling genre status:', error);
    res.status(500).json({ error: 'Failed to toggle genre status' });
  }
});

// DELETE /api/admin/genres/:id - Delete genre
router.delete('/genres/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM genres WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Genre not found' });
    }

    res.json({ message: 'Genre deleted successfully' });
  } catch (error) {
    console.error('Error deleting genre:', error);
    res.status(500).json({ error: 'Failed to delete genre' });
  }
});

// ===== CHARACTERS ROUTES =====

// GET /api/admin/characters - List all characters with genre info
router.get('/characters', async (req, res) => {
  try {
    const [characters] = await pool.execute(`
      SELECT 
        gc.id, 
        gc.name, 
        gc.description, 
        gc.image_url, 
        gc.is_active,
        gc.created_at,
        gc.updated_at,
        g.name as genre_name,
        g.id as genre_id
      FROM genre_characters gc
      JOIN genres g ON gc.genre_id = g.id
      ORDER BY gc.created_at DESC
    `);
    res.json({ characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// POST /api/admin/characters - Create new character
router.post('/characters', upload.single('image'), async (req, res) => {
  try {
    const { name, description, genre_id, is_active = true } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Character name is required' });
    }
    
    if (!genre_id) {
      return res.status(400).json({ error: 'Genre ID is required' });
    }

    // Verify genre exists
    const [genres] = await pool.execute('SELECT id FROM genres WHERE id = ?', [genre_id]);
    if (genres.length === 0) {
      return res.status(400).json({ error: 'Invalid genre ID' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.execute(
      'INSERT INTO genre_characters (name, description, image_url, genre_id, is_active) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), description?.trim() || null, imageUrl, genre_id, is_active === 'true' || is_active === true]
    );

    res.status(201).json({
      message: 'Character created successfully',
      character: {
        id: result.insertId,
        name: name.trim(),
        description: description?.trim() || null,
        image_url: imageUrl,
        genre_id: parseInt(genre_id),
        is_active: is_active === 'true' || is_active === true,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

// PUT /api/admin/characters/:id - Update character
router.put('/characters/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, genre_id, is_active } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Character name is required' });
    }

    // Get current character data
    const [characters] = await pool.execute(
      'SELECT image_url FROM genre_characters WHERE id = ?',
      [id]
    );

    if (characters.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const currentImageUrl = characters[0].image_url;
    let imageUrl = currentImageUrl;

    // If new image uploaded, update image URL and delete old image
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      
      // Delete old image file if it exists
      if (currentImageUrl) {
        const oldImagePath = getStoredImagePath(currentImageUrl);
        if (oldImagePath && fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const [result] = await pool.execute(
      'UPDATE genre_characters SET name = ?, description = ?, image_url = ?, genre_id = ?, is_active = ? WHERE id = ?',
      [name.trim(), description?.trim() || null, imageUrl, genre_id, is_active === 'true' || is_active === true, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({
      message: 'Character updated successfully',
      character: {
        id: parseInt(id),
        name: name.trim(),
        description: description?.trim() || null,
        image_url: imageUrl,
        genre_id: parseInt(genre_id),
        is_active: is_active === 'true' || is_active === true,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// PATCH /api/admin/characters/:id/toggle - Toggle character active status
router.patch('/characters/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'UPDATE genre_characters SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get updated character data with genre info
    const [characters] = await pool.execute(`
      SELECT 
        gc.id, 
        gc.name, 
        gc.description, 
        gc.image_url, 
        gc.is_active,
        gc.created_at,
        gc.updated_at,
        g.name as genre_name,
        g.id as genre_id
      FROM genre_characters gc
      JOIN genres g ON gc.genre_id = g.id
      WHERE gc.id = ?
    `, [id]);

    res.json({
      message: 'Character status updated successfully',
      character: characters[0]
    });
  } catch (error) {
    console.error('Error toggling character status:', error);
    res.status(500).json({ error: 'Failed to toggle character status' });
  }
});

// DELETE /api/admin/characters/:id - Delete character
router.delete('/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get character data to delete associated image
    const [characters] = await pool.execute(
      'SELECT image_url FROM genre_characters WHERE id = ?',
      [id]
    );

    if (characters.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Delete character from database
    const [result] = await pool.execute(
      'DELETE FROM genre_characters WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Delete associated image file
    const imageUrl = characters[0].image_url;
    if (imageUrl) {
      const imagePath = getStoredImagePath(imageUrl);
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

export default router;
