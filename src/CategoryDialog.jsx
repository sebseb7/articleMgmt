import { Component } from 'react';
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

export default class CategoryDialog extends Component {
  state = {
    categories: [],
    newName: '',
    editingId: null,
    editName: '',
    error: '',
    loading: false,
  };

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState({
        error: '',
        newName: '',
        editingId: null,
      });
      this.load();
    }
  }

  load = async () => {
    this.setState({ loading: true });
    try {
      const categories = await api.listCategories();
      this.setState({ categories });
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  notifyChanged = async () => {
    await this.load();
    this.props.onChanged?.();
  };

  handleAdd = async () => {
    const { newName } = this.state;
    this.setState({ error: '' });
    try {
      await api.createCategory(newName);
      this.setState({ newName: '' });
      await this.notifyChanged();
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  startEdit = (cat) => {
    this.setState({ editingId: cat.id, editName: cat.name, error: '' });
  };

  cancelEdit = () => {
    this.setState({ editingId: null, editName: '' });
  };

  handleSaveEdit = async () => {
    const { editingId, editName } = this.state;
    this.setState({ error: '' });
    try {
      await api.updateCategory(editingId, editName);
      this.setState({ editingId: null, editName: '' });
      await this.notifyChanged();
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    this.setState({ error: '' });
    try {
      await api.removeCategory(cat.id);
      await this.notifyChanged();
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  render() {
    const { open, onClose } = this.props;
    const { categories, newName, editingId, editName, error, loading } = this.state;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Categories</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              label="New category"
              fullWidth
              value={newName}
              onChange={(e) => this.setState({ newName: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && newName.trim() && this.handleAdd()}
              slotProps={withNoAutofill()}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={this.handleAdd}
              disabled={!newName.trim()}
              sx={{ flexShrink: 0 }}
            >
              Add
            </Button>
          </Box>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right" width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2}>Loading…</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
                    No categories yet. Import a CSV or add one above.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      {editingId === cat.id ? (
                        <TextField
                          size="small"
                          fullWidth
                          value={editName}
                          onChange={(e) => this.setState({ editName: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') this.handleSaveEdit();
                            if (e.key === 'Escape') this.cancelEdit();
                          }}
                          autoFocus
                          slotProps={withNoAutofill()}
                        />
                      ) : (
                        cat.name
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editingId === cat.id ? (
                        <>
                          <IconButton size="small" onClick={this.handleSaveEdit}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={this.cancelEdit}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton size="small" onClick={() => this.startEdit(cat)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => this.handleDelete(cat)}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}
