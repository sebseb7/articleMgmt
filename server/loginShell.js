import React from 'react';
import { renderToString } from 'react-dom/server';
import createCache from '@emotion/cache';
import createEmotionServer from '@emotion/server/create-instance';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import LoginView from '../src/LoginView.jsx';
import { theme } from '../src/theme.js';

const noop = () => {};

function renderLoginMarkup() {
  const cache = createCache({ key: 'mui', prepend: true });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const loginTree = React.createElement(
    CacheProvider,
    { value: cache },
    React.createElement(
      ThemeProvider,
      { theme },
      React.createElement(CssBaseline),
      React.createElement(LoginView, {
        username: '',
        password: '',
        error: '',
        loading: false,
        onSubmit: noop,
        onUsernameChange: noop,
        onPasswordChange: noop,
      }),
    ),
  );

  const html = renderToString(loginTree);
  const chunks = extractCriticalToChunks(html);
  const styles = constructStyleTagsFromChunks(chunks);

  return { html, styles };
}

/** Inject MUI SSR login into index.html for first paint. */
export function injectLoginShell(html) {
  if (html.includes('data-prerender="login"')) {
    return html;
  }

  const { html: loginHtml, styles } = renderLoginMarkup();

  const withStyles = html.includes('data-emotion="mui')
    ? html
    : html.replace('</head>', `${styles}\n</head>`);

  return withStyles.replace(
    '<div id="root"></div>',
    `<div id="root">${loginHtml}</div>`,
  );
}
