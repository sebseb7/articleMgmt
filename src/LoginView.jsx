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
import { withNoAutofill } from './textFieldUtils.js';

/** Presentational login form — shared by Login and SSR prerender. */
export default class LoginView extends Component {
  static defaultProps = {
    username: '',
    password: '',
    error: '',
    loading: false,
  };

  render() {
    const {
      username,
      password,
      error,
      loading,
      onSubmit,
      onUsernameChange,
      onPasswordChange,
    } = this.props;

    return (
      <Box
        component="main"
        data-prerender="login"
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
          onSubmit={onSubmit}
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
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <TextField
            label="Username"
            fullWidth
            autoFocus
            value={username}
            disabled={loading}
            onChange={onUsernameChange}
            sx={{ mb: 2 }}
            slotProps={withNoAutofill({ inputLabel: { shrink: true } })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            disabled={loading}
            onChange={onPasswordChange}
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
