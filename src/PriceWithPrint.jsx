import { PureComponent } from 'react';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { money } from './articleTableUtils.js';

export default class PriceWithPrint extends PureComponent {
  handlePrint = (e) => {
    e.stopPropagation();
    const { price, printKey, onPrintPrice, disabled } = this.props;
    if (disabled || price === null || price === undefined) return;
    onPrintPrice?.(price, printKey);
  };

  render() {
    const {
      price, printerConnected, onPrintPrice, printing, disabled,
    } = this.props;

    if (price === null || price === undefined) {
      return <span>—</span>;
    }

    const canPrint = printerConnected && onPrintPrice;
    const busy = printing;

    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.25,
        }}
      >
        <span>{money(price)}</span>
        {canPrint && (
          <Tooltip title="Print price label">
            <span>
              <IconButton
                size="small"
                aria-label="Print price label"
                disabled={disabled || busy}
                onClick={this.handlePrint}
                sx={{ p: 0.25, color: 'success.main' }}
              >
                {busy ? <CircularProgress size={14} color="inherit" /> : <PrintIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    );
  }
}
