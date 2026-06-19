import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectLoginShell } from './loginShell.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '../dist/index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[prerender] dist/index.html not found — run vite build first');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(indexPath, injectLoginShell(html));
console.log('[prerender] injected login shell into dist/index.html');
