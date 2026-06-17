import { Component } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControlLabel, Switch, Typography, Box, IconButton, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Tooltip,
  FormControl, InputLabel, Select, MenuItem, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { hasUuid } from './uuid.js';
import NewBadge from './NewBadge.jsx';
import { api } from './api.js';

class BarcodeField extends Component {
  state = { loading: false };

  handleGenerate = async () => {
    const { onChange } = this.props;
    this.setState({ loading: true });
    try {
      const { barcode } = await api.generateBarcode();
      onChange(barcode);
    } catch (e) {
      alert(e.message || 'Failed to generate barcode.');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { value, onChange, fullWidth, variant = 'outlined', sx } = this.props;
    const { loading } = this.state;

    return (
      <TextField
        label="Barcode"
        fullWidth={fullWidth}
        variant={variant}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={sx}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Button size="small" onClick={this.handleGenerate} disabled={loading}>
                  Generate
                </Button>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  }
}

export const blankArticle = () => ({
  item_uuid: '',
  item_name: '',
  tax_rate: 19,
  category_id: '',
  image_url: '',
  visible_online: false,
  track_inventory: false,
  price: '',
  quantity: '',
  low_threshold: '',
  barcode: '',
  variant_uuid: '',
  variations: [],
});

const blankVariation = () => ({
  variation_name: '',
  price: '',
  quantity: 0,
  low_threshold: 0,
  barcode: '',
  variant_uuid: '',
});

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

function formSnapshot(data) {
  return JSON.stringify({
    item_uuid: data.item_uuid || '',
    item_name: data.item_name || '',
    tax_rate: data.tax_rate ?? '',
    category_id: data.category_id ?? '',
    image_url: data.image_url || '',
    visible_online: !!data.visible_online,
    track_inventory: !!data.track_inventory,
    price: data.price ?? '',
    quantity: data.quantity ?? '',
    low_threshold: data.low_threshold ?? '',
    barcode: data.barcode || '',
    variant_uuid: data.variant_uuid || '',
    variations: (data.variations || []).map((v) => ({
      variation_name: v.variation_name || '',
      price: v.price ?? '',
      quantity: v.quantity ?? '',
      low_threshold: v.low_threshold ?? '',
      barcode: v.barcode || '',
      variant_uuid: v.variant_uuid || '',
    })),
  });
}

function buildFormState(base) {
  const b = base || blankArticle();
  return {
    ...blankArticle(),
    ...b,
    category_id: b.category_id ?? '',
    price: b.price ?? '',
    quantity: b.quantity ?? '',
    low_threshold: b.low_threshold ?? '',
    variations: (b.variations || []).map((v) => ({ ...v })),
  };
}

export default class ArticleDialog extends Component {
  state = {
    form: blankArticle(),
    initialSnapshot: '',
  };

  componentDidUpdate(prevProps) {
    const { open, initial } = this.props;
    if (open && (open !== prevProps.open || initial !== prevProps.initial)) {
      const nextForm = buildFormState(initial);
      this.setState({
        form: nextForm,
        initialSnapshot: formSnapshot(nextForm),
      });
    }
  }

  set = (k) => (e) => {
    this.setState((prev) => ({
      form: { ...prev.form, [k]: e.target.value },
    }));
  };

  setBool = (k) => (e) => {
    this.setState((prev) => ({
      form: { ...prev.form, [k]: e.target.checked },
    }));
  };

  setVar = (idx, k, value) => {
    this.setState((prev) => {
      const variations = prev.form.variations.slice();
      variations[idx] = { ...variations[idx], [k]: value };
      return { form: { ...prev.form, variations } };
    });
  };

  addVar = () => {
    this.setState((prev) => ({
      form: { ...prev.form, variations: [...prev.form.variations, blankVariation()] },
    }));
  };

  removeVar = (idx) => {
    this.setState((prev) => ({
      form: { ...prev.form, variations: prev.form.variations.filter((_, i) => i !== idx) },
    }));
  };

  handleSave = () => {
    const { form } = this.state;
    const { onSave } = this.props;
    const hasVariations = form.variations.length > 0;

    const payload = {
      ...form,
      tax_rate: num(form.tax_rate),
      price: hasVariations ? null : num(form.price),
      quantity: hasVariations ? null : num(form.quantity),
      low_threshold: hasVariations ? null : num(form.low_threshold),
      barcode: hasVariations ? null : form.barcode || null,
      item_uuid: form.item_uuid || null,
      category_id: form.category_id === '' ? null : Number(form.category_id),
      variant_uuid: hasVariations ? null : form.variant_uuid || null,
      variations: form.variations.map((v) => ({
        variation_name: v.variation_name,
        price: num(v.price),
        quantity: num(v.quantity),
        low_threshold: num(v.low_threshold),
        barcode: v.barcode || null,
        variant_uuid: v.variant_uuid || null,
      })),
    };
    onSave(payload);
  };

  render() {
    const { open, initial, categories, onManageCategories, onClose } = this.props;
    const { form, initialSnapshot } = this.state;

    const isDirty = open && initialSnapshot !== '' && formSnapshot(form) !== initialSnapshot;
    const hasVariations = form.variations.length > 0;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {initial?.id ? 'Edit article' : 'New article'}
          {!hasUuid(form.item_uuid) && <NewBadge />}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="overline" color="text.secondary">
            Article
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0, width: '100%' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Item name" fullWidth value={form.item_name} onChange={this.set('item_name')} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="Tax rate (%)" type="number" fullWidth value={form.tax_rate} onChange={this.set('tax_rate')} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="article-category-label">Category</InputLabel>
                <Select
                  labelId="article-category-label"
                  label="Category"
                  value={form.category_id === null || form.category_id === undefined ? '' : form.category_id}
                  onChange={(e) => this.setState((prev) => ({
                    form: { ...prev.form, category_id: e.target.value },
                  }))}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {onManageCategories && (
                <Button size="small" onClick={onManageCategories} sx={{ mt: 0.5, px: 0, minWidth: 0 }}>
                  Manage categories…
                </Button>
              )}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Image URL" fullWidth value={form.image_url} onChange={this.set('image_url')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel control={<Switch checked={form.visible_online} onChange={this.setBool('visible_online')} />} label="Visible online" />
              <FormControlLabel control={<Switch checked={form.track_inventory} onChange={this.setBool('track_inventory')} />} label="Track inventory" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {!hasVariations && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Standalone pricing (used because there are no variations)
                {!hasUuid(form.variant_uuid) && <NewBadge />}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0, width: '100%' }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField label="Price" type="number" fullWidth value={form.price} onChange={this.set('price')} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField label="Quantity" type="number" fullWidth value={form.quantity} onChange={this.set('quantity')} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField label="Low stock" type="number" fullWidth value={form.low_threshold} onChange={this.set('low_threshold')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <BarcodeField
                    fullWidth
                    value={form.barcode}
                    onChange={(barcode) => this.setState((prev) => ({
                      form: { ...prev.form, barcode },
                    }))}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="overline" color="text.secondary">
              Variations {hasVariations ? `(${form.variations.length})` : '— none, article is standalone'}
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={this.addVar}>
              Add variation
            </Button>
          </Box>

          {hasVariations && (
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell />
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Low</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {form.variations.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell><TextField variant="standard" value={v.variation_name} onChange={(e) => this.setVar(i, 'variation_name', e.target.value)} /></TableCell>
                    <TableCell>{!hasUuid(v.variant_uuid) && <NewBadge />}</TableCell>
                    <TableCell align="right"><TextField variant="standard" type="number" value={v.price ?? ''} onChange={(e) => this.setVar(i, 'price', e.target.value)} sx={{ width: 80 }} /></TableCell>
                    <TableCell align="right"><TextField variant="standard" type="number" value={v.quantity ?? ''} onChange={(e) => this.setVar(i, 'quantity', e.target.value)} sx={{ width: 60 }} /></TableCell>
                    <TableCell align="right"><TextField variant="standard" type="number" value={v.low_threshold ?? ''} onChange={(e) => this.setVar(i, 'low_threshold', e.target.value)} sx={{ width: 60 }} /></TableCell>
                    <TableCell>
                      <BarcodeField
                        variant="standard"
                        value={v.barcode ?? ''}
                        onChange={(barcode) => this.setVar(i, 'barcode', barcode)}
                        sx={{ minWidth: 180 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => this.removeVar(i)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            color={isDirty ? 'warning' : 'primary'}
            onClick={this.handleSave}
            disabled={!form.item_name.trim()}
            sx={isDirty ? { fontWeight: 700, boxShadow: 3 } : undefined}
          >
            {isDirty ? 'Save changes' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
