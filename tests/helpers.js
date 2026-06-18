export async function waitForArticlesLoaded(page) {
  await page.getByText(/\d+ articles · \d+ variations/).waitFor({ timeout: 15_000 });
  await page.locator('.ag-root').waitFor({ state: 'visible', timeout: 15_000 });
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
