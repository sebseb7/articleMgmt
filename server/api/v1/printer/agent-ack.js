import { requireAuth, requireScope } from '../../../auth.js';
import { completePrintJob } from '../../../printer-hub.js';

export default function register(app) {
  app.post('/api/v1/printer/agent/ack', requireAuth, requireScope('printer'), (req, res) => {
    const printerId = String(req.body.printerId || '').trim();
    const jobId = String(req.body.jobId || '').trim();
    if (!printerId || !jobId) {
      return res.status(400).json({ error: 'printerId and jobId are required.' });
    }
    try {
      const result = completePrintJob(printerId, {
        jobId,
        ok: req.body.ok !== false,
        error: req.body.error,
      });
      res.json(result);
    } catch (e) {
      res.status(e.status || 400).json({ error: String(e.message) });
    }
  });
}
