import { Component } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

class BarcodeAssignButton extends Component {
  render() {
    const { active, onStart } = this.props;

    return (
      <Tooltip title={active ? 'Enter barcode digits, then press Enter' : 'Assign barcode'}>
        <IconButton
          size="small"
          onClick={onStart}
          aria-pressed={active}
          sx={active ? {
            bgcolor: 'primary.main',
            color: '#ffffff',
            '@media (hover: hover)': {
              '&:hover': {
                bgcolor: 'primary.dark',
                color: '#ffffff',
              },
            },
            '&:active': {
              bgcolor: 'primary.dark',
              color: '#ffffff',
            },
          } : {
            border: '1px dashed',
            borderColor: 'rgba(13, 148, 136, 0.4)',
            color: '#0f766e',
            '@media (hover: hover)': {
              '&:hover': {
                bgcolor: 'rgba(13, 148, 136, 0.1)',
                color: '#0f766e',
              },
            },
          }}
        >
          <QrCodeScannerIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }
}

export default BarcodeAssignButton;
