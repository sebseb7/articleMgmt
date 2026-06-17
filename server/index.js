import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db, { dbPath } from './db.js';
import { parseCsv, buildCsv } from './csv.js';
import {
  authenticate,
  signToken,
  verifyToken,
  getUserById,
  requireAuth,
  COOKIE_NAME,
  cookieOptions,
} from './auth.js';
import {
  listCategories,
  findOrCreateCategory,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
  clearCategories,
} from './categories.js';
import { allocateNextLocalBarcode } from './metadata.js';
import { startBackupScheduler } from './backup.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '25mb' }));

const PORT = process.env.PORT || 3991;

// ---------- Prepared statements ----------
const insertArticle = db.prepare(`
  INSERT INTO articles
    (item_uuid, item_name, tax_rate, category_id, image_url, visible_online,
     track_inventory, seo_title, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@item_uuid, @item_name, @tax_rate, @category_id, @image_url, @visible_online,
     @track_inventory, @seo_title, @price, @quantity, @low_threshold, @barcode,
     @variant_uuid, @sort_order)
`);

const insertVariation = db.prepare(`
  INSERT INTO variations
    (article_id, variation_name, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@article_id, @variation_name, @price, @quantity, @low_threshold, @barcode,
     @variant_uuid, @sort_order)
`);

const updateArticle = db.prepare(`
  UPDATE articles SET
    item_uuid=@item_uuid, item_name=@item_name, tax_rate=@tax_rate,
    category_id=@category_id, image_url=@image_url, visible_online=@visible_online,
    track_inventory=@track_inventory, seo_title=@seo_title, price=@price,
    quantity=@quantity, low_threshold=@low_threshold, barcode=@barcode,
    variant_uuid=@variant_uuid
  WHERE id=@id
`);

const deleteVariationsFor = db.prepare('DELETE FROM variations WHERE article_id = ?');
const deleteArticleStmt = db.prepare('DELETE FROM articles WHERE id = ?');
const maxOrderStmt = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM articles');

// ---------- Helpers ----------
function articlePayload(body, sortOrder) {
  const categoryId = body.category_id;
  return {
    item_uuid: body.item_uuid ?? null,
    item_name: body.item_name ?? '',
    tax_rate: body.tax_rate ?? null,
    category_id: categoryId === '' || categoryId === undefined || categoryId === null
      ? null
      : Number(categoryId),
    image_url: body.image_url ?? null,
    visible_online: body.visible_online ? 1 : 0,
    track_inventory: body.track_inventory ? 1 : 0,
    seo_title: body.seo_title ?? null,
    price: body.price ?? null,
    quantity: body.quantity ?? null,
    low_threshold: body.low_threshold ?? null,
    barcode: body.barcode ?? null,
    variant_uuid: body.variant_uuid ?? null,
    sort_order: sortOrder,
  };
}

function variationPayload(v, articleId, order) {
  return {
    article_id: articleId,
    variation_name: v.variation_name ?? '',
    price: v.price ?? null,
    quantity: v.quantity ?? null,
    low_threshold: v.low_threshold ?? null,
    barcode: v.barcode ?? null,
    variant_uuid: v.variant_uuid ?? null,
    sort_order: order,
  };
}

function attachVariations(articles) {
  const varStmt = db.prepare(
    'SELECT * FROM variations WHERE article_id = ? ORDER BY sort_order, id'
  );
  for (const a of articles) {
    a.visible_online = !!a.visible_online;
    a.track_inventory = !!a.track_inventory;
    a.variations = varStmt.all(a.id);
  }
  return articles;
}

function getAllArticles() {
  const articles = db
    .prepare(`
      SELECT a.*, c.name AS category
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ORDER BY a.sort_order, a.id
    `)
    .all();
  return attachVariations(articles);
}

function buildArticleFilter(q) {
  const compact = (q || '').replace(/\s/g, '');
  if (compact.length < 3) {
    return { clause: '', params: [] };
  }
  const term = q.trim();
  const like = `%${term.toLowerCase()}%`;
  const barcodeLike = `%${term}%`;
  return {
    clause: `
      (
        LOWER(a.item_name) LIKE ?
        OR LOWER(IFNULL(c.name, '')) LIKE ?
        OR IFNULL(a.barcode, '') LIKE ?
        OR EXISTS (
          SELECT 1 FROM variations v
          WHERE v.article_id = a.id
            AND (
              LOWER(v.variation_name) LIKE ?
              OR IFNULL(v.barcode, '') LIKE ?
            )
        )
      )
    `,
    params: [like, like, barcodeLike, like, barcodeLike],
  };
}

