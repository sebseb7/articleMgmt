import db from './db.js';

export const insertArticle = db.prepare(`
  INSERT INTO articles
    (item_uuid, item_name, tax_rate, category_id, image_url, image_thumb_avif, visible_online,
     track_inventory, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@item_uuid, @item_name, @tax_rate, @category_id, @image_url, @image_thumb_avif, @visible_online,
     @track_inventory, @price, @quantity, @low_threshold, @barcode,
     @variant_uuid, @sort_order)
`);

export const insertVariation = db.prepare(`
  INSERT INTO variations
    (article_id, variation_name, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@article_id, @variation_name, @price, @quantity, @low_threshold, @barcode,
     @variant_uuid, @sort_order)
`);

export const updateArticle = db.prepare(`
  UPDATE articles SET
    item_uuid=@item_uuid, item_name=@item_name, tax_rate=@tax_rate,
    category_id=@category_id, image_url=@image_url, visible_online=@visible_online,
    track_inventory=@track_inventory, price=@price,
    quantity=@quantity, low_threshold=@low_threshold, barcode=@barcode,
    variant_uuid=@variant_uuid
  WHERE id=@id
`);

export const deleteVariationsFor = db.prepare('DELETE FROM variations WHERE article_id = ?');
export const deleteArticleStmt = db.prepare('DELETE FROM articles WHERE id = ?');
export const maxOrderStmt = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM articles');

export function articlePayload(body, sortOrder) {
  const categoryId = body.category_id;
  return {
    item_uuid: body.item_uuid ?? null,
    item_name: body.item_name ?? '',
    tax_rate: body.tax_rate ?? null,
    category_id: categoryId === '' || categoryId === undefined || categoryId === null
      ? null
      : Number(categoryId),
    image_url: body.image_url ?? null,
    image_thumb_avif: body.image_thumb_avif ?? null,
    visible_online: body.visible_online ? 1 : 0,
    track_inventory: body.track_inventory ? 1 : 0,
    price: body.price ?? null,
    quantity: body.quantity ?? null,
    low_threshold: body.low_threshold ?? null,
    barcode: body.barcode ?? null,
    variant_uuid: body.variant_uuid ?? null,
    sort_order: sortOrder,
  };
}

export function variationPayload(v, articleId, order) {
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

export function normalizedBarcode(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function formatBarcodeChangeSummary({ target, name, articleName, previous, next }) {
  const label = target === 'variation'
    ? `variation "${name}" of "${articleName}"`
    : `article "${name}"`;

  if (!next) {
    return previous
      ? `Cleared barcode on ${label} (was ${previous})`
      : `Cleared barcode on ${label}`;
  }

  if (previous) {
    return `Set barcode on ${label} to ${next} (was ${previous})`;
  }

  return `Set barcode on ${label} to ${next}`;
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

export function getAllArticles() {
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
  (
    NOT EXISTS (SELECT 1 FROM variations v WHERE v.article_id = a.id)
    AND IFNULL(TRIM(a.barcode), '') = ''
  )
  OR (
    EXISTS (SELECT 1 FROM variations v WHERE v.article_id = a.id)
    AND IFNULL(TRIM(a.barcode), '') = ''
    AND EXISTS (
      SELECT 1 FROM variations v2
      WHERE v2.article_id = a.id
        AND IFNULL(TRIM(v2.barcode), '') = ''
    )
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
    parts.push(`(${missingBarcodeClause})`);
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

export function getStats() {
  const articles = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
  const explicitVars = db.prepare('SELECT COUNT(*) AS c FROM variations').get().c;
  const standalone = db.prepare(`
    SELECT COUNT(*) AS c FROM articles a
    WHERE NOT EXISTS (SELECT 1 FROM variations v WHERE v.article_id = a.id)
  `).get().c;
  return { articles, variations: explicitVars + standalone };
}

export function getArticlesPage({ page = 1, pageSize = 25, q = '', missingBarcode = false, categoryIds, includeMeta = true } = {}) {
  const { clause, params } = buildArticleWhere({ q, missingBarcode, categoryIds });
  const isAll = Number(pageSize) === 0;
  const limit = isAll ? null : Math.min(Math.max(1, Number(pageSize) || 25), 100);
  const currentPage = isAll ? 1 : Math.max(1, Number(page) || 1);
  const offset = isAll ? 0 : (currentPage - 1) * limit;

  const total = db
    .prepare(`
      SELECT COUNT(*) AS c FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ${clause}
    `)
    .get(...params).c;

  const articles = isAll
    ? db.prepare(`
      SELECT a.*, c.name AS category
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ${clause}
      ORDER BY a.sort_order, a.id
    `).all(...params)
    : db.prepare(`
      SELECT a.*, c.name AS category
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      ${clause}
      ORDER BY a.sort_order, a.id
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

  attachVariations(articles);

  const effectivePageSize = isAll ? 0 : limit;
  const pageCount = isAll ? 1 : Math.max(1, Math.ceil(total / limit));
  const safePage = total === 0 ? 1 : Math.min(currentPage, pageCount);

  return {
    items: articles,
    total,
    page: safePage,
    pageSize: effectivePageSize,
    pageCount,
    ...(includeMeta ? {
      stats: getStats(),
      categoryCounts: getCategoryCounts({ q, missingBarcode }),
    } : {}),
  };
}
