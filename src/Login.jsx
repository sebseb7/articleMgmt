import { Component } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { api } from './api.js';

export default class Login extends Component {
  state = {
    username: '',
    password: '',
    error: '',
    loading: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = this.state;
    const { onLogin } = this.props;
    this.setState({ error: '', loading: true });
    try {
      const { user } = await api.login(username, password);
      onLogin(user);
    } catch (err) {
      this.setState({ error: err.message || 'Login failed.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { username, password, error, loading } = this.state;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ width: '100%', maxWidth: 400, p: 4 }}
          component="form"
          onSubmit={this.handleSubmit}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <LockOutlinedIcon color="primary" />
            <Typography variant="h5" component="h1">
              SumUp Article Editor
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to manage articles.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Username"
            fullWidth
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => this.setState({ username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            autoComplete="current-password"
            value={password}
            onChange={(e) => this.setState({ password: e.target.value })}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !username || !password}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
          </Button>
        </Paper>
      </Box>
    );
  }
}
