import { Component, createRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Box, Typography, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { api } from './api.js';
import { money, formatPriceInput, parsePriceInput } from './articleTableUtils.js';
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

const actionGlyphSx = {
  fontSize: '0.95rem',
  fontWeight: 600,
  lineHeight: 1,
};

const priceInputPattern = /^[\d.,]*$/;

class MissingPriceEditCell extends Component {
  inputRef = createRef();

  state = {
    price: formatPriceInput(this.props.initialPrice),
  };

  componentDidMount() {
    requestAnimationFrame(() => {
      const el = this.inputRef.current;
      if (!el) return;
      el.focus();
      if (el.value) el.select();
    });
  }

  handleChange = (e) => {
    const { value } = e.target;
    if (value !== '' && !priceInputPattern.test(value)) return;
    this.setState({ price: value });
  };

  handleKeyDown = (e) => {
    if (e.key === 'Enter') this.props.onSave(this.state.price);
    if (e.key === 'Escape') this.props.onCancel();
  };

  render() {
    const { price } = this.state;
    const { onSave, onCancel } = this.props;

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          size="small"
          variant="standard"
          value={price}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          placeholder="Price"
          sx={{ ...inlineEditFieldSx, width: '7rem' }}
          inputRef={this.inputRef}
          slotProps={withNoAutofill()}
        />
        <IconButton size="small" onClick={() => onSave(price)} aria-label="Save price">
          <CheckIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onCancel} aria-label="Cancel price edit">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }
}

export default class MissingListDialog extends Component {
  barcodeInputRef = createRef();
  noteInputRef = createRef();
  noteEditInputRef = createRef();

