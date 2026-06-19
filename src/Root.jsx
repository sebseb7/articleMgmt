import { Component, lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import ModalScrollLock from './ModalScrollLock.jsx';
import { api } from './api.js';
import Login from './Login.jsx';
import { importApp } from './lazyChunks.js';

const App = lazy(importApp);

export default class Root extends Component {
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
