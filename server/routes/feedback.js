// server/routes/feedback.js (ESM version)

import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/feedback/like - Toggle like on an upload (Protected Route)
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.body;
    const userId = req.user.id;

    if (!uploadId) {
      return res.status(400).json({
        error: 'Missing upload ID',
        message: 'Upload ID is required'
      });
    }

    // Check if upload exists
    const [uploads] = await pool.execute(
      'SELECT id FROM uploads WHERE id = ?',
      [uploadId]
    );

    if (uploads.length === 0) {
      return res.status(404).json({
        error: 'Upload not found',
        message: 'The specified upload does not exist'
      });
    }

    // Check if user already liked this upload
    const [existingLikes] = await pool.execute(
      'SELECT id FROM likes WHERE user_id = ? AND upload_id = ?',
      [userId, uploadId]
    );

    let isLiked;
    let newLikeCount;

    if (existingLikes.length > 0) {
      // Unlike: Remove like and decrement counter
      await pool.execute('DELETE FROM likes WHERE user_id = ? AND upload_id = ?', [userId, uploadId]);
      await pool.execute('UPDATE uploads SET likes_count = likes_count - 1 WHERE id = ?', [uploadId]);
      isLiked = false;
    } else {
      // Like: Add like and increment counter
      await pool.execute('INSERT INTO likes (user_id, upload_id) VALUES (?, ?)', [userId, uploadId]);
      await pool.execute('UPDATE uploads SET likes_count = likes_count + 1 WHERE id = ?', [uploadId]);
      isLiked = true;
    }

    // Get updated like count
    const [updatedUpload] = await pool.execute(
      'SELECT likes_count FROM uploads WHERE id = ?',
      [uploadId]
    );
    newLikeCount = updatedUpload[0].likes_count;

    res.json({
      message: isLiked ? 'Upload liked' : 'Upload unliked',
      isLiked,
      likes: newLikeCount
    });

  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({
      error: 'Failed to toggle like',
      message: 'Internal server error'
    });
  }
});

// POST /api/feedback/comment - Add comment to an upload (Protected Route)
router.post('/comment', authenticateToken, async (req, res) => {
  try {
    const { uploadId, commentText } = req.body;
    const userId = req.user.id;

    if (!uploadId || !commentText) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Upload ID and comment text are required'
      });
    }

    if (commentText.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty comment',
        message: 'Comment cannot be empty'
      });
    }

    // Check if upload exists
    const [uploads] = await pool.execute(
      'SELECT id FROM uploads WHERE id = ?',
      [uploadId]
    );

    if (uploads.length === 0) {
      return res.status(404).json({
        error: 'Upload not found',
        message: 'The specified upload does not exist'
      });
    }

    // Insert comment
    const [result] = await pool.execute(
      'INSERT INTO comments (user_id, upload_id, comment_text) VALUES (?, ?, ?)',
      [userId, uploadId, commentText.trim()]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        id: result.insertId,
        userId,
        username: req.user.username,
        text: commentText.trim(),
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: 'Internal server error'
    });
  }
});

// GET /api/feedback/comments/:uploadId - Get comments for an upload (Protected Route)
router.get('/comments/:uploadId', authenticateToken, async (req, res) => {
  try {
    const { uploadId } = req.params;

    const [comments] = await pool.execute(`
      SELECT 
        c.id, c.comment_text, c.created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.upload_id = ?
      ORDER BY c.created_at ASC
    `, [uploadId]);

    res.json({
      comments: comments.map(comment => ({
        id: comment.id,
        username: comment.username,
        text: comment.comment_text,
        createdAt: comment.created_at
      }))
    });

  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      message: 'Internal server error'
    });
  }
});

export default router;
