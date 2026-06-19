import { execSync, spawn } from 'node:child_process';
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