const missingBarcodeClause = `
  EXISTS (SELECT 1 FROM variations v WHERE v.article_id = a.id)
  AND IFNULL(TRIM(a.barcode), '') = ''
  AND EXISTS (
    SELECT 1 FROM variations v2
    WHERE v2.article_id = a.id
      AND IFNULL(TRIM(v2.barcode), '') = ''
  )
`;

function parseCategoryIds(categoryIds) {
  if (categoryIds == null || categoryIds === '') return [];
  return String(categoryIds)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildArticleWhere({ q = '', missingBarcode = false, categoryIds } = {}) {
  const parts = [];
  const params = [];

  const search = buildArticleFilter(q);
  if (search.clause) {
    parts.push(search.clause);
    params.push(...search.params);
  }

  if (missingBarcode) {
    parts.push(missingBarcodeClause);
  }

  const ids = parseCategoryIds(categoryIds);
  if (ids.length) {
    const numericIds = [];
    let hasNone = false;
    for (const id of ids) {
      if (id === 'none') {
        hasNone = true;
      } else {
        numericIds.push(Number(id));
      }
    }
    const categoryParts = [];
    if (numericIds.length) {
      categoryParts.push(`a.category_id IN (${numericIds.map(() => '?').join(', ')})`);
      params.push(...numericIds);
    }
    if (hasNone) {
      categoryParts.push('a.category_id IS NULL');
    }
    if (categoryParts.length) {
      parts.push(`(${categoryParts.join(' OR ')})`);
    }
  }

  const clause = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
  return { clause, params };
}

function getCategoryCounts({ q = '', missingBarcode = false } = {}) {
  const { clause, params } = buildArticleWhere({ q, missingBarcode });
  const rows = db
    .prepare(`
      SELECT a.category_id AS id, c.name AS name, COUNT(*) AS count
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ${clause}
      GROUP BY a.category_id
      ORDER BY CASE WHEN c.name IS NULL THEN 1 ELSE 0 END, c.name COLLATE NOCASE
    `)
    .all(...params);

  return rows.map((row) => ({
    id: row.id,
    name: row.name || 'Uncategorized',
    count: row.count,
  }));
}

function getStats() {
  const articles = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
  const explicitVars = db.prepare('SELECT COUNT(*) AS c FROM variations').get().c;
  const standalone = db.prepare(`
    SELECT COUNT(*) AS c FROM articles a
    WHERE NOT EXISTS (SELECT 1 FROM variations v WHERE v.article_id = a.id)
  `).get().c;
  return { articles, variations: explicitVars + standalone };
}

function getArticlesPage({ page = 1, pageSize = 25, q = '', missingBarcode = false, categoryIds } = {}) {
  const { clause, params } = buildArticleWhere({ q, missingBarcode, categoryIds });
  const limit = Math.min(Math.max(1, Number(pageSize) || 25), 100);
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * limit;

  const total = db
    .prepare(`
      SELECT COUNT(*) AS c FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ${clause}
    `)
    .get(...params).c;

  const articles = db
    .prepare(`
      SELECT a.*, c.name AS category
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ${clause}
      ORDER BY a.sort_order, a.id
      LIMIT ? OFFSET ?
    `)
    .all(...params, limit, offset);

  attachVariations(articles);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = total === 0 ? 1 : Math.min(currentPage, pageCount);

  return {
    items: articles,
    total,
    page: safePage,
    pageSize: limit,
    pageCount,
    stats: getStats(),
    categoryCounts: getCategoryCounts({ q, missingBarcode }),
  };
}

// ---------- Routes ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.json({ user: null });
  const payload = verifyToken(token);
  if (!payload) return res.json({ user: null });
  const user = getUserById(payload.sub);
  res.json({ user: user || null });
});

