import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotsDir = join(root, 'tests', 'screenshots');
const referenceDir = join(root, 'tests', 'screenshots-reference');
const testResultsDir = join(root, 'test-results');

function walkFiles(dir, match, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(path, match, files);
    else if (match(path)) files.push(path);
  }
  return files;
}

function findExpectedSnapshot(name) {
  const matches = walkFiles(snapshotsDir, (path) => basename(path) === name);
  return matches[0] ?? null;
}

export function collectReferenceSnapshots() {
  const actuals = walkFiles(testResultsDir, (path) => path.endsWith('-actual.png'));
  if (actuals.length === 0) return 0;

  let copied = 0;
  for (const actualPath of actuals) {
    const snapshotName = basename(actualPath).replace(/-actual\.png$/, '.png');
    const expectedPath = findExpectedSnapshot(snapshotName);
    if (!expectedPath) continue;

    const referencePath = join(referenceDir, relative(snapshotsDir, expectedPath));
    mkdirSync(dirname(referencePath), { recursive: true });
    copyFileSync(actualPath, referencePath);
    copied += 1;
    console.log(`Reference snapshot: ${relative(root, referencePath)}`);
  }

  return copied;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const copied = collectReferenceSnapshots();
  if (copied === 0) {
    console.log('No reference snapshots to collect.');
  } else {
    console.log(`Collected ${copied} reference snapshot(s) in tests/screenshots-reference/`);
  }
}
