import { execSync, spawn } from 'node:child_process';
import { get } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lighthouseEnv = {
  ...process.env,
  DB_PATH: process.env.DB_PATH ?? 'data/visual-test.db',
  PORT: process.env.PORT ?? '3993',
  AUTH_SECRET: process.env.AUTH_SECRET ?? 'visual-test-secret',
  VITE_PORT: process.env.VITE_PORT ?? '4993',
};

execSync('node server/scripts/seed.js', {
  cwd: projectRoot,
  env: lighthouseEnv,
  stdio: 'inherit',
});

execSync('npm run build', {
  cwd: projectRoot,
  env: lighthouseEnv,
  stdio: 'inherit',
});

const child = spawn(
  'npx',
  [
    'concurrently',
    '-n',
    'server,web',
    '-c',
    'blue,green',
    'npm:server:test',
    'npm:preview:test',
  ],
  {
    cwd: projectRoot,
    env: lighthouseEnv,
    stdio: 'inherit',
    shell: true,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Emit our own readiness sentinel once the preview port actually responds.
// LHCI matches its startServerReadyPattern per output chunk; relying on Vite's
// "Local:" line bubbling up through concurrently is unreliable in CI, so we
// print a sentinel directly from this top-level process instead.
const readyUrl = `http://localhost:${lighthouseEnv.VITE_PORT}/`;
const READY_TIMEOUT_MS = 120_000;
const startedAt = Date.now();
let announced = false;

function pollReady() {
  if (announced) return;
  const req = get(readyUrl, (res) => {
    res.resume();
    announced = true;
    console.log(`LHCI_SERVER_READY ${readyUrl}`);
  });
  req.on('error', () => {
    if (Date.now() - startedAt > READY_TIMEOUT_MS) {
      console.error(`Timed out waiting for ${readyUrl} to respond`);
      process.exit(1);
    }
    setTimeout(pollReady, 500);
  });
}

pollReady();
