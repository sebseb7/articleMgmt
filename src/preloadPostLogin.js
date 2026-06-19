import { afterLcp } from './afterLcp.js';
import { importApp, importArticlesGrid } from './lazyChunks.js';

/** Warm lazy chunks for the authenticated app without mounting them. */
export function preloadPostLoginChunks() {
  void Promise.all([importApp(), importArticlesGrid()]);
}

/** After LCP and an idle slice, fetch App + grid chunks in the background. */
export function schedulePostLoginPreload() {
  afterLcp(() => {
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1));
    idle(() => preloadPostLoginChunks(), { timeout: 1000 });
  });
}
