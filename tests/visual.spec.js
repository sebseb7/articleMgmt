import { test, expect } from '@playwright/test';
import {
  waitForArticlesLoaded,
  stabilizePage,
  openMissingBarcodeDialog,
  openMissingListDialog,
  mockConnectedPrinter,
  waitForPrinterConnected,
  mockDeterministicTokenApi,
  openTokensDialog,
  createVisualTestToken,
} from './helpers.js';

const DEMO_UNKNOWN_BARCODE = '2342000099999';
const DEMO_EXISTING_MISSING_BARCODE = '2342000099991';

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

  test('new article dialog with variations', async ({ page }) => {
    await page.getByRole('button', { name: 'New article' }).click();
    await page.getByRole('heading', { name: 'New article' }).waitFor();
    const addVariation = page.getByRole('button', { name: 'Add variation' });
    await addVariation.click();
    await addVariation.click();
    await addVariation.click();
    await page.getByText('Variations (3)').waitFor();
    await expect(page).toHaveScreenshot('dialog-new-article-variations.png', { fullPage: false });
  });

  test('categories dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Categories' }).click();
    await page.getByRole('heading', { name: 'Categories' }).waitFor();
    await expect(page).toHaveScreenshot('dialog-categories.png', { fullPage: true });
  });

  test('missing barcode dialog (not found)', async ({ page }) => {
    await openMissingBarcodeDialog(page, DEMO_UNKNOWN_BARCODE);
    await page.getByRole('heading', { name: 'Barcode not found' }).waitFor();
    await expect(page).toHaveScreenshot('dialog-missing-barcode-new.png', { fullPage: true });
  });

  test('missing barcode dialog (on list)', async ({ page }) => {
    await openMissingBarcodeDialog(page, DEMO_EXISTING_MISSING_BARCODE);
    await page.getByRole('heading', { name: 'Barcode on missing list' }).waitFor();
    await expect(page).toHaveScreenshot('dialog-missing-barcode-existing.png', { fullPage: true });
  });

  test('missing barcodes list dialog', async ({ page }) => {
    await openMissingListDialog(page);
    await expect(page).toHaveScreenshot('dialog-missing-list.png', { fullPage: true });
  });

  test('home with connected printer', async ({ page }) => {
    await mockConnectedPrinter(page);
    await page.reload();
    await waitForArticlesLoaded(page);
    await waitForPrinterConnected(page);
    await page.getByText('Cappuccino').click();
    await page.getByRole('button', { name: 'Print price label' }).nth(3).waitFor();
    await expect(page).toHaveScreenshot('home-printer-connected.png', { fullPage: true });
  });

  test('tokens dialog after create', async ({ page }) => {
    await mockDeterministicTokenApi(page);
    await openTokensDialog(page);
    await createVisualTestToken(page);
    await expect(page).toHaveScreenshot('dialog-tokens-created.png', { fullPage: true });
  });

  test('token qr dialog', async ({ page }) => {
    await mockDeterministicTokenApi(page);
    await openTokensDialog(page);
    await createVisualTestToken(page);
    await page.getByRole('button', { name: 'Show token as QR code' }).click();
    await page.getByRole('heading', { name: 'Token QR code' }).waitFor();
    await expect(page).toHaveScreenshot('dialog-token-qr.png', { fullPage: true });
  });

  test.describe('mobile', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    test('home', async ({ page }) => {
      await expect(page).toHaveScreenshot('mobile-home.png', { fullPage: true });
    });
  });
});
