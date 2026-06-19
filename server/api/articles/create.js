import db from '../../db.js';
import { requireAuth } from '../../auth.js';
import { validateArticlePayloadBarcodes } from '../../barcodes.js';
import { logChange } from '../../changelog.js';
import {
  insertArticle,
  insertVariation,
  articlePayload,
  variationPayload,
  maxOrderStmt,
} from '../../articles.js';

export default function register(app) {
  app.post('/api/articles', requireAuth, (req, res) => {
    try {
      validateArticlePayloadBarcodes(req.body);
    } catch (e) {
      return res.status(400).json({ error: String(e.message) });
    }
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
      const name = String(req.body.item_name || '').trim() || `#${id}`;
      const variationCount = (req.body.variations || []).length;
      logChange(req.user, 'article_create', {
        entityType: 'article',
        entityId: Number(id),
        summary: variationCount
          ? `Created article "${name}" with ${variationCount} variation(s)`
          : `Created article "${name}"`,
        details: { variationCount },
      });
      res.status(201).json({ id });
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
