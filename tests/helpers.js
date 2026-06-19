export async function waitForArticlesLoaded(page) {
  await page.getByText(/\d+ articles · \d+ variations/).waitFor({ timeout: 15_000 });
  await page.locator('.ag-root').waitFor({ state: 'visible', timeout: 15_000 });
}

export async function openMissingBarcodeDialog(page, barcode) {
  await page.getByPlaceholder(/Search or scan barcode/).fill(barcode);
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: /Barcode not found|Barcode on missing list/ }).waitFor();
}

export async function openMissingListDialog(page) {
  await page.getByRole('button', { name: 'Missing barcodes' }).click();
  await page.getByRole('heading', { name: 'Missing barcodes' }).waitFor();
  await page.getByRole('table').waitFor();
  await page.getByText('2342000099991').waitFor();
}

export async function stabilizePage(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0s !important;
        animation-duration: 0s !important;
        -webkit-font-smoothing: none !important;
        -moz-osx-font-smoothing: unset !important;
      }
    `,
  });
}
