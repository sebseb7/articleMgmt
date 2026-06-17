import { test as setup, expect } from '@playwright/test';
import { DEMO_USER } from '../server/demo-data.js';

setup('create auth storage', async ({ page }) => {
  const res = await page.request.post('/api/auth/login', {
    data: { username: DEMO_USER.username, password: DEMO_USER.password },
  });
  expect(res.ok(), `Login failed (${res.status()}): ${await res.text()}`).toBeTruthy();
  await page.context().storageState({ path: 'tests/.auth/demo.json' });
});
