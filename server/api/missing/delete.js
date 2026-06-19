import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { deleteMissingBarcode } from '../../missing.js';
import { normalizedBarcode } from '../../articles.js';

export default function register(app) {
  app.delete('/api/missing/:barcode', requireAuth, (req, res) => {
    try {
      const barcode = decodeURIComponent(req.params.barcode);
      deleteMissingBarcode(barcode);
      logChange(req.user, 'missing_delete', {
        entityType: 'missing',
        summary: `Removed missing barcode ${normalizedBarcode(barcode)}`,
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
