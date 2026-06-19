import db from '../../db.js';
import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { deleteCategoryById } from '../../categories.js';

export default function register(app) {
  app.delete('/api/categories/:id', requireAuth, (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare('SELECT name FROM categories WHERE id = ?').get(id);
      deleteCategoryById(id);
      logChange(req.user, 'category_delete', {
        entityType: 'category',
        entityId: id,
        summary: `Deleted category "${existing?.name || id}"`,
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
