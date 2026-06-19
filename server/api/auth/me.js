import { verifyToken, getUserById, COOKIE_NAME } from '../../auth.js';

export default function register(app) {
  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.json({ user: null });
    const payload = verifyToken(token);
    if (!payload) return res.json({ user: null });
    const user = getUserById(payload.sub);
    res.json({ user: user || null });
  });
}
