import { requireAuth } from '../../auth.js';
import { listCategories } from '../../categories.js';

export default function register(app) {
  app.get('/api/categories', requireAuth, (req, res) => {
    res.json(listCategories());
  });
}
