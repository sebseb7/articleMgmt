import db from '../../db.js';
import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { updateCategoryById } from '../../categories.js';

export default function register(app) {
  app.put('/api/categories/:id', requireAuth, (req, res) => {
    try {
      const id = Number(req.params.id);
      const before = db.prepare('SELECT name FROM categories WHERE id = ?').get(id);
      const category = updateCategoryById(id, req.body?.name);
      logChange(req.user, 'category_update', {
        entityType: 'category',
        entityId: category.id,
        summary: `Renamed category "${before?.name || id}" to "${category.name}"`,
      });
      res.json(category);
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
