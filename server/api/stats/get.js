import { requireAuth } from '../../auth.js';
import { getStats } from '../../articles.js';

export default function register(app) {
  app.get('/api/stats', requireAuth, (req, res) => {
    res.json(getStats());
  });
}
