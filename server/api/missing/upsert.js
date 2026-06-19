import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { upsertMissingBarcode } from '../../missing.js';

export default function register(app) {
  app.put('/api/missing', requireAuth, (req, res) => {
    try {
      const { barcode, note, price } = req.body || {};
      const entry = upsertMissingBarcode(barcode, { note, price });
      if (!entry.unchanged) {
        logChange(req.user, 'missing_upsert', {
          entityType: 'missing',
          summary: entry.note
            ? `Added missing barcode ${entry.barcode} with note`
            : `Added missing barcode ${entry.barcode}`,
          details: entry,
        });
      }
      res.json(entry);
    } catch (e) {
      if (e.code === 'barcode_in_catalog') {
        return res.status(409).json({ error: String(e.message), code: e.code });
      }
      res.status(400).json({ error: String(e.message) });
    }
  });
}
