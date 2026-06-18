import { defineConfig } from '@playwright/test';

const testWebPort = 4993;
const testApiPort = 3993;
const testDbPath = 'data/visual-test.db';

export default defineConfig({
  testDir: 'tests',
  globalSetup: './tests/global-setup.js',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${testWebPort}`,
    timezoneId: 'Europe/Berlin',
    locale: 'de-DE',
    colorScheme: 'light',
    trace: 'on-first-retry',
  },
  expect: {
    // Full-page shots: maxDiffPixelRatio is a poor fit (0.5% of ~2M px ≈ 9k px budget).
    // Use a tight pixel cap so localized typography changes (e.g. barcode "missing") fail.
    toHaveScreenshot: {
      maxDiffPixels: 300,
      animations: 'disabled',
    },
  },
  snapshotPathTemplate: '{testDir}/screenshots/{testFileName}-snapshots/{arg}{ext}',
  webServer: {
    command: 'npm run dev:test',
    url: `http://localhost:${testWebPort}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DB_PATH: testDbPath,
      PORT: String(testApiPort),
      AUTH_SECRET: 'visual-test-secret',
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'login',
      testMatch: /login\.spec\.js/,
    },
    {
      name: 'visual',
      testMatch: /visual\.spec\.js/,
      dependencies: ['setup'],
    },
  ],
});
