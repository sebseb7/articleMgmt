import { requireAuth } from '../../auth.js';
import { getChangelogPage } from '../../changelog.js';

export default function register(app) {
  app.get('/api/changelog', requireAuth, (req, res) => {
    res.json(getChangelogPage({
      page: req.query.page,
      pageSize: req.query.pageSize,
    }));
  });
}
