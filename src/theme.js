import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d9488',
      light: '#5eead4',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0891b2',
      light: '#67e8f9',
      dark: '#0e7490',
    },
    background: {
      default: '#e3f0ef',
      paper: '#f7fbfb',
    },
    divider: 'rgba(13, 148, 136, 0.2)',
    text: {
      primary: '#134e4a',
      secondary: '#5b7c7a',
    },
    success: {
      main: '#059669',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarGutter: 'stable',
        },
        body: {
          backgroundColor: '#e3f0ef',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 55%, #0369a1 100%)',
          boxShadow: '0 2px 14px rgba(15, 118, 110, 0.28)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: 'rgba(13, 148, 136, 0.24)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          '& .MuiTableCell-head': {
            color: '#0f766e',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(8, 145, 178, 0.06)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        filled: {
          backgroundColor: 'rgba(13, 148, 136, 0.14)',
          color: '#0f766e',
        },
        outlined: {
          borderColor: 'rgba(13, 148, 136, 0.35)',
          color: '#0f766e',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(13, 148, 136, 0.45)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0d9488',
          },
        },
      },
    },
  },
});
