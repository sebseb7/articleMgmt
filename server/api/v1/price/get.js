import { requireAuth, requireScope } from '../../../auth.js';
import { normalizedBarcode } from '../../../articles.js';
import { lookupBarcodePrice } from '../../../barcodes.js';

export default function register(app) {
  app.get('/api/v1/price', requireAuth, requireScope('app'), (req, res) => {
    const barcode = normalizedBarcode(req.query.barcode);
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required.' });
    }
    res.json(lookupBarcodePrice(barcode));
  });
}