  state = {
    entries: [],
    newBarcode: '',
    newNote: '',
    editingBarcode: null,
    editNote: '',
    editingPriceBarcode: null,
    deletingBarcode: null,
    error: '',
    loading: false,
    forceBarcodeLabelShrink: true,
    lookupLoading: {},
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
      editingPriceBarcode: null,
      deletingBarcode: null,
      loading: true,
      forceBarcodeLabelShrink: true,
      lookupLoading: {},
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

  setLookupLoading = (barcode, loading) => {
    this.setState((prev) => {
      const lookupLoading = { ...prev.lookupLoading };
      if (loading) {
        lookupLoading[barcode] = true;
      } else {
        delete lookupLoading[barcode];
      }
      return { lookupLoading };
    });
  };

  handleLookupProduct = async (entry) => {
    const { barcode } = entry;
    this.setState({ error: '' });
    this.setLookupLoading(barcode, true);
    try {
      const { productName } = await api.lookupMissingProductName(barcode);
      if (!productName) {
        this.setState({ error: `No product name found for ${barcode}.` });
        return;
      }
      await api.upsertMissingBarcode(barcode, productName);
      await this.reload();
    } catch (e) {
      if (this.isCatalogBarcodeError(e)) {
        await this.reload();
        return;
      }
      this.setState({ error: e.message });
    } finally {
      this.setLookupLoading(barcode, false);
    }
  };

  renderPriceCell = (entry) => {
    const { editingPriceBarcode } = this.state;

    if (editingPriceBarcode === entry.barcode) {
      return (
        <MissingPriceEditCell
          key={entry.barcode}
          initialPrice={entry.price}
          onSave={this.handleSavePriceEdit}
          onCancel={this.cancelPriceEdit}
        />
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {money(entry.price)}
        </Box>
        <IconButton
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => this.startPriceEdit(entry)}
          aria-label="Edit price"
        >
          <Typography component="span" sx={actionGlyphSx}>€</Typography>
        </IconButton>
      </Box>
    );
  };

  renderNoteCell = (entry) => {
    const { editingBarcode, editNote, lookupLoading } = this.state;

    if (editingBarcode === entry.barcode) {
      return (
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
          placeholder="Note (optional)"
          sx={inlineEditFieldSx}
          inputRef={this.noteEditInputRef}
          slotProps={withNoAutofill()}
        />
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {entry.note || <Typography component="span" color="text.secondary">—</Typography>}
        </Box>
        <IconButton
          size="small"
          onClick={() => this.handleLookupProduct(entry)}
          disabled={!!lookupLoading[entry.barcode]}
          aria-label="Look up product name"
        >
          {lookupLoading[entry.barcode]
            ? <CircularProgress size={16} />
            : <SearchIcon fontSize="small" />}
        </IconButton>
      </Box>
    );
  };

  findEntry = (barcode) => {
    const value = barcode.trim();
    return this.state.entries.find((entry) => entry.barcode === value) ?? null;
  };

  ignoreCatalogBarcode = () => {
    this.setState({ newBarcode: '', newNote: '', error: '' }, this.refocusBarcodeField);
  };

  isCatalogBarcodeError = (e) => e.code === 'barcode_in_catalog';

  focusNoteEditField = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = this.noteEditInputRef.current;
        if (!el) return;
        el.focus();
        if (el.value) {
          el.select();
        }
      });
    });
  };

  refocusBarcodeField = () => {
    if (this.state.editingPriceBarcode || this.state.editingBarcode) return;
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
    try {
      const entry = await api.upsertMissingBarcode(barcode, existing?.note ?? '');
      await this.reload();
      if (existing) {
        this.setState({ newNote: entry.note ?? '' }, this.focusNoteField);
      } else {
        this.setState({ newNote: '' }, this.selectBarcodeField);
      }
    } catch (e) {
      if (this.isCatalogBarcodeError(e)) {
        this.ignoreCatalogBarcode();
        return;
      }
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
      if (this.isCatalogBarcodeError(e)) {
        this.ignoreCatalogBarcode();
        return;
      }
      this.setState({ error: e.message });
    }
  };

  startEdit = (entry) => {
    this.setState({
      editingBarcode: entry.barcode,
      editNote: entry.note ?? '',
      editingPriceBarcode: null,
      deletingBarcode: null,
      error: '',
    }, this.focusNoteEditField);
  };

  startPriceEdit = (entry) => {
    this.setState({
      editingPriceBarcode: entry.barcode,
      editingBarcode: null,
      editNote: '',
      deletingBarcode: null,
      error: '',
    });
  };

  cancelPriceEdit = () => {
    this.setState({ editingPriceBarcode: null }, this.refocusBarcodeField);
  };

  handleSavePriceEdit = async (editPrice) => {
    const { editingPriceBarcode } = this.state;
    this.setState({ error: '' });
    try {
      const price = parsePriceInput(editPrice);
      await api.upsertMissingBarcode(editingPriceBarcode, undefined, price);
      this.setState({ editingPriceBarcode: null });
      await this.reload();
      this.refocusBarcodeField();
    } catch (e) {
      if (this.isCatalogBarcodeError(e)) {
        this.setState({ editingPriceBarcode: null }, this.refocusBarcodeField);
        return;
      }
      this.setState({ error: e.message });
    }
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
      if (this.isCatalogBarcodeError(e)) {
        this.setState({ editingBarcode: null, editNote: '' }, this.refocusBarcodeField);
        return;
      }
      this.setState({ error: e.message });
    }
  };

  startDelete = (entry) => {
    this.setState({
      deletingBarcode: entry.barcode,
      editingBarcode: null,
      editNote: '',
      editingPriceBarcode: null,
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
      entries, newBarcode, newNote, editingBarcode, editingPriceBarcode,
      deletingBarcode, error, loading,
      forceBarcodeLabelShrink,
    } = this.state;

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          transition: { onEntered: this.focusBarcodeField },
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
                <TableCell width="30%">Barcode</TableCell>
                <TableCell width="15%">Price</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="right" width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading…</TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>
                    No missing barcodes yet. Scan an unknown barcode or add one above.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const isEditingPrice = editingPriceBarcode === entry.barcode;
                  return (
                  <TableRow key={entry.barcode} sx={dataRowSx}>
                    <TableCell sx={monoSx}>{entry.barcode}</TableCell>
                    {isEditingPrice ? (
                      <TableCell colSpan={2}>
                        {this.renderPriceCell(entry)}
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          {this.renderPriceCell(entry)}
                        </TableCell>
                        <TableCell>
                          {this.renderNoteCell(entry)}
                        </TableCell>
                      </>
                    )}
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
                          <IconButton size="small" onClick={() => this.startEdit(entry)} aria-label="Edit note">
                            <Typography component="span" sx={actionGlyphSx}>A</Typography>
                          </IconButton>
                          <IconButton size="small" onClick={() => this.startDelete(entry)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
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
