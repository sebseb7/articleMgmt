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
import { withNoAutofill } from './textFieldUtils.js';

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
    if (!username.trim() || !password) {
      this.setState({ error: 'Enter username and password.' });
      return;
    }
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
        component="main"
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
          autoComplete="off"
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
            value={username}
            onChange={(e) => this.setState({ username: e.target.value })}
            sx={{ mb: 2 }}
            slotProps={withNoAutofill()}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => this.setState({ password: e.target.value })}
            sx={{ mb: 3 }}
            slotProps={withNoAutofill()}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
          </Button>
        </Paper>
      </Box>
    );
  }
}
