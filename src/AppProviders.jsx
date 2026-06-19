import { Component } from 'react';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme.js';

/** Provider shell shared by SSR prerender and client hydration. */
export default class AppProviders extends Component {
  render() {
    const { cache, children } = this.props;
    return (
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    );
  }
}
