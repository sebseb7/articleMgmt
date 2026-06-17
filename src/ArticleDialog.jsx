import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, FormControlLabel, Switch, Typography, Box, IconButton, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Tooltip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { hasUuid } from './uuid.js';
import NewBadge from './NewBadge.jsx';

export const blankArticle = () => ({
  item_uuid: '',
  item_name: '',
  tax_rate: 19,
  category_id: '',
  image_url: '',
  visible_online: false,
  track_inventory: false,
  seo_title: '',
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
    seo_title: data.seo_title || '',
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

export default function ArticleDialog({ open, initial, categories, onManageCategories, onClose, onSave }) {
  const [form, setForm] = useState(blankArticle());
  const [initialSnapshot, setInitialSnapshot] = useState('');

  useEffect(() => {
    if (open) {
      const nextForm = buildFormState(initial);
      setForm(nextForm);
      setInitialSnapshot(formSnapshot(nextForm));
    }
  }, [open, initial]);

  const isDirty = useMemo(
    () => open && initialSnapshot !== '' && formSnapshot(form) !== initialSnapshot,
    [open, form, initialSnapshot]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  const hasVariations = form.variations.length > 0;

  const setVar = (idx, k, value) =>
    setForm((f) => {
      const variations = f.variations.slice();
      variations[idx] = { ...variations[idx], [k]: value };
      return { ...f, variations };
    });

  const addVar = () =>
    setForm((f) => ({ ...f, variations: [...f.variations, blankVariation()] }));

  const removeVar = (idx) =>
    setForm((f) => ({ ...f, variations: f.variations.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    const payload = {
      ...form,
      tax_rate: num(form.tax_rate),
      // Standalone-only fields are ignored by the backend export when variations exist,
      // but we still send what the user typed.
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
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Item name" fullWidth value={form.item_name} onChange={set('item_name')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Tax rate (%)" type="number" fullWidth value={form.tax_rate} onChange={set('tax_rate')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="article-category-label">Category</InputLabel>
              <Select
                labelId="article-category-label"
                label="Category"
                value={form.category_id === null || form.category_id === undefined ? '' : form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
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
          <Grid item xs={12} sm={6}>
            <TextField label="SEO title" fullWidth value={form.seo_title} onChange={set('seo_title')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Image URL" fullWidth value={form.image_url} onChange={set('image_url')} />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel control={<Switch checked={form.visible_online} onChange={setBool('visible_online')} />} label="Visible online" />
            <FormControlLabel control={<Switch checked={form.track_inventory} onChange={setBool('track_inventory')} />} label="Track inventory" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {!hasVariations && (
          <>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Standalone pricing (used because there are no variations)
              {!hasUuid(form.variant_uuid) && <NewBadge />}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={6} sm={3}>
                <TextField label="Price" type="number" fullWidth value={form.price} onChange={set('price')} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Quantity" type="number" fullWidth value={form.quantity} onChange={set('quantity')} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Low stock" type="number" fullWidth value={form.low_threshold} onChange={set('low_threshold')} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label="Barcode" fullWidth value={form.barcode} onChange={set('barcode')} />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="overline" color="text.secondary">
            Variations {hasVariations ? `(${form.variations.length})` : '— none, article is standalone'}
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addVar}>
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
                  <TableCell><TextField variant="standard" value={v.variation_name} onChange={(e) => setVar(i, 'variation_name', e.target.value)} /></TableCell>
                  <TableCell>{!hasUuid(v.variant_uuid) && <NewBadge />}</TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={v.price ?? ''} onChange={(e) => setVar(i, 'price', e.target.value)} sx={{ width: 80 }} /></TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={v.quantity ?? ''} onChange={(e) => setVar(i, 'quantity', e.target.value)} sx={{ width: 60 }} /></TableCell>
                  <TableCell align="right"><TextField variant="standard" type="number" value={v.low_threshold ?? ''} onChange={(e) => setVar(i, 'low_threshold', e.target.value)} sx={{ width: 60 }} /></TableCell>
                  <TableCell><TextField variant="standard" value={v.barcode ?? ''} onChange={(e) => setVar(i, 'barcode', e.target.value)} /></TableCell>
                  <TableCell>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeVar(i)}><DeleteIcon fontSize="small" /></IconButton>
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
          onClick={handleSave}
          disabled={!form.item_name.trim()}
          sx={isDirty ? { fontWeight: 700, boxShadow: 3 } : undefined}
        >
          {isDirty ? 'Save changes' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
