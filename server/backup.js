import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const HOUR_MS = 60 * 60 * 1000;

let running = false;

function backupFilename() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `data-${stamp}.db`;
}

export async function backupDatabase(db, databasePath) {
  if (running) {
    throw new Error('Backup already in progress.');
  }
  running = true;
  try {
    const backupDir = join(dirname(databasePath), 'backup');
    mkdirSync(backupDir, { recursive: true });
    const dest = join(backupDir, backupFilename());
    await db.backup(dest);
    console.log(`Database backed up to ${dest}`);
    return dest;
  } finally {
    running = false;
  }
}

export function startBackupScheduler(db, databasePath) {
  async function runScheduledBackup() {
    try {
      await backupDatabase(db, databasePath);
    } catch (e) {
      if (e.message !== 'Backup already in progress.') {
        console.error('Database backup failed:', e);
      }
    }
  }

  runScheduledBackup();
  const timer = setInterval(runScheduledBackup, HOUR_MS);

  return () => clearInterval(timer);
}
