// server/routes/uploads.js (ESM version)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --------------------- Multer config ---------------------
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `mashup-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// --------------------- Upload Artwork ---------------------
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, character1, character2, genres } = req.body;
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    if (!title) return res.status(400).json({ error: 'Missing title' });

    let character1Data, character2Data, genresData;
    try {
      character1Data = character1 ? JSON.parse(character1) : null;
      character2Data = character2 ? JSON.parse(character2) : null;
      genresData = genres ? JSON.parse(genres) : [];
    } catch {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const [result] = await pool.execute(`
      INSERT INTO uploads (user_id, title, description, image_url, character1_data, character2_data, genres, likes_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [
      userId,
      title,
      description?.trim() || null,
      imageUrl,
      JSON.stringify(character1Data),
      JSON.stringify(character2Data),
      JSON.stringify(genresData)
    ]);

    res.status(201).json({
      message: 'Upload successful',
      upload: {
        id: result.insertId,
        title,
        description: description?.trim() || '',
        imageUrl,
        character1: character1Data,
        character2: character2Data,
        genres: genresData,
        likes: 0,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    res.status(500).json({ error: 'Upload failed', message: 'Internal server error' });
  }
});

// --------------------- Gallery ---------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [uploads] = await pool.execute(`
      SELECT u.id, u.user_id, u.title, u.image_url, u.likes_count, u.created_at,
             u.description,
             u.character1_data, u.character2_data, u.genres,
             users.username
      FROM uploads u
      JOIN users ON u.user_id = users.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      uploads: uploads.map(u => ({
        id: u.id,
        userId: u.user_id,
        username: u.username,
        title: u.title,
        description: u.description || '',
        imageUrl: u.image_url,
        likes: u.likes_count,
        character1: u.character1_data,
        character2: u.character2_data,
        genres: u.genres,
        createdAt: u.created_at
      }))
    });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// --------------------- User Uploads ---------------------
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const [uploads] = await pool.execute(`
      SELECT u.id, u.user_id, u.title, u.image_url, u.likes_count, u.created_at,
             u.description,
             u.character1_data, u.character2_data, u.genres,
             users.username
      FROM uploads u
      JOIN users ON u.user_id = users.id
      WHERE u.user_id = ?
      ORDER BY u.created_at DESC
    `, [userId]);

    res.json({
      uploads: uploads.map(u => ({
        id: u.id,
        userId: u.user_id,
        username: u.username,
        title: u.title,
        description: u.description || '',
        imageUrl: u.image_url,
        likes: u.likes_count,
        character1: u.character1_data,
        character2: u.character2_data,
        genres: u.genres,
        createdAt: u.created_at
      }))
    });

  } catch (error) {
    console.error('User uploads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user uploads' });
  }
});

// --------------------- Edit Upload ---------------------
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [rows] = await pool.execute(
      'SELECT user_id FROM uploads WHERE id = ?',
      [uploadId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (rows[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to edit this upload' });
    }

    await pool.execute(
      'UPDATE uploads SET title = ?, description = ? WHERE id = ?',
      [title.trim(), description?.trim() || null, uploadId]
    );

    return res.json({
      message: 'Upload updated successfully',
      upload: {
        id: uploadId,
        title: title.trim(),
        description: description?.trim() || '',
      },
    });
  } catch (error) {
    console.error('Update upload error:', error);
    return res.status(500).json({ error: 'Failed to update upload' });
  }
});

// --------------------- Like Upload ---------------------
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const uploadId = req.params.id;
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT id FROM likes WHERE upload_id = ? AND user_id = ?`,
      [uploadId, userId]
    );

    if (rows.length > 0) {
      await pool.execute(`DELETE FROM likes WHERE upload_id = ? AND user_id = ?`, [uploadId, userId]);
      await pool.execute(`UPDATE uploads SET likes_count = likes_count - 1 WHERE id = ?`, [uploadId]);
      return res.json({ message: 'Unliked' });
    } else {
      await pool.execute(`INSERT INTO likes (upload_id, user_id) VALUES (?, ?)`, [uploadId, userId]);
      await pool.execute(`UPDATE uploads SET likes_count = likes_count + 1 WHERE id = ?`, [uploadId]);
      return res.json({ message: 'Liked' });
    }
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to like/unlike' });
  }
});

// --------------------- User Stats ---------------------
router.get('/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const [statsRows] = await pool.execute(`
      SELECT COUNT(*) AS totalUploads, COALESCE(SUM(likes_count), 0) AS totalLikes
      FROM uploads
      WHERE user_id = ?
    `, [userId]);

    const [genreRows] = await pool.execute(`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(genres, '$[0]')) AS genre, COUNT(*) as count
      FROM uploads
      WHERE user_id = ?
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 1
    `, [userId]);

    res.json({
      totalUploads: statsRows[0].totalUploads,
      totalLikes: statsRows[0].totalLikes,
      favoriteGenre: genreRows.length > 0 ? genreRows[0].genre : 'None'
    });
  } catch (error) {
    console.error('User stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// ...existing code...
{
  // --------------------- Delete Upload ---------------------
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const uploadId = req.params.id;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // fetch upload to get owner and image path
      const [rows] = await pool.execute(
        'SELECT user_id, image_url FROM uploads WHERE id = ?',
        [uploadId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      const upload = rows[0];
      if (upload.user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized to delete this upload' });
      }

      // delete likes records (if any)
      await pool.execute('DELETE FROM likes WHERE upload_id = ?', [uploadId]);

      // delete DB upload record
      await pool.execute('DELETE FROM uploads WHERE id = ?', [uploadId]);

      // delete file from disk (safe)
      try {
        // image_url stored like "/uploads/filename.ext"
        const filePath = upload.image_url.startsWith('/') ? upload.image_url.slice(1) : upload.image_url;
        const fullPath = path.join(process.cwd(), filePath);
        await fs.unlink(fullPath).catch(() => {});
      } catch (err) {
        // log and continue — DB entry removed
        console.warn('Failed to remove file from disk:', err.message || err);
      }

      return res.json({ message: 'Upload deleted' });
    } catch (error) {
      console.error('Delete upload error:', error);
      return res.status(500).json({ error: 'Failed to delete upload' });
    }
  });
// ...existing code...
}

export default router;
