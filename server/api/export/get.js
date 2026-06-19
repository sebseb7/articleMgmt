import { buildCsv } from '../../csv.js';
import { requireAuth } from '../../auth.js';
import { getAllArticles } from '../../articles.js';

export default function register(app) {
  app.get('/api/export', requireAuth, (req, res) => {
    const csv = buildCsv(getAllArticles());
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="items-export-${stamp}.csv"`
    );
    res.send(csv);
  });
}
