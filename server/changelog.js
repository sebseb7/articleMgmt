import db from './db.js';

const insertChange = db.prepare(`
  INSERT INTO changelog (user_id, username, action, entity_type, entity_id, summary, details)
  VALUES (@user_id, @username, @action, @entity_type, @entity_id, @summary, @details)
`);

export function logChange(user, action, { entityType = null, entityId = null, summary, details = null } = {}) {
  if (!user?.id || !user?.username) return;
  const text = String(summary || '').trim();
  if (!text) return;
  insertChange.run({
    user_id: user.id,
    username: user.username,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary: text,
    details: details == null ? null : JSON.stringify(details),
  });
}

export function getChangelogPage({ page = 1, pageSize = 25 } = {}) {
  const limit = Math.min(Math.max(1, Number(pageSize) || 25), 100);
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) AS c FROM changelog').get().c;
  const items = db.prepare(`
    SELECT id, user_id, username, action, entity_type, entity_id, summary, details, created_at
    FROM changelog
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = total === 0 ? 1 : Math.min(currentPage, pageCount);

  return {
    items: items.map((row) => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null,
    })),
    total,
    page: safePage,
    pageSize: limit,
    pageCount,
  };
}
