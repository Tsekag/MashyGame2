// server/routes/auth.js (ESM version)

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateCsrfToken, csrfCookieOptions } from '../middleware/csrf.js';
import { sanitizeInput, validateEmail, validateUsername } from '../utils/validation.js';

const router = express.Router();

// Lightweight in-memory rate limit for auth endpoints.
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 10;
const authAttempts = new Map();

function getAuthRateKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : (typeof forwarded === 'string' ? forwarded.split(',')[0] : '');
  const ip = (firstForwarded || req.ip || 'unknown').trim();
  return `auth:${ip}`;
}

function authRateLimit(req, res, next) {
  const key = getAuthRateKey(req);
  const now = Date.now();
  const current = authAttempts.get(key);

  if (!current || now > current.resetAt) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return next();
  }

  if (current.count >= AUTH_MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.set('Retry-After', String(Math.max(retryAfter, 1)));
    return res.status(429).json({
      error: 'Too many attempts',
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  current.count += 1;
  authAttempts.set(key, current);
  next();
}

// Helper: generate JWT token
function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set in environment');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

function cookieOptions() {
  const jwtExpires = process.env.JWT_EXPIRES_IN || '1h';
  let maxAge = 1000 * 60 * 60; // default 1 hour
  if (typeof jwtExpires === 'string' && jwtExpires.endsWith('h')) {
    const hours = parseInt(jwtExpires.replace('h', ''), 10) || 1;
    maxAge = hours * 60 * 60 * 1000;
  }
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
  };
}

// POST /api/auth/signup
router.post('/signup', authRateLimit, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Input validation
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate inputs
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3-20 characters' });
    }
    
    if (!validateUsername(sanitizedUsername)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, spaces, underscores, dots, dashes, or apostrophes' });
    }
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    if (password.length > 128) return res.status(400).json({ error: 'Password too long' });

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [sanitizedEmail, sanitizedUsername]
    );
    if (existingUsers.length > 0) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [sanitizedUsername, sanitizedEmail, passwordHash]
    );

    const token = generateToken({ userId: result.insertId, username: sanitizedUsername, email: sanitizedEmail });

    // Set httpOnly cookie for authentication
    res.cookie('auth_token', token, cookieOptions());
    res.cookie('csrf_token', generateCsrfToken(), csrfCookieOptions());

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, username: sanitizedUsername, email: sanitizedEmail, selectedGenres: [], uploads: [] }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed', message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    
    // Sanitize email
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password length
    if (password.length < 1 || password.length > 128) {
      return res.status(400).json({ error: 'Invalid password length' });
    }

    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, role, selected_genres FROM users WHERE email = ?',
      [sanitizedEmail]
    );
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const [uploads] = await pool.execute(
      'SELECT id, title, image_url, likes_count, created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    const token = generateToken({ userId: user.id, username: user.username, email: user.email, role: user.role });

    // Set httpOnly cookie for authentication
    res.cookie('auth_token', token, cookieOptions());
    res.cookie('csrf_token', generateCsrfToken(), csrfCookieOptions());

    // Parse stored selected_genres JSON into an array for consistent client usage
    let selectedGenres = [];
    try {
      if (user.selected_genres) selectedGenres = JSON.parse(user.selected_genres);
    } catch (e) {
      console.warn('Failed to parse selected_genres for login response', e);
      selectedGenres = [];
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        selectedGenres,
        uploads: uploads.map(u => ({
          id: u.id,
          title: u.title,
          imageUrl: u.image_url,
          likes: u.likes_count,
          createdAt: u.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: 'Internal server error' });
  }
});

// GET /api/auth/profile (Protected)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [uploads] = await pool.execute(
      'SELECT id, title, image_url, likes_count, created_at, character1_data, character2_data, genres FROM uploads WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({
      user: { ...req.user, uploads: uploads.map(u => ({
        id: u.id,
        title: u.title,
        imageUrl: u.image_url,
        likes: u.likes_count,
        createdAt: u.created_at,
        character1: u.character1_data,
        character2: u.character2_data,
        genres: u.genres
      })) }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', message: 'Internal server error' });
  }
});

// PUT /api/auth/genres (Protected)
router.put('/genres', authenticateToken, async (req, res) => {
  try {
    const { genres } = req.body;
    if (!Array.isArray(genres)) return res.status(400).json({ error: 'Genres must be an array' });

    await pool.execute('UPDATE users SET selected_genres = ? WHERE id = ?', [JSON.stringify(genres), req.user.id]);
    res.json({ message: 'Genres updated successfully', genres });
  } catch (error) {
    console.error('Genre update error:', error);
    res.status(500).json({ error: 'Failed to update genres', message: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('auth_token');
    res.clearCookie('csrf_token');
    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/csrf-token
router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken();
  res.cookie('csrf_token', token, csrfCookieOptions());
  res.json({ csrfToken: token });
});

export default router;
