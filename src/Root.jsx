import { Component } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { api } from './api.js';
import Login from './Login.jsx';
import App from './App.jsx';

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
