import db from '../../db.js';
import { parseCsv } from '../../csv.js';
import { requireAuth } from '../../auth.js';
import {
  findOrCreateCategory,
  clearCategories,
} from '../../categories.js';
import { bumpLocalBarcodeMaxFromBarcodes } from '../../metadata.js';
import {
  collectBarcodesFromParsedArticles,
  assertNoDuplicateBarcodes,
} from '../../barcodes.js';
import { logChange } from '../../changelog.js';
import { enrichArticlesWithImageThumbs, resetImagesDir } from '../../images.js';
import {
  insertArticle,
  insertVariation,
  variationPayload,
} from '../../articles.js';

export default function register(app) {
  app.post('/api/import', requireAuth, async (req, res) => {
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

    const importedBarcodes = collectBarcodesFromParsedArticles(articles);
    try {
      assertNoDuplicateBarcodes(importedBarcodes);
    } catch (e) {
      return res.status(400).json({ error: String(e.message) });
    }
    bumpLocalBarcodeMaxFromBarcodes(importedBarcodes);

    const thumbnailTotal = articles.filter((a) => a.image_url).length;
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders?.();

    const writeEvent = (event) => {
      res.write(`${JSON.stringify(event)}\n`);
      res.flush?.();
    };

    try {
      writeEvent({
        phase: 'start',
        articles: articles.length,
        thumbnails: thumbnailTotal,
      });

      resetImagesDir();
      articles = await enrichArticlesWithImageThumbs(articles, (progress) => {
        writeEvent({ phase: 'thumbnail', ...progress });
      });

      writeEvent({ phase: 'saving' });

      const variationCount = db.transaction(() => {
        db.prepare('DELETE FROM variations').run();
        db.prepare('DELETE FROM articles').run();
        clearCategories();
        db.prepare(
          "DELETE FROM sqlite_sequence WHERE name IN ('articles','variations','categories')"
        ).run();

        let count = 0;
        articles.forEach((a, idx) => {
          const { variations, category, ...rest } = a;
          const category_id = findOrCreateCategory(category);
          const info = insertArticle.run({ ...rest, category_id, sort_order: idx });
          const articleId = info.lastInsertRowid;
          variations.forEach((v, i) => {
            insertVariation.run(variationPayload(v, articleId, i));
          });
          count += variations.length > 0 ? variations.length : 1;
        });
        return count;
      })();

      logChange(req.user, 'import', {
        entityType: 'database',
        summary: `Imported ${articles.length} article(s) and ${variationCount} variation row(s) from CSV`,
        details: { articles: articles.length, variations: variationCount },
      });
      writeEvent({ phase: 'done', articles: articles.length, variations: variationCount });
      res.end();
    } catch (e) {
      writeEvent({ phase: 'error', error: String(e.message) });
      res.end();
    }
  });
}
