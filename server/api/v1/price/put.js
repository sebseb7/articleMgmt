import { requireAuth, requireScope } from '../../../auth.js';
import { normalizedBarcode } from '../../../articles.js';
import { upsertBarcodePrice } from '../../../barcodes.js';
import { logChange } from '../../../changelog.js';

export default function register(app) {
  app.put('/api/v1/price', requireAuth, requireScope('app'), (req, res) => {
    const barcode = normalizedBarcode(req.body.barcode ?? req.query.barcode);
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required.' });
    }
    try {
      const result = upsertBarcodePrice(barcode, {
        price: req.body.price,
        name: req.body.name,
        taxRate: req.body.taxRate ?? req.body.tax_rate,
      });
      const action = result.created ? 'price_create' : 'price_update';
      logChange(req.user, action, {
        entityType: result.type,
        entityId: result.variationId ?? result.articleId,
        summary: result.created
          ? `Created article "${result.name}" with price ${result.price} (barcode ${barcode})`
          : `Updated price to ${result.price} for barcode ${barcode}`,
        details: { barcode, via: req.auth?.type },
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
