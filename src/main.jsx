import React, { Component, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import createEmotionCache from './emotionCache.js';
import { theme } from './theme.js';
import ModalScrollLock from './ModalScrollLock.jsx';
import { api } from './api.js';
import Login from './Login.jsx';

const App = lazy(() => import('./App.jsx'));
const clientCache = createEmotionCache();

class Root extends Component {
  state = {
    user: null,
    checking: true,
  };

  componentDidMount() {
    api.me()
      .then(({ user: current }) => this.setState({ user: current }))
      .catch(() => this.setState({ user: null }))
      .finally(() => this.setState({ checking: false }));
  }

  handleLogin = (user) => {
    this.setState({ user });
  };

  handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      this.setState({ user: null });
    }
  };

  render() {
    const { user } = this.state;

    if (!user) {
      return <Login onLogin={this.handleLogin} />;
    }

    return (
      <>
        <ModalScrollLock />
        <SnackbarProvider
          autoHideDuration={4000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          maxSnack={3}
        >
          <Suspense
            fallback={(
              <Box
                component="main"
                sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CircularProgress />
              </Box>
            )}
          >
            <App user={user} onLogout={this.handleLogout} />
          </Suspense>
        </SnackbarProvider>
      </>
    );
  }
}

const rootEl = document.getElementById('root');
const useHydrate = Boolean(rootEl?.querySelector('[data-prerender="login"]'));

const app = (
  <CacheProvider value={clientCache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Root />
    </ThemeProvider>
  </CacheProvider>
);

const mount = useHydrate ? ReactDOM.hydrateRoot : ReactDOM.createRoot;
mount(rootEl).render(
  <React.StrictMode>
    {app}
  </React.StrictMode>,
);
