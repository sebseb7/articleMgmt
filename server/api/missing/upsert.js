import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { upsertMissingBarcode } from '../../missing.js';

export default function register(app) {
  app.put('/api/missing', requireAuth, (req, res) => {
    try {
      const { barcode, note } = req.body || {};
      const entry = upsertMissingBarcode(barcode, note);
      logChange(req.user, 'missing_upsert', {
        entityType: 'missing',
        summary: entry.note
          ? `Added missing barcode ${entry.barcode} with note`
          : `Added missing barcode ${entry.barcode}`,
        details: entry,
      });
      res.json(entry);
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
