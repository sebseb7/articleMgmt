import { requireAuth } from '../../auth.js';
import { allocateNextLocalBarcode } from '../../metadata.js';

export default function register(app) {
  app.post('/api/barcode/generate', requireAuth, (req, res) => {
    try {
      const barcode = allocateNextLocalBarcode();
      res.json({ barcode });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });
}
