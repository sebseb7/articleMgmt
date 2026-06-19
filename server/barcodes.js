import db from './db.js';

export function normalizeBarcode(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function findArticleByBarcode(barcode) {
  return db.prepare(`
    SELECT id, item_name, barcode FROM articles
    WHERE barcode IS NOT NULL AND TRIM(barcode) = ?
  `).get(barcode);
}

function findVariationByBarcode(barcode) {
  return db.prepare(`
    SELECT v.id, v.article_id, v.variation_name, v.barcode, a.item_name
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
