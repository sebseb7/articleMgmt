export async function waitForArticlesLoaded(page) {
  await page.getByText(/\d+ articles · \d+ variations/).waitFor({ timeout: 15_000 });
  await page.locator('.ag-root').waitFor({ state: 'visible', timeout: 15_000 });
}

export async function openMissingBarcodeDialog(page, barcode) {
  await page.getByPlaceholder(/Search or scan barcode/).fill(barcode);
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: /Barcode not found|Barcode on missing list/ }).waitFor();
}

export async function openNavigateMenu(page) {
  await page.getByRole('button', { name: 'Navigate' }).click();
  await page.getByRole('menu').waitFor();
}

export async function openSettingsMenu(page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('menu').waitFor();
}

export async function openTokensDialog(page) {
  await openSettingsMenu(page);
  await page.getByRole('menuitem', { name: 'API tokens' }).click();
  await page.getByRole('heading', { name: 'API tokens' }).waitFor();
}

export async function openMissingListDialog(page) {
  await openNavigateMenu(page);
  await page.getByRole('menuitem', { name: 'Missing barcodes' }).click();
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

const VISUAL_TEST_PRINTER = {
  id: 'visual-test-printer',
  name: 'zebra-counter',
  connectedAt: '2026-01-01T12:00:00.000Z',
};

/** Stub printer SSE so the header and price cells show connected print icons. */
export async function mockConnectedPrinter(page, printer = VISUAL_TEST_PRINTER) {
  const sseBody = [
    ': connected\n\n',
    `event: printers\ndata: ${JSON.stringify({ printers: [printer] })}\n\n`,
  ].join('');

  await page.route('**/api/v1/printer/events**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
      body: sseBody,
    });
  });
}

export async function waitForPrinterConnected(page, printerName = VISUAL_TEST_PRINTER.name) {
  await page.getByLabel(`Printer connected: ${printerName}`).waitFor();
  await page.getByRole('button', { name: 'Print price label' }).first().waitFor();
}

export const VISUAL_TEST_TOKEN = {
  id: 1,
  name: 'Visual test token',
  token: 'amt_visualRegressionTestToken12',
  tokenPrefix: 'amt_visualRe…',
  scopes: ['app'],
};

/** Deterministic token API so created-token text and QR snapshots stay stable. */
export async function mockDeterministicTokenApi(page, token = VISUAL_TEST_TOKEN) {
  let list = [];

  await page.route('**/api/tokens**', async (route) => {
    const req = route.request();
    const { pathname } = new URL(req.url());

    if (req.method() === 'GET' && pathname.endsWith('/api/tokens')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(list) });
      return;
    }

    if (req.method() === 'POST' && pathname.endsWith('/api/tokens')) {
      const body = req.postDataJSON();
      const created = {
        ...token,
        name: body.name || token.name,
        scopes: body.scopes || token.scopes,
      };
      list = [{
        id: created.id,
        name: created.name,
        tokenPrefix: created.tokenPrefix,
        scopes: created.scopes,
        createdAt: '2026-01-01T12:00:00.000Z',
        lastUsedAt: null,
      }];
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
      return;
    }

    await route.continue();
  });
}

export async function createVisualTestToken(page, name = VISUAL_TEST_TOKEN.name) {
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Create token' }).click();
  await page.getByText('Copy this token now').waitFor();
}
