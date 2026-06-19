import React from 'react';
import { renderToString } from 'react-dom/server';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache, { stripEmotionStyleTags } from '../src/emotionCache.js';
import AppProviders from '../src/AppProviders.jsx';
import Root from '../src/Root.jsx';

export function renderLoginPrerender() {
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const loginTree = React.createElement(
    AppProviders,
    { cache },
    React.createElement(Root),
  );

  const html = renderToString(loginTree);
  const inlineStyles = html.match(/<style[^>]*data-emotion[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const bodyHtml = stripEmotionStyleTags(html);
  const emotionChunks = extractCriticalToChunks(bodyHtml);
  const extractedStyles = constructStyleTagsFromChunks(emotionChunks);
  const styles = inlineStyles.length ? inlineStyles.join('\n') : extractedStyles;

  return { html: bodyHtml, styles };
}

/** Inject MUI SSR login into index.html for first paint. */
export function injectLoginShell(documentHtml) {
  if (documentHtml.includes('data-prerender="login"')) {
    return documentHtml;
  }

  const { html: loginHtml, styles } = renderLoginPrerender();

  const withStyles = documentHtml.includes('data-emotion="css')
    ? documentHtml
    : documentHtml.replace('</head>', `${styles}\n</head>`);

  return withStyles.replace(
    '<div id="root"></div>',
    `<div id="root">${loginHtml}</div>`,
  );
}
