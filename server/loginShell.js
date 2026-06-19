import React from 'react';
import { renderToString } from 'react-dom/server';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from '../src/emotionCache.js';
import AppProviders from '../src/AppProviders.jsx';
import Root from '../src/Root.jsx';

const noop = () => {};

export function renderLoginPrerender() {
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const loginTree = React.createElement(
    AppProviders,
    { cache },
    React.createElement(Root),
  );

  const html = renderToString(loginTree);
  const emotionChunks = extractCriticalToChunks(html);
  const styles = constructStyleTagsFromChunks(emotionChunks);

  return { html, styles };
}

/** Inject MUI SSR login into index.html for first paint. */
export function injectLoginShell(documentHtml) {
  if (documentHtml.includes('data-prerender="login"')) {
    return documentHtml;
  }

  const { html: loginHtml, styles } = renderLoginPrerender();

  const withStyles = documentHtml.includes('data-emotion="mui')
    ? documentHtml
    : documentHtml.replace('</head>', `${styles}\n</head>`);

  return withStyles.replace(
    '<div id="root"></div>',
    `<div id="root">${loginHtml}</div>`,
  );
}
