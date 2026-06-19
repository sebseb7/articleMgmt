import { createHash, randomBytes } from 'node:crypto';
import db from './db.js';

const TOKEN_PREFIX = 'amt_';
const VALID_SCOPES = new Set(['read', 'write', 'admin', 'printer']);

function hashToken(plaintext) {
  return createHash('sha256').update(plaintext).digest('hex');
}

function parseScopes(raw) {
  try {
    const scopes = JSON.parse(raw);
    return Array.isArray(scopes) ? scopes.filter((s) => VALID_SCOPES.has(s)) : [];
  } catch {
    return [];
  }
}

export function normalizeScopes(scopes) {
  if (!Array.isArray(scopes)) return [];
  const unique = [...new Set(scopes.map((s) => String(s).trim().toLowerCase()))];
  return unique.filter((s) => VALID_SCOPES.has(s));
}

export function listTokensForUser(userId) {
  return db
    .prepare(`
      SELECT id, name, token_prefix, scopes, created_at, last_used_at
      FROM tokens
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .all(userId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      tokenPrefix: row.token_prefix,
      scopes: parseScopes(row.scopes),
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    }));
}

export function createToken(userId, name, scopes) {
  const label = String(name || '').trim();
  if (!label) throw new Error('Token name is required.');
  const normalized = normalizeScopes(scopes);
  if (normalized.length === 0) {
    throw new Error('At least one scope (read, write, admin, printer) is required.');
  }

  const plaintext = `${TOKEN_PREFIX}${randomBytes(24).toString('base64url')}`;
  const displayPrefix = `${plaintext.slice(0, 12)}…`;
  const info = db
    .prepare(`
      INSERT INTO tokens (user_id, name, token_hash, token_prefix, scopes)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(userId, label, hashToken(plaintext), displayPrefix, JSON.stringify(normalized));

  return {
    id: Number(info.lastInsertRowid),
    name: label,
    token: plaintext,
    tokenPrefix: displayPrefix,
    scopes: normalized,
  };
}

export function deleteToken(userId, tokenId) {
  const result = db
    .prepare('DELETE FROM tokens WHERE id = ? AND user_id = ?')
    .run(tokenId, userId);
  if (result.changes === 0) throw new Error('Token not found.');
}

export function verifyApiToken(plaintext) {
  const value = String(plaintext || '').trim();
  if (!value.startsWith(TOKEN_PREFIX)) return null;

  const row = db
    .prepare('SELECT id, user_id, name, scopes FROM tokens WHERE token_hash = ?')
    .get(hashToken(value));
  if (!row) return null;

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(row.user_id);
  if (!user) return null;

  db.prepare("UPDATE tokens SET last_used_at = datetime('now') WHERE id = ?").run(row.id);

  return {
    type: 'api_token',
    tokenId: row.id,
    tokenName: row.name,
    user,
    scopes: parseScopes(row.scopes),
  };
}
