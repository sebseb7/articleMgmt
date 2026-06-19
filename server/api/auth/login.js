import { authenticate, signToken, COOKIE_NAME, cookieOptions } from '../../auth.js';

export default function register(app) {
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({ user });
  });
}
