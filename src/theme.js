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
    // scrollbar-gutter already reserves scrollbar space; MUI's scroll lock adds
    // padding-right on top of that and shifts the layout. Disable it and block
    // scroll via ModalScrollLock instead so the scrollbar stays visible.
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      },
      styleOverrides: {
        root: {
          width: '100vw',
          right: 'auto',
        },
      },
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          width: '100vw',
          right: 'auto',
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
          color: '#ffffff',
          '@media (hover: hover)': {
            '&:hover': {
              background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
              color: '#ffffff',
            },
          },
          '&:active': {
            background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
            color: '#ffffff',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(13, 148, 136, 0.45)',
          color: '#0f766e',
          '@media (hover: hover)': {
            '&:hover': {
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              borderColor: '#0d9488',
              color: '#0f766e',
            },
          },
          '&:active': {
            backgroundColor: 'rgba(13, 148, 136, 0.14)',
            color: '#0f766e',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        filled: {
          '&:not(.MuiChip-colorPrimary)': {
            backgroundColor: 'rgba(13, 148, 136, 0.14)',
            color: '#0f766e',
          },
        },
        filledPrimary: {
          backgroundColor: '#0d9488',
          color: '#ffffff',
          '@media (hover: hover)': {
            '&:hover': {
              backgroundColor: '#0f766e',
              color: '#ffffff',
            },
          },
          '&:active': {
            backgroundColor: '#0f766e',
            color: '#ffffff',
          },
        },
        outlined: {
          '&:not(.MuiChip-colorPrimary)': {
            borderColor: 'rgba(13, 148, 136, 0.35)',
            color: '#0f766e',
            '@media (hover: hover)': {
              '&:hover': {
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                color: '#0f766e',
              },
            },
            '&:active': {
              backgroundColor: 'rgba(13, 148, 136, 0.14)',
              color: '#0f766e',
            },
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(13, 148, 136, 0.45)',
          color: '#0f766e',
          '@media (hover: hover)': {
            '&:hover': {
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              color: '#0f766e',
            },
          },
          '&:active': {
            backgroundColor: 'rgba(13, 148, 136, 0.14)',
            color: '#0f766e',
          },
        },
        deleteIcon: {
          color: 'inherit',
        },
        deleteIconColorPrimary: {
          color: 'rgba(255, 255, 255, 0.85)',
          '@media (hover: hover)': {
            '&:hover': {
              color: '#ffffff',
            },
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: '#0f766e',
          '@media (hover: hover)': {
            '&:hover': {
              backgroundColor: 'rgba(13, 148, 136, 0.12)',
              color: '#0f766e',
            },
          },
          '&:active': {
            backgroundColor: 'rgba(13, 148, 136, 0.16)',
            color: '#0f766e',
          },
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
            color: '#ffffff',
            '@media (hover: hover)': {
              '&:hover': {
                background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
                color: '#ffffff',
              },
            },
            '&:active': {
              background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
              color: '#ffffff',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        colorPrimary: {
          color: '#0d9488',
          '@media (hover: hover)': {
            '&:hover': {
              backgroundColor: 'rgba(13, 148, 136, 0.12)',
              color: '#0f766e',
            },
          },
          '&:active': {
            backgroundColor: 'rgba(13, 148, 136, 0.16)',
            color: '#0f766e',
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
