import { Component, createRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, Box,
} from '@mui/material';
import { withNoAutofill } from './textFieldUtils.js';

const noteFieldSlotProps = withNoAutofill({ inputLabel: { shrink: true } });

export default class MissingBarcodeDialog extends Component {
  noteInputRef = createRef();

  state = {
    note: '',
    saving: false,
    error: '',
  };

  componentDidUpdate(prevProps) {
    const opened = this.props.open && !prevProps.open;
    const propsChanged = this.props.open && (
      prevProps.barcode !== this.props.barcode
      || prevProps.initialNote !== this.props.initialNote
    );
    if (opened || propsChanged) {
      this.setState({
        note: this.props.initialNote ?? '',
        saving: false,
        error: '',
      }, this.focusNoteField);
    }
  }

  focusNoteField = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = this.noteInputRef.current;
        if (!el) return;
        el.focus();
        if (el.value) {
          el.select();
        }
      });
    });
  };

  handleNoteChange = (e) => {
    this.setState({ note: e.target.value, error: '' });
  };

  handleSave = async () => {
    const { barcode, onSave } = this.props;
    const { note } = this.state;
    this.setState({ saving: true, error: '' });
    try {
      await onSave(barcode, note);
    } catch (e) {
      this.setState({ saving: false, error: e.message });
    }
  };

  handleRemove = async () => {
    const { barcode, onRemove } = this.props;
    this.setState({ saving: true, error: '' });
    try {
      await onRemove(barcode);
    } catch (e) {
      this.setState({ saving: false, error: e.message });
    }
  };

  render() {
    const { open, barcode, isExisting, onClose } = this.props;
    const { note, saving, error } = this.state;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        TransitionProps={{ onEntered: this.focusNoteField }}
      >
        <DialogTitle>
          {isExisting ? 'Barcode on missing list' : 'Barcode not found'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              No article or variation uses this barcode.
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
            >
              {barcode}
            </Typography>
            <TextField
              label="Note (optional)"
              value={note}
              onChange={this.handleNoteChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !saving) {
                  e.preventDefault();
                  this.handleSave();
                }
              }}
              fullWidth
              disabled={saving}
              placeholder={isExisting ? 'Update note…' : 'Add a note…'}
              inputRef={this.noteInputRef}
              slotProps={noteFieldSlotProps}
            />
            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isExisting ? (
            <Button onClick={this.handleRemove} color="error" disabled={saving}>
              Remove
            </Button>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button variant="contained" onClick={this.handleSave} disabled={saving}>
            {isExisting ? 'Update' : 'Add to list'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
