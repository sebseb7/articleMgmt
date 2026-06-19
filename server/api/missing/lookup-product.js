import { requireAuth } from '../../auth.js';
import { lookupProductName } from '../../productLookup.js';
import { normalizedBarcode } from '../../articles.js';

export default function register(app) {
  app.get('/api/missing/:barcode/product-name', requireAuth, async (req, res) => {
    try {
      const barcode = normalizedBarcode(decodeURIComponent(req.params.barcode));
      if (!barcode) {
        return res.status(400).json({ error: 'Barcode is required.' });
      }
      const result = await lookupProductName(barcode);
      res.json(result);
    } catch (e) {
      if (e.code === 'missing_api_key') {
        return res.status(503).json({ error: String(e.message), code: e.code });
      }
      res.status(502).json({ error: String(e.message) });
    }
  });
}
