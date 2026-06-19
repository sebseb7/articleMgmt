import { COOKIE_NAME } from '../../auth.js';

export default function register(app) {
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });
}
