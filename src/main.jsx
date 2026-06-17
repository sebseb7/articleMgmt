import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme.js';
import ModalScrollLock from './ModalScrollLock.jsx';
import { api } from './api.js';
import Login from './Login.jsx';
import App from './App.jsx';

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
    const { user, checking } = this.state;

    if (checking) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!user) {
      return <Login onLogin={this.handleLogin} />;
    }

    return <App user={user} onLogout={this.handleLogout} />;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ModalScrollLock />
      <SnackbarProvider
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        maxSnack={3}
      >
        <Root />
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
