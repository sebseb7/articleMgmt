import db from '../../db.js';
import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { deleteArticleStmt } from '../../articles.js';

export default function register(app) {
  app.delete('/api/articles/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT item_name FROM articles WHERE id = ?').get(id);
    deleteArticleStmt.run(id);
    logChange(req.user, 'article_delete', {
      entityType: 'article',
      entityId: id,
      summary: `Deleted article "${existing?.item_name || id}"`,
    });
    res.json({ ok: true });
  });
}
