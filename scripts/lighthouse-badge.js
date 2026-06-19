import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const manifestPath = resolve(projectRoot, '.lighthouseci', 'manifest.json');
const badgesDir = resolve(projectRoot, 'lighthouse-badges');

function scoreColor(score) {
  if (score >= 90) return 'brightgreen';
  if (score >= 50) return 'yellow';
  return 'red';
}

function toBadge(label, score) {
  return {
    schemaVersion: 1,
    label,
    message: String(score),
    color: scoreColor(score),
  };
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const run = manifest.find((entry) => entry.isRepresentativeRun) ?? manifest[0];
if (!run?.summary) {
  throw new Error(`No Lighthouse summary found in ${manifestPath}`);
}

const performance = Math.round((run.summary.performance ?? 0) * 100);

mkdirSync(badgesDir, { recursive: true });
writeFileSync(
  resolve(badgesDir, 'performance.json'),
  `${JSON.stringify(toBadge('Lighthouse', performance), null, 2)}\n`,
);
