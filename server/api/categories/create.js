import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { createCategory } from '../../categories.js';

export default function register(app) {
  app.post('/api/categories', requireAuth, (req, res) => {
    try {
      const category = createCategory(req.body?.name);
      logChange(req.user, 'category_create', {
        entityType: 'category',
        entityId: category.id,
        summary: `Created category "${category.name}"`,
      });
      res.status(201).json(category);
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
