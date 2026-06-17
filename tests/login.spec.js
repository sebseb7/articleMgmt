import { test, expect } from '@playwright/test';
import { stabilizePage } from './helpers.js';

test.describe('login screen', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('login screen', async ({ page }) => {
    await stabilizePage(page);
    await page.goto('/');
    await page.getByRole('heading', { name: 'SumUp Article Editor' }).waitFor();
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });
});
