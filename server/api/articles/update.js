import db from '../../db.js';
import { requireAuth } from '../../auth.js';
import { validateArticlePayloadBarcodes } from '../../barcodes.js';
import { logChange } from '../../changelog.js';
import {
  updateArticle,
  insertVariation,
  deleteVariationsFor,
  articlePayload,
  variationPayload,
} from '../../articles.js';

export default function register(app) {
  app.put('/api/articles/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    try {
      validateArticlePayloadBarcodes(req.body, id);
    } catch (e) {
      return res.status(400).json({ error: String(e.message) });
    }
    const tx = db.transaction(() => {
      updateArticle.run({ ...articlePayload(req.body, 0), id });
      deleteVariationsFor.run(id);
      (req.body.variations || []).forEach((v, i) =>
        insertVariation.run(variationPayload(v, id, i))
      );
    });
    try {
      tx();
      const name = String(req.body.item_name || '').trim() || `#${id}`;
      const variationCount = (req.body.variations || []).length;
      logChange(req.user, 'article_update', {
        entityType: 'article',
        entityId: id,
        summary: variationCount
          ? `Updated article "${name}" (${variationCount} variation(s))`
          : `Updated article "${name}"`,
        details: { variationCount },
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
