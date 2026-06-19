import db from '../../db.js';
import { requireAuth } from '../../auth.js';
import { validateAssignBarcode } from '../../barcodes.js';
import { logChange } from '../../changelog.js';
import { normalizedBarcode, formatBarcodeChangeSummary } from '../../articles.js';

export default function register(app) {
  app.put('/api/articles/:id/barcode', requireAuth, (req, res) => {
    const articleId = Number(req.params.id);
    const { barcode, variationId } = req.body || {};
    const value = normalizedBarcode(barcode);

    const articleRow = db.prepare('SELECT id, item_name, barcode FROM articles WHERE id = ?').get(articleId);
    if (!articleRow) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    try {
      validateAssignBarcode(value, articleId, variationId ?? null);
    } catch (e) {
      return res.status(400).json({ error: String(e.message) });
    }

    if (variationId != null && variationId !== '') {
      const variationRow = db.prepare(
        'SELECT variation_name, barcode FROM variations WHERE id = ? AND article_id = ?',
      ).get(Number(variationId), articleId);
      if (!variationRow) {
        return res.status(404).json({ error: 'Variation not found.' });
      }
      const previous = normalizedBarcode(variationRow.barcode);

      const info = db.prepare(
        'UPDATE variations SET barcode = ? WHERE id = ? AND article_id = ?',
      ).run(value, Number(variationId), articleId);
      if (info.changes === 0) {
        return res.status(404).json({ error: 'Variation not found.' });
      }

      logChange(req.user, 'variation_update', {
        entityType: 'variation',
        entityId: Number(variationId),
        summary: formatBarcodeChangeSummary({
          target: 'variation',
          name: variationRow.variation_name || variationId,
          articleName: articleRow.item_name || articleId,
          previous,
          next: value,
        }),
        details: { articleId, previousBarcode: previous, barcode: value },
      });
    } else {
      const previous = normalizedBarcode(articleRow.barcode);

      db.prepare('UPDATE articles SET barcode = ? WHERE id = ?').run(value, articleId);

      logChange(req.user, 'article_update', {
        entityType: 'article',
        entityId: articleId,
        summary: formatBarcodeChangeSummary({
          target: 'article',
          name: articleRow.item_name || articleId,
          previous,
          next: value,
        }),
        details: { previousBarcode: previous, barcode: value },
      });
    }

    res.json({ ok: true, barcode: value });
  });
}
