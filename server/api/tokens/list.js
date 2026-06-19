import { requireAuth, requireSession } from '../../auth.js';
import { listTokensForUser } from '../../tokens.js';

export default function register(app) {
  app.get('/api/tokens', requireAuth, requireSession, (req, res) => {
    res.json(listTokensForUser(req.user.id));
  });
}
