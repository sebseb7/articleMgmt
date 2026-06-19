import { resolveAuth, authScopes } from '../../../auth.js';
import { connectAgent } from '../../../printer-hub.js';

export default function register(app) {
  app.get('/api/v1/printer/agent', (req, res) => {
    const auth = resolveAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!authScopes(auth).includes('printer')) {
      return res.status(403).json({ error: 'Missing required scope: printer.' });
    }

    req.user = auth.user;
    req.auth = auth;
    const name = req.query.name;
    connectAgent(req, res, name);
  });
}
