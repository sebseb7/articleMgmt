import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { api } from './api.js';
import Login from './Login.jsx';
import App from './App.jsx';

export default function Root() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.me()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  if (checking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <App user={user} onLogout={handleLogout} />;
}
