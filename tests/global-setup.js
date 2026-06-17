import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

export default async function globalSetup() {
  execSync('node server/scripts/seed.js', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DB_PATH: 'data/visual-test.db',
    },
  });
}
