import { requireAuth, requirePrinterClient } from '../../../auth.js';
import { getConnectedPrinters, queuePrint } from '../../../printer-hub.js';

export default function register(app) {
  app.get('/api/v1/printer/printers', requireAuth, requirePrinterClient, (req, res) => {
    res.json({ printers: getConnectedPrinters() });
  });

  app.post('/api/v1/printer/print', requireAuth, requirePrinterClient, async (req, res) => {
    const printerId = String(req.body.printerId || '').trim();
    if (!printerId) {
      return res.status(400).json({ error: 'printerId is required.' });
    }
    try {
      const result = await queuePrint(printerId, req.body.zpl, {
        requestedBy: req.user.username,
        via: req.auth?.type,
      });
      res.json(result);
    } catch (e) {
      res.status(e.status || 400).json({ error: String(e.message) });
    }
  });
}
