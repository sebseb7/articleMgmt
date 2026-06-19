import { requireAuth } from '../../auth.js';
import { getArticlesPage } from '../../articles.js';

export default function register(app) {
  app.get('/api/articles', requireAuth, (req, res) => {
    const result = getArticlesPage({
      page: req.query.page,
      pageSize: req.query.pageSize,
      q: req.query.q,
      missingBarcode: req.query.missingBarcode === '1',
      categoryIds: req.query.categoryIds,
      includeMeta: req.query.meta !== '0',
    });
    res.json(result);
  });
}
