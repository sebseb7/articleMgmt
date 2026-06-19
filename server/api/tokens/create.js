import { requireAuth, requireSession } from '../../auth.js';
import { createToken } from '../../tokens.js';
import { logChange } from '../../changelog.js';

export default function register(app) {
  app.post('/api/tokens', requireAuth, requireSession, (req, res) => {
    try {
      const created = createToken(req.user.id, req.body.name, req.body.scopes);
      logChange(req.user, 'token_create', {
        entityType: 'token',
        entityId: created.id,
        summary: `Created API token "${created.name}" (${created.scopes.join(', ')})`,
      });
      res.status(201).json(created);
    } catch (e) {
      res.status(400).json({ error: String(e.message) });
    }
  });
}
