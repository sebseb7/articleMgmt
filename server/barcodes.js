import db from './db.js';

export function normalizeBarcode(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function findArticleByBarcode(barcode) {
  return db.prepare(`
    SELECT id, item_name, barcode, price, tax_rate FROM articles
    WHERE barcode IS NOT NULL AND TRIM(barcode) = ?
  `).get(barcode);
}

function findVariationByBarcode(barcode) {
  return db.prepare(`
    SELECT v.id, v.article_id, v.variation_name, v.barcode, v.price, a.item_name, a.tax_rate
    FROM variations v
    JOIN articles a ON a.id = v.article_id
    WHERE v.barcode IS NOT NULL AND TRIM(v.barcode) = ?
  `).get(barcode);
}

export function lookupBarcode(barcode) {
  const value = normalizeBarcode(barcode);
  if (!value) {
    return { article: null, variation: null };
  }
  const article = findArticleByBarcode(value);
  if (article) {
    return { article, variation: null };
  }
  const variation = findVariationByBarcode(value);
  return { article: null, variation: variation ?? null };
}

export function lookupBarcodePrice(barcode) {
  const value = normalizeBarcode(barcode);
  if (!value) return null;

  const { article, variation } = lookupBarcode(value);
  if (article) {
    return {
      found: true,
      barcode: value,
      type: 'article',
      articleId: article.id,
      variationId: null,
      name: article.item_name,
      price: article.price,
      taxRate: article.tax_rate,
    };
  }
  if (variation) {
    return {
      found: true,
      barcode: value,
      type: 'variation',
      articleId: variation.article_id,
      variationId: variation.id,
      name: `${variation.item_name} — ${variation.variation_name}`,
      price: variation.price,
      taxRate: variation.tax_rate,
    };
  }
  return { found: false, barcode: value };
}

export function upsertBarcodePrice(barcode, { price, name, taxRate } = {}) {
  const value = normalizeBarcode(barcode);
  if (!value) throw new Error('Barcode is required.');
  if (price === undefined || price === null || Number.isNaN(Number(price))) {
    throw new Error('Price is required.');
  }
  const numericPrice = Number(price);

  const { article, variation } = lookupBarcode(value);
  if (article) {
    const itemName = name != null && String(name).trim() ? String(name).trim() : null;
    const tax = taxRate !== undefined && taxRate !== null && !Number.isNaN(Number(taxRate))
      ? Number(taxRate)
      : null;
    db.prepare(`
      UPDATE articles
      SET price = ?, item_name = COALESCE(?, item_name), tax_rate = COALESCE(?, tax_rate)
      WHERE id = ?
    `).run(numericPrice, itemName, tax, article.id);
    return lookupBarcodePrice(value);
  }
  if (variation) {
    db.prepare('UPDATE variations SET price = ? WHERE id = ?').run(numericPrice, variation.id);
    return lookupBarcodePrice(value);
  }

  const itemName = String(name || '').trim() || `Item ${value}`;
  const tax = taxRate !== undefined && taxRate !== null && !Number.isNaN(Number(taxRate))
    ? Number(taxRate)
    : null;
  const nextOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM articles').get().m + 1;
  const info = db.prepare(`
    INSERT INTO articles (item_name, tax_rate, price, barcode, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(itemName, tax, numericPrice, value, nextOrder);

  return {
    found: true,
    barcode: value,
    type: 'article',
    articleId: Number(info.lastInsertRowid),
    variationId: null,
    name: itemName,
    price: numericPrice,
    taxRate: tax,
    created: true,
  };
}

export function deleteBarcodePrice(barcode) {
  const value = normalizeBarcode(barcode);
  if (!value) throw new Error('Barcode is required.');

  const { article, variation } = lookupBarcode(value);
  if (article) {
    db.prepare('DELETE FROM articles WHERE id = ?').run(article.id);
    return { deleted: true, type: 'article', articleId: article.id, variationId: null, barcode: value };
  }
  if (variation) {
    db.prepare('DELETE FROM variations WHERE id = ?').run(variation.id);
    return {
      deleted: true,
      type: 'variation',
      articleId: variation.article_id,
      variationId: variation.id,
      barcode: value,
    };
  }
  return { deleted: false, barcode: value };
}

export function collectBarcodesFromArticleBody(body) {
  const barcodes = [];
  const articleBc = normalizeBarcode(body.barcode);
  if (articleBc) barcodes.push(articleBc);
  for (const v of body.variations || []) {
    const bc = normalizeBarcode(v.barcode);
    if (bc) barcodes.push(bc);
  }
  return barcodes;
}

export function collectBarcodesFromParsedArticles(articles) {
  const barcodes = [];
  for (const article of articles) {
    barcodes.push(...collectBarcodesFromArticleBody(article));
  }
  return barcodes;
}

export function assertNoDuplicateBarcodes(barcodes) {
  const seen = new Set();
  for (const bc of barcodes) {
    if (seen.has(bc)) {
      throw new Error(`Barcode "${bc}" is used more than once.`);
    }
    seen.add(bc);
  }
}

export function validateArticlePayloadBarcodes(body, articleId = null) {
  const barcodes = collectBarcodesFromArticleBody(body);
  assertNoDuplicateBarcodes(barcodes);

  for (const bc of barcodes) {
    const articleHit = findArticleByBarcode(bc);
    if (articleHit && (articleId == null || articleHit.id !== articleId)) {
      throw new Error(`Barcode "${bc}" is already used by "${articleHit.item_name}".`);
    }

    const varHit = findVariationByBarcode(bc);
    if (varHit && (articleId == null || varHit.article_id !== articleId)) {
      throw new Error(`Barcode "${bc}" is already used by a variation of "${varHit.item_name}".`);
    }
  }
}

export function validateAssignBarcode(barcode, articleId, variationId = null) {
  const value = normalizeBarcode(barcode);
  if (!value) return;

  const articleHit = findArticleByBarcode(value);
  if (articleHit && articleHit.id !== articleId) {
    throw new Error(`Barcode "${value}" is already used by "${articleHit.item_name}".`);
  }
  if (articleHit && articleHit.id === articleId && variationId != null) {
    throw new Error(`Barcode "${value}" is already used as the article barcode.`);
  }

  const varHit = findVariationByBarcode(value);
  if (!varHit) return;

  if (variationId != null && varHit.id === Number(variationId)) return;

  if (varHit.article_id === articleId) {
    throw new Error(`Barcode "${value}" is already used by a variation of this article.`);
  }

  throw new Error(`Barcode "${value}" is already used by a variation of "${varHit.item_name}".`);
}
