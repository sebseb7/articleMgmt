import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { verifyApiToken } from './tokens.js';

const JWT_SECRET = process.env.AUTH_SECRET || 'dev-only-change-me-in-production';
const COOKIE_NAME = 'auth_token';
const TOKEN_TTL = '7d';
const SESSION_SCOPES = ['read', 'write', 'admin'];

export { COOKIE_NAME };

export function createUser(username, password) {
  const name = String(username || '').trim();
  if (!name) throw new Error('Username is required.');
  if (!password) throw new Error('Password is required.');
  const hash = bcrypt.hashSync(password, 12);
  try {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(name, hash);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      throw new Error(`User already exists: ${name}`);
    }
    throw e;
  }
}

export function deleteUser(username) {
  const name = String(username || '').trim();
  const result = db.prepare('DELETE FROM users WHERE username = ? COLLATE NOCASE').run(name);
  if (result.changes === 0) throw new Error(`User not found: ${name}`);
}

export function listUsers() {
  return db
    .prepare('SELECT id, username, created_at FROM users ORDER BY username')
    .all();
}

export function authenticate(username, password) {
  const name = String(username || '').trim();
  const user = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE')
    .get(name);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;
  return { id: user.id, username: user.username };
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getUserById(id) {
  return db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function resolveSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = getUserById(payload.sub);
  if (!user) return null;
  return { type: 'session', user, scopes: SESSION_SCOPES };
}

function resolveBearer(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return verifyApiToken(header.slice(7).trim());
}

export function resolveAuth(req) {
  const session = resolveSession(req);
  if (session) return session;

  const apiAuth = resolveBearer(req);
  if (apiAuth) return apiAuth;

  const queryToken = req.query?.access_token;
  if (queryToken) return verifyApiToken(String(queryToken));

  return null;
}

export function attachAuth(req, res, next) {
  const auth = resolveAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.user = auth.user;
  req.auth = auth;
  next();
}

export function requireAuth(req, res, next) {
  const auth = resolveAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.user = auth.user;
  req.auth = auth;
  next();
}

export function canUsePrinterClient(auth) {
  if (!auth) return false;
  if (auth.type === 'session') return true;
  return auth.scopes.includes('write');
}

export function requirePrinterClient(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!canUsePrinterClient(req.auth)) {
    return res.status(403).json({ error: 'Missing required scope: write (or session login).' });
  }
  next();
}

export function requireSession(req, res, next) {
  if (req.auth?.type !== 'session') {
    return res.status(403).json({ error: 'Session authentication required.' });
  }
  next();
}

export function requireScope(...required) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const missing = required.filter((scope) => !req.auth.scopes.includes(scope));
    if (missing.length > 0) {
      return res.status(403).json({ error: `Missing required scope: ${missing.join(', ')}.` });
    }
    next();
  };
}
