import { requireAuth } from '../../auth.js';
import { listMissingBarcodes } from '../../missing.js';

export default function register(app) {
  app.get('/api/missing', requireAuth, (req, res) => {
    res.json(listMissingBarcodes());
  });
}
