import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const HOUR_MS = 60 * 60 * 1000;

function backupFilename() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `data-${stamp}.db`;
}

export function startBackupScheduler(db, databasePath) {
  const backupDir = join(dirname(databasePath), 'backup');
  mkdirSync(backupDir, { recursive: true });

  let running = false;

  async function runBackup() {
    if (running) return;
    running = true;
    const dest = join(backupDir, backupFilename());
    try {
      await db.backup(dest);
      console.log(`Database backed up to ${dest}`);
    } catch (e) {
      console.error('Database backup failed:', e);
    } finally {
      running = false;
    }
  }

  runBackup();
  const timer = setInterval(runBackup, HOUR_MS);

  return () => clearInterval(timer);
}