app.get('/api/articles', requireAuth, (req, res) => {
  const result = getArticlesPage({
    page: req.query.page,
    pageSize: req.query.pageSize,
    q: req.query.q,
    missingBarcode: req.query.missingBarcode === '1',
    categoryIds: req.query.categoryIds,
  });
  res.json(result);
});

app.get('/api/stats', requireAuth, (req, res) => {
  res.json(getStats());
});

app.post('/api/barcode/generate', requireAuth, (req, res) => {
  try {
    const barcode = allocateNextLocalBarcode();
    res.json({ barcode });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/categories', requireAuth, (req, res) => {
  res.json(listCategories());
});

app.post('/api/categories', requireAuth, (req, res) => {
  try {
    const category = createCategory(req.body?.name);
    res.status(201).json(category);
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
  try {
    const category = updateCategoryById(Number(req.params.id), req.body?.name);
    res.json(category);
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  try {
    deleteCategoryById(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.post('/api/articles', requireAuth, (req, res) => {
  const nextOrder = maxOrderStmt.get().m + 1;
  const tx = db.transaction(() => {
    const info = insertArticle.run(articlePayload(req.body, nextOrder));
    const articleId = info.lastInsertRowid;
    (req.body.variations || []).forEach((v, i) =>
      insertVariation.run(variationPayload(v, articleId, i))
    );
    return articleId;
  });
  try {
    const id = tx();
    res.status(201).json({ id });
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.put('/api/articles/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const tx = db.transaction(() => {
    updateArticle.run({ ...articlePayload(req.body, 0), id });
    deleteVariationsFor.run(id);
    (req.body.variations || []).forEach((v, i) =>
      insertVariation.run(variationPayload(v, id, i))
    );
  });
  try {
    tx();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

app.put('/api/articles/:id/barcode', requireAuth, (req, res) => {
  const articleId = Number(req.params.id);
  const { barcode, variationId } = req.body || {};
  const trimmed = String(barcode ?? '').trim();
  if (!trimmed) {
    return res.status(400).json({ error: 'Barcode is required.' });
  }

  const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(articleId);
  if (!article) {
    return res.status(404).json({ error: 'Article not found.' });
  }

  if (variationId != null && variationId !== '') {
    const info = db.prepare(
      'UPDATE variations SET barcode = ? WHERE id = ? AND article_id = ?',
    ).run(trimmed, Number(variationId), articleId);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Variation not found.' });
    }
  } else {
    db.prepare('UPDATE articles SET barcode = ? WHERE id = ?').run(trimmed, articleId);
  }

  res.json({ ok: true, barcode: trimmed });
});

app.delete('/api/articles/:id', requireAuth, (req, res) => {
  deleteArticleStmt.run(Number(req.params.id));
  res.json({ ok: true });
});

// Import CSV (replaces all existing data). Accepts raw CSV text or { csv }.
app.post('/api/import', requireAuth, (req, res) => {
  const text = typeof req.body === 'string' ? req.body : req.body?.csv;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No CSV content provided.' });
  }
  let articles;
  try {
    articles = parseCsv(text);
  } catch (e) {
    return res.status(400).json({ error: `Failed to parse CSV: ${e.message}` });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM variations').run();
    db.prepare('DELETE FROM articles').run();
    clearCategories();
    db.prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('articles','variations','categories')"
    ).run();

    let variationCount = 0;
    articles.forEach((a, idx) => {
      const { variations, category, ...rest } = a;
      const category_id = findOrCreateCategory(category);
      const info = insertArticle.run({ ...rest, category_id, sort_order: idx });
      const articleId = info.lastInsertRowid;
      variations.forEach((v, i) => {
        insertVariation.run(variationPayload(v, articleId, i));
      });
      variationCount += variations.length > 0 ? variations.length : 1;
    });
    return variationCount;
  });

  try {
    const variationCount = tx();
    res.json({ articles: articles.length, variations: variationCount });
  } catch (e) {
    res.status(400).json({ error: String(e.message) });
  }
});

// Export everything back to the original CSV format.
app.get('/api/export', requireAuth, (req, res) => {
  const csv = buildCsv(getAllArticles());
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="items-export-${stamp}.csv"`
  );
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  startBackupScheduler(db, dbPath);
});
