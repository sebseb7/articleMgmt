import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '../dist/index.html');
const ssrPath = path.resolve(__dirname, '../dist/.ssr/loginShell.js');

if (!fs.existsSync(indexPath)) {
  console.error('[prerender] dist/index.html not found — run vite build first');
  process.exit(1);
}

if (!fs.existsSync(ssrPath)) {
  console.error('[prerender] dist/.ssr/loginShell.js not found — run vite build --config vite.ssr.config.js first');
  process.exit(1);
}

const { injectLoginShell } = await import(pathToFileURL(ssrPath).href);
const html = fs.readFileSync(indexPath, 'utf8');
fs.writeFileSync(indexPath, injectLoginShell(html));
console.log('[prerender] injected MUI login into dist/index.html');
