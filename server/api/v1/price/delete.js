import { requireAuth, requireScope } from '../../../auth.js';
import { normalizedBarcode } from '../../../articles.js';
import { deleteBarcodePrice } from '../../../barcodes.js';
import { logChange } from '../../../changelog.js';

export default function register(app) {
  app.delete('/api/v1/price', requireAuth, requireScope('admin'), (req, res) => {
    const barcode = normalizedBarcode(req.query.barcode ?? req.body?.barcode);
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required.' });
    }
    try {
      const result = deleteBarcodePrice(barcode);
      if (!result.deleted) {
        return res.status(404).json({ error: 'Barcode not found.' });
      }
      logChange(req.user, 'price_delete', {
        entityType: result.type,
        entityId: result.variationId ?? result.articleId,
        summary: `Deleted ${result.type} for barcode ${barcode}`,
        details: { barcode, via: req.auth?.type },
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
