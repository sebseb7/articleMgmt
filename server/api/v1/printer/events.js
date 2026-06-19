import { resolveAuth, requirePrinterClient } from '../../../auth.js';
import { connectClient } from '../../../printer-hub.js';

export default function register(app) {
  app.get('/api/v1/printer/events', (req, res, next) => {
    const auth = resolveAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    req.user = auth.user;
    req.auth = auth;
    requirePrinterClient(req, res, () => connectClient(req, res));
  });
}
