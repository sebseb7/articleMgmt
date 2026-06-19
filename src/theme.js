import { createTheme } from '@mui/material/styles';
import { fontFamily } from './fonts.js';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
      light: '#5eead4',
      dark: '#115e59',
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
      secondary: '#4f6d6b',
    },
    success: {
      main: '#059669',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily,
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
    MuiDialog: {
      defaultProps: {
        transitionDuration: 0,
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
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#0f766e',
          },
        },
        outlined: {
          '&.MuiInputLabel-shrink': {
            color: '#0f766e',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          '--variant-containedBg': '#115e59',
          backgroundColor: '#115e59',
          backgroundImage: 'linear-gradient(135deg, #115e59 0%, #0f766e 100%)',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
          color: '#ffffff',
          '@media (hover: hover)': {
            '&:hover': {
              '--variant-containedBg': '#134e4a',
              backgroundColor: '#134e4a',
              backgroundImage: 'linear-gradient(135deg, #134e4a 0%, #115e59 100%)',
              color: '#ffffff',
            },
          },
          '&:active': {
            '--variant-containedBg': '#134e4a',
            backgroundColor: '#134e4a',
            backgroundImage: 'linear-gradient(135deg, #134e4a 0%, #115e59 100%)',
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
          backgroundColor: '#115e59',
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
          transition: 'none',
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
            '--variant-containedBg': '#115e59',
            backgroundColor: '#115e59',
            backgroundImage: 'linear-gradient(135deg, #115e59 0%, #0f766e 100%)',
            color: '#ffffff',
            '@media (hover: hover)': {
              '&:hover': {
                '--variant-containedBg': '#134e4a',
                backgroundColor: '#134e4a',
                backgroundImage: 'linear-gradient(135deg, #134e4a 0%, #115e59 100%)',
                color: '#ffffff',
              },
            },
            '&:active': {
              '--variant-containedBg': '#134e4a',
              backgroundColor: '#134e4a',
              backgroundImage: 'linear-gradient(135deg, #134e4a 0%, #115e59 100%)',
              color: '#ffffff',
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        colorPrimary: {
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
            borderColor: '#0f766e',
          },
        },
      },
    },
  },
});

const mobile = `@media (max-width:${baseTheme.breakpoints.values.sm - 0.05}px) and (orientation: portrait)`;

export const theme = createTheme(baseTheme, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          [mobile]: {
            fontSize: '14px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          [mobile]: {
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          [mobile]: {
            minHeight: 44,
            paddingLeft: 8,
            paddingRight: 8,
            gap: 4,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          [mobile]: {
            margin: 12,
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          [mobile]: {
            padding: '10px 16px',
            fontSize: '1rem',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          [mobile]: {
            padding: '8px 16px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          [mobile]: {
            padding: '8px 12px 12px',
            gap: 6,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          [mobile]: {
            padding: '6px 8px',
            fontSize: '0.8125rem',
          },
        },
        head: {
          [mobile]: {
            padding: '6px 8px',
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          [mobile]: {
            fontSize: '0.8125rem',
            padding: '4px 10px',
            minHeight: 32,
          },
        },
        sizeSmall: {
          [mobile]: {
            fontSize: '0.75rem',
            padding: '2px 6px',
            minHeight: 26,
          },
        },
        sizeLarge: {
          [mobile]: {
            fontSize: '0.875rem',
            padding: '6px 14px',
            minHeight: 36,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          [mobile]: {
            height: 24,
            fontSize: '0.75rem',
          },
        },
        sizeSmall: {
          [mobile]: {
            height: 20,
            fontSize: '0.6875rem',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          [mobile]: {
            padding: 6,
          },
        },
        sizeSmall: {
          [mobile]: {
            padding: 4,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          [mobile]: {
            fontSize: '0.875rem',
          },
        },
        input: {
          [mobile]: {
            padding: '8px 10px',
          },
        },
        inputSizeSmall: {
          [mobile]: {
            padding: '4px 8px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          [mobile]: {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          [mobile]: {
            minWidth: 28,
            height: 28,
            fontSize: '0.8125rem',
            margin: '0 2px',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          [mobile]: {
            marginLeft: -6,
            marginRight: 8,
          },
        },
        label: {
          [mobile]: {
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          [mobile]: {
            borderRadius: 8,
          },
        },
      },
    },
  },
});
