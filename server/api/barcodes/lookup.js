import { requireAuth } from '../../auth.js';
import { lookupBarcode } from '../../barcodes.js';
import { getMissingBarcode } from '../../missing.js';
import { normalizedBarcode } from '../../articles.js';

export default function register(app) {
  app.get('/api/barcodes/lookup', requireAuth, (req, res) => {
    const barcode = normalizedBarcode(req.query.barcode);
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required.' });
    }
    const { article, variation } = lookupBarcode(barcode);
    const missing = getMissingBarcode(barcode);
    res.json({ article, variation, missing });
  });
}
