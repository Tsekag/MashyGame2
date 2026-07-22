const express = require('express');
const router = express.Router();
const db = require('../db'); // Your MySQL connection file

// Get all active genres with emojis
router.get('/', (req, res) => {
  db.query('SELECT id, name, emoji FROM genres WHERE is_active = 1', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Update emoji (admin only)
router.put('/:id/emoji', (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  // Add admin auth check here (e.g., middleware)
  db.query('UPDATE genres SET emoji = ? WHERE id = ?', [emoji, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Emoji updated' });
  });
});

// Update genre (admin only)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, emoji, is_active } = req.body;
  db.query('UPDATE genres SET name = ?, emoji = ?, is_active = ? WHERE id = ?', [name, emoji, is_active, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Genre updated' });
  });
});

// Create a new genre
router.post('/', (req, res) => {
  const { name, emoji, is_active } = req.body;
  db.query('INSERT INTO genres (name, emoji, is_active) VALUES (?, ?, ?)', [name, emoji, is_active], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId });
  });
});

module.exports = router;