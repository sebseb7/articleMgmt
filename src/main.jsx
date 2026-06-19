import React from 'react';
import ReactDOM from 'react-dom/client';
import createEmotionCache, { prepopulateEmotionCache } from './emotionCache.js';
import AppProviders from './AppProviders.jsx';
import { schedulePostLoginPreload } from './preloadPostLogin.js';
import Root from './Root.jsx';

const clientCache = createEmotionCache();
prepopulateEmotionCache(clientCache);

const rootEl = document.getElementById('root');
const shouldHydrate = Boolean(rootEl?.querySelector('[data-prerender="login"]'));

const app = (
  <AppProviders cache={clientCache}>
    <Root />
  </AppProviders>
);

if (shouldHydrate) {
  ReactDOM.hydrateRoot(rootEl, app);
  schedulePostLoginPreload();
} else {
  ReactDOM.createRoot(rootEl).render(
    import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app,
  );
}
