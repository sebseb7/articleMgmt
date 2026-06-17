import { test, expect } from '@playwright/test';
import { waitForArticlesLoaded, stabilizePage } from './helpers.js';

test.describe('visual regression', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    storageState: 'tests/.auth/demo.json',
  });

  test.beforeEach(async ({ page }) => {
    await stabilizePage(page);
    await page.goto('/');
    await waitForArticlesLoaded(page);
  });

  test('home with demo data', async ({ page }) => {
    await expect(page).toHaveScreenshot('home-populated.png', { fullPage: true });
  });

  test('barcode assign button', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Assign barcode' }).first();
    await button.waitFor();
    // Strict: this is the test that catches IconButton size/style changes.
    await expect(button).toHaveScreenshot('barcode-assign-button.png', {
      maxDiffPixelRatio: 0,
      maxDiffPixels: 0,
    });
  });

  test('search results', async ({ page }) => {
    await page.getByPlaceholder(/Search or scan barcode/).fill('Espresso');
    await page.keyboard.press('Enter');
    await page.getByText('Espresso').first().waitFor();
    await expect(page).toHaveScreenshot('home-search.png', { fullPage: true });
  });

  test('missing barcode filter', async ({ page }) => {
    await page.getByLabel('Missing barcode').check();
    await waitForArticlesLoaded(page);
    await expect(page).toHaveScreenshot('home-missing-barcode.png', { fullPage: true });
  });

  test('category filter', async ({ page }) => {
    await page.getByRole('button', { name: 'Beverages' }).click();
    await waitForArticlesLoaded(page);
    await expect(page).toHaveScreenshot('home-category-filter.png', { fullPage: true });
  });

  test('new article dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'New article' }).click();
    await page.getByRole('heading', { name: 'New article' }).waitFor();
    await expect(page).toHaveScreenshot('dialog-new-article.png', { fullPage: true });
  });

  test('categories dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Categories' }).click();
    await page.getByRole('heading', { name: 'Categories' }).waitFor();
    await expect(page).toHaveScreenshot('dialog-categories.png', { fullPage: true });
  });

  test('mobile home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForArticlesLoaded(page);
    await expect(page).toHaveScreenshot('mobile-home.png', { fullPage: true });
  });
});
