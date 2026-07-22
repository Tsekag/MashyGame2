// server/middleware/auth.js (ESM version)

import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

// JWT Authentication Middleware
// This middleware runs before protected routes to verify the user's token
export async function authenticateToken(req, res, next) {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token && req.headers.cookie) {
      // Parse simple cookie header to find auth_token (no dependency on cookie-parser)
      const cookieHeader = req.headers.cookie;
      const parts = cookieHeader.split(';').map(p => p.trim());
      const authCookie = parts.find(p => p.startsWith('auth_token='));
      if (authCookie) {
        token = decodeURIComponent(authCookie.split('=')[1]);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch current user data from database
    const [users] = await pool.execute(
      'SELECT id, username, email, role, selected_genres, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found' 
      });
    }

    // Attach user data to request object for use in route handlers
    // Ensure selected_genres (stored as JSON text) is parsed into an array
    let selectedGenres = [];
    try {
      if (users[0].selected_genres) {
        selectedGenres = JSON.parse(users[0].selected_genres);
      }
    } catch (e) {
      console.warn('Failed to parse selected_genres for user', users[0].id, e);
      selectedGenres = [];
    }

    req.user = {
      id: users[0].id,
      username: users[0].username,
      email: users[0].email,
      role: users[0].role,
      selectedGenres,
      createdAt: users[0].created_at
    };

    next(); // Continue to the protected route
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is malformed or invalid' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please log in again' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Internal server error during authentication' 
    });
  }
}

// Admin role middleware - must be used after authenticateToken
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in first' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'You do not have permission to access this resource' 
    });
  }

  next();
}
