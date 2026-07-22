import crypto from 'crypto';

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const value = decodeURIComponent(part.slice(idx + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
}

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24h
  };
}

function isSafeMethod(method = 'GET') {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function usesCookieAuth(req) {
  const authHeader = req.headers['authorization'];
  const cookies = parseCookies(req.headers.cookie || '');
  return !!cookies.auth_token && !authHeader;
}

export function csrfProtection(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || '');
  const csrfCookie = cookies.csrf_token;

  // Keep a CSRF cookie available for browser sessions.
  if (!csrfCookie) {
    res.cookie('csrf_token', generateCsrfToken(), csrfCookieOptions());
  }

  // Enforce CSRF checks only for cookie-authenticated unsafe requests.
  if (!isSafeMethod(req.method) && usesCookieAuth(req)) {
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfCookie || !csrfHeader || csrfHeader !== csrfCookie) {
      return res.status(403).json({
        error: 'CSRF validation failed',
        message: 'Invalid or missing CSRF token',
      });
    }
  }

  return next();
}

