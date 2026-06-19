import db, { dbPath } from '../../db.js';
import { requireAuth } from '../../auth.js';
import { logChange } from '../../changelog.js';
import { backupDatabase } from '../../backup.js';

export default function register(app) {
  app.post('/api/flush', requireAuth, async (req, res) => {
    try {
      await backupDatabase(db, dbPath);
      const tx = db.transaction(() => {
        db.prepare('DELETE FROM variations').run();
        db.prepare('DELETE FROM articles').run();
        db.prepare(
          "DELETE FROM sqlite_sequence WHERE name IN ('articles', 'variations')",
        ).run();
      });
      tx();
      logChange(req.user, 'flush', {
        entityType: 'database',
        summary: 'Flushed all articles and variations (categories kept)',
      });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });
}
