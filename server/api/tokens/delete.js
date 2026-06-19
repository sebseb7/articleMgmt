import { requireAuth, requireSession } from '../../auth.js';
import { deleteToken } from '../../tokens.js';
import { logChange } from '../../changelog.js';

export default function register(app) {
  app.delete('/api/tokens/:id', requireAuth, requireSession, (req, res) => {
    const id = Number(req.params.id);
    try {
      deleteToken(req.user.id, id);
      logChange(req.user, 'token_delete', {
        entityType: 'token',
        entityId: id,
        summary: `Deleted API token #${id}`,
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(404).json({ error: String(e.message) });
    }
  });
}
