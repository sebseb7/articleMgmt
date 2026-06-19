import { Component, createRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Box, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { api } from './api.js';
import { withNoAutofill } from './textFieldUtils.js';

const monoSx = { fontFamily: 'monospace', wordBreak: 'break-all' };

const dataRowSx = {
  height: 46,
  '& > .MuiTableCell-root': {
    height: 46,
    py: 0,
    verticalAlign: 'middle',
  },
};

const inlineEditFieldSx = {
  m: 0,
  '& .MuiInputBase-root': {
    fontSize: '0.875rem',
    lineHeight: 1.43,
  },
  '& .MuiInputBase-input': {
    py: 0.25,
    height: '1.25rem',
    boxSizing: 'content-box',
  },
};

export default class MissingListDialog extends Component {
  barcodeInputRef = createRef();
  noteInputRef = createRef();

  state = {
    entries: [],
    newBarcode: '',
    newNote: '',
    editingBarcode: null,
    editNote: '',
    deletingBarcode: null,
    error: '',
    loading: false,
    forceBarcodeLabelShrink: true,
  };

  loadSeq = 0;

  componentDidUpdate(prevProps) {
    if (this.props.wantsToOpen && !prevProps.wantsToOpen) {
      this.prepareOpen();
    }
    if (this.props.open && !prevProps.open) {
      this.focusBarcodeField();
    }
  }

  prepareOpen = async () => {
    const seq = ++this.loadSeq;
    this.setState({
      error: '',
      newBarcode: '',
      newNote: '',
      editingBarcode: null,
      editNote: '',
      deletingBarcode: null,
      loading: true,
      forceBarcodeLabelShrink: true,
    });
    try {
      const entries = await api.listMissingBarcodes();
      if (seq !== this.loadSeq || !this.props.wantsToOpen) return;
      this.setState({ entries, loading: false });
      this.props.onOpen();
    } catch (e) {
      if (seq !== this.loadSeq || !this.props.wantsToOpen) return;
      this.setState({ error: e.message, loading: false });
      this.props.onOpen();
    }
  };

  load = async () => {
    this.setState({ loading: true });
    try {
      const entries = await api.listMissingBarcodes();
      this.setState({ entries });
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  reload = async () => {
    try {
      const entries = await api.listMissingBarcodes();
      this.setState({ entries, error: '' });
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  findEntry = (barcode) => {
    const value = barcode.trim();
    return this.state.entries.find((entry) => entry.barcode === value) ?? null;
  };

  refocusBarcodeField = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = this.barcodeInputRef.current;
        if (!el) return;
        el.focus();
        if (el.value) {
          el.select();
        }
      });
    });
  };

  focusBarcodeField = () => {
    this.refocusBarcodeField();
  };

  focusNoteField = () => {
    requestAnimationFrame(() => {
      const el = this.noteInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    });
  };

  selectBarcodeField = () => {
    requestAnimationFrame(() => {
      const el = this.barcodeInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    });
  };

  releaseBarcodeLabelShrink = () => {
    if (this.state.forceBarcodeLabelShrink) {
      this.setState({ forceBarcodeLabelShrink: false });
    }
  };

  handleBarcodeEnter = async () => {
    const barcode = this.state.newBarcode.trim();
    if (!barcode) return;
    this.releaseBarcodeLabelShrink();
    this.setState({ error: '' });

    const existing = this.findEntry(barcode);
    if (existing) {
      this.setState({ newNote: existing.note ?? '' }, this.focusNoteField);
      return;
    }

    try {
      await api.upsertMissingBarcode(barcode, '');
      await this.reload();
      this.setState({ newNote: '' }, this.selectBarcodeField);
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  handleNoteSubmit = async () => {
    const barcode = this.state.newBarcode.trim();
    if (!barcode) return;
    this.releaseBarcodeLabelShrink();
    this.setState({ error: '' });
    try {
      await api.upsertMissingBarcode(barcode, this.state.newNote);
      await this.reload();
      this.setState({ newNote: '' }, this.selectBarcodeField);
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  startEdit = (entry) => {
    this.setState({
      editingBarcode: entry.barcode,
      editNote: entry.note ?? '',
      deletingBarcode: null,
      error: '',
    });
  };

  cancelEdit = () => {
    this.setState({ editingBarcode: null, editNote: '' }, this.refocusBarcodeField);
  };

  handleSaveEdit = async () => {
    const { editingBarcode, editNote } = this.state;
    this.setState({ error: '' });
    try {
      await api.upsertMissingBarcode(editingBarcode, editNote);
      this.setState({ editingBarcode: null, editNote: '' });
      await this.reload();
      this.refocusBarcodeField();
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  startDelete = (entry) => {
    this.setState({
      deletingBarcode: entry.barcode,
      editingBarcode: null,
      editNote: '',
      error: '',
    });
  };

  cancelDelete = () => {
    this.setState({ deletingBarcode: null }, this.refocusBarcodeField);
  };

  confirmDelete = async () => {
    const { deletingBarcode } = this.state;
    if (!deletingBarcode) return;
    this.setState({ error: '' });
    try {
      await api.removeMissingBarcode(deletingBarcode);
      this.setState({ deletingBarcode: null });
      await this.reload();
      this.refocusBarcodeField();
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  render() {
    const { open, onClose } = this.props;
    const {
      entries, newBarcode, newNote, editingBarcode, editNote, deletingBarcode, error, loading,
      forceBarcodeLabelShrink,
    } = this.state;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        TransitionProps={{ onEntered: this.focusBarcodeField }}
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 64px)',
              maxHeight: 'calc(100vh - 64px)',
            },
          },
        }}
      >
        <DialogTitle>Missing barcodes</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Barcodes scanned but not found in the catalog.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Barcode"
              value={newBarcode}
              onChange={(e) => this.setState({ newBarcode: e.target.value })}
              onBlur={this.releaseBarcodeLabelShrink}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newBarcode.trim()) {
                  e.preventDefault();
                  this.handleBarcodeEnter();
                }
              }}
              inputRef={this.barcodeInputRef}
              sx={{ flex: '1 1 160px', minWidth: 140 }}
              slotProps={withNoAutofill(
                forceBarcodeLabelShrink ? { inputLabel: { shrink: true } } : {},
              )}
            />
            <TextField
              size="small"
              label="Note (optional)"
              value={newNote}
              onChange={(e) => this.setState({ newNote: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newBarcode.trim()) {
                  e.preventDefault();
                  this.handleNoteSubmit();
                }
              }}
              inputRef={this.noteInputRef}
              sx={{ flex: '2 1 200px', minWidth: 160 }}
              slotProps={withNoAutofill()}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={this.handleNoteSubmit}
              disabled={!newBarcode.trim()}
              sx={{ flexShrink: 0, alignSelf: 'center' }}
            >
              Add
            </Button>
          </Box>
          {error ? (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          ) : null}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="35%">Barcode</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="right" width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3}>Loading…</TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>
                    No missing barcodes yet. Scan an unknown barcode or add one above.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.barcode} sx={dataRowSx}>
                    <TableCell sx={monoSx}>{entry.barcode}</TableCell>
                    <TableCell>
                      {editingBarcode === entry.barcode ? (
                        <TextField
                          size="small"
                          variant="standard"
                          fullWidth
                          value={editNote}
                          onChange={(e) => this.setState({ editNote: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') this.handleSaveEdit();
                            if (e.key === 'Escape') this.cancelEdit();
                          }}
                          autoFocus
                          placeholder="Note (optional)"
                          sx={inlineEditFieldSx}
                          slotProps={withNoAutofill()}
                        />
                      ) : (
                        entry.note || <Typography component="span" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingBarcode === entry.barcode ? (
                        <>
                          <IconButton size="small" onClick={this.handleSaveEdit}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={this.cancelEdit}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : deletingBarcode === entry.barcode ? (
                        <>
                          <IconButton size="small" color="error" onClick={this.confirmDelete}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={this.cancelDelete}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton size="small" onClick={() => this.startEdit(entry)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => this.startDelete(entry)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
