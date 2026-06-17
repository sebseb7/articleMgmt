import { useEffect, useRef, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Paper, Table, TableHead,
  TableBody, TableRow, TableCell, IconButton, Collapse, Chip, TextField,
  InputAdornment, Snackbar, Alert, CircularProgress, TableContainer, Tooltip,
  Pagination, Select, MenuItem, useMediaQuery, useTheme,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LogoutIcon from '@mui/icons-material/Logout';
import CategoryIcon from '@mui/icons-material/Category';
import { api } from './api.js';
import ArticleDialog from './ArticleDialog.jsx';
import CategoryDialog from './CategoryDialog.jsx';
import { hasUuid } from './uuid.js';
import NewBadge from './NewBadge.jsx';

const money = (v) => (v === null || v === undefined ? '—' : Number(v).toFixed(2));

const MIN_SEARCH_CHARS = 3;
const DEFAULT_PAGE_SIZE = 25;

function compactLength(text) {
  return text.replace(/\s/g, '').length;
}

function effectiveSearchQuery(query) {
  return compactLength(query) >= MIN_SEARCH_CHARS ? query.trim() : '';
}

function ArticleRow({ article, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const variations = article.variations || [];
  const hasVar = variations.length > 0;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(article)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
        <TableCell padding="checkbox">
          {hasVar && (
            <IconButton size="small" onClick={() => setOpen((o) => !o)}>
              {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={600}>{article.item_name}</Typography>
            {!hasUuid(article.item_uuid) && <NewBadge />}
          </Box>
        </TableCell>
        <TableCell>{article.category && <Chip size="small" label={article.category} />}</TableCell>
        <TableCell align="right">{article.tax_rate != null ? `${Number(article.tax_rate).toFixed(0)}%` : '—'}</TableCell>
        <TableCell align="right">
          {hasVar ? <Chip size="small" variant="outlined" label={`${variations.length} variations`} /> : money(article.price)}
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {hasVar ? '—' : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start' }}>
              <span>{article.barcode || '—'}</span>
              {!hasUuid(article.variant_uuid) && <NewBadge />}
            </Box>
          )}
        </TableCell>
        <TableCell align="center">{article.visible_online ? <Chip size="small" color="primary" variant="outlined" label="online" /> : '—'}</TableCell>
        <TableCell align="right">
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(article)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      {hasVar && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ m: 1, ml: { xs: 1, sm: 6 } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Variation</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Low</TableCell>
                      <TableCell>Barcode</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variations.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {v.variation_name}
                            {!hasUuid(v.variant_uuid) && <NewBadge />}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{money(v.price)}</TableCell>
                        <TableCell align="right">{v.quantity ?? '—'}</TableCell>
                        <TableCell align="right">{v.low_threshold ?? '—'}</TableCell>
                        <TableCell>{v.barcode || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function TableNavigation({ page, pageSize, total, onPageChange, onPageSizeChange, edge = 'bottom', compact = false }) {
  const borderSx = edge === 'top'
    ? { borderBottom: 1, borderColor: 'divider' }
    : { borderTop: 1, borderColor: 'divider' };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: compact ? 'column' : { xs: 'column', sm: 'row' },
        alignItems: compact ? 'stretch' : { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        px: { xs: 1, sm: 2 },
        py: 1.5,
        ...borderSx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Rows per page
        </Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
        <Typography variant="body2" color="text.secondary">
          {total === 0
            ? '0 items'
            : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}`}
        </Typography>
      </Box>
      <Pagination
        count={Math.max(1, Math.ceil(total / pageSize))}
        page={page + 1}
        onChange={(_, nextPage) => onPageChange(nextPage - 1)}
        showFirstButton
        showLastButton
        siblingCount={compact ? 0 : 1}
        boundaryCount={compact ? 1 : 1}
        color="primary"
        disabled={total === 0}
        size={compact ? 'small' : 'medium'}
        sx={{ alignSelf: compact ? 'center' : { xs: 'center', sm: 'auto' } }}
      />
    </Box>
  );
}

export default function App({ user, onLogout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [stats, setStats] = useState({ articles: 0, variations: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);
  const searchRef = useRef(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const notify = (message, severity = 'success') => setToast({ message, severity });

  const handleAuthError = (e) => {
    if (e.status === 401) {
      onLogout();
      return true;
    }
    return false;
  };

  const applySearch = (text) => {
    const nextSearch = effectiveSearchQuery(text);
    setPage(0);
    setSearch(nextSearch);
  };

  const selectSearchText = () => {
    const input = searchRef.current;
    if (!input) return;
    input.focus();
    input.select();
  };

  const loadCategories = async () => {
    try {
      setCategories(await api.listCategories());
    } catch (e) {
      if (!handleAuthError(e)) notify(e.message, 'error');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const load = async (nextPage = page, nextPageSize = pageSize, nextSearch = search) => {
    setLoading(true);
    try {
      const res = await api.list({
        page: nextPage + 1,
        pageSize: nextPageSize,
        q: nextSearch,
      });
      if (res.items.length === 0 && res.total > 0 && nextPage > 0) {
        setPage(nextPage - 1);
        return;
      }
      setArticles(res.items);
      setTotal(res.total);
      setPage(res.page - 1);
      setPageSize(res.pageSize);
      setStats(res.stats);
    } catch (e) {
      if (!handleAuthError(e)) notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, pageSize, search);
  }, [page, pageSize, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applySearch(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!dialog.open && !loading) {
      searchRef.current?.focus();
    }
  }, [dialog.open, loading]);

  useEffect(() => {
    if (dialog.open) return undefined;

    const onKeyDown = (e) => {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      const isSearchField = target === searchRef.current;

      if (isEditable && !isSearchField) return;

      if (e.key === 'Enter') {
        if (!isSearchField) {
          e.preventDefault();
          searchRef.current?.focus();
        }
        applySearch(queryRef.current);
        selectSearchText();
        return;
      }

      if (/^\d$/.test(e.key) && !isSearchField) {
        e.preventDefault();
        searchRef.current?.focus();
        setQuery((current) => current + e.key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog.open]);

  const handlePageSizeChange = (nextPageSize) => {
    setPageSize(nextPageSize);
    setPage(0);
  };

  const filtered = articles;

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const res = await api.import(text);
      setPage(0);
      setSearch('');
      setQuery('');
      await load(0, pageSize, '');
      await loadCategories();
      notify(`Imported ${res.articles} articles and ${res.variations} variations.`);
    } catch (err) {
      if (!handleAuthError(err)) notify(err.message, 'error');
    }
  };

  const handleSave = async (payload) => {
    try {
      if (dialog.initial?.id) {
        await api.update(dialog.initial.id, payload);
        notify('Article updated.');
      } else {
        await api.create(payload);
        notify('Article created.');
      }
      setDialog({ open: false, initial: null });
      await load(page, pageSize, search);
    } catch (e) {
      if (!handleAuthError(e)) notify(e.message, 'error');
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.item_name}" and its variations?`)) return;
    try {
      await api.remove(article.id);
      await load(page, pageSize, search);
      notify('Article deleted.');
    } catch (e) {
      if (!handleAuthError(e)) notify(e.message, 'error');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar
          sx={{
            gap: 1,
            flexWrap: 'wrap',
            py: { xs: 1, sm: 0 },
            minHeight: { xs: 'auto', sm: 64 },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              width: { xs: '100%', md: 'auto' },
              lineHeight: 1.3,
            }}
          >
            SumUp Article Editor
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-end', md: 'flex-start' },
            }}
          >
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleImportFile} />
            {isMobile ? (
              <>
                <Tooltip title="Import CSV">
                  <IconButton color="inherit" onClick={() => fileRef.current?.click()}>
                    <UploadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export CSV">
                  <IconButton
                    color="inherit"
                    onClick={async () => {
                      try {
                        await api.exportCsv();
                      } catch (e) {
                        if (!handleAuthError(e)) notify(e.message, 'error');
                      }
                    }}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Logout (${user.username})`}>
                  <IconButton color="inherit" onClick={onLogout}>
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button color="inherit" startIcon={<UploadIcon />} onClick={() => fileRef.current?.click()}>
                  Import CSV
                </Button>
                <Button
                  color="inherit"
                  startIcon={<DownloadIcon />}
                  onClick={async () => {
                    try {
                      await api.exportCsv();
                    } catch (e) {
                      if (!handleAuthError(e)) notify(e.message, 'error');
                    }
                  }}
                >
                  Export CSV
                </Button>
                <Typography variant="body2" sx={{ opacity: 0.9, mx: 0.5 }}>
                  {user.username}
                </Typography>
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            inputRef={searchRef}
            size="small"
            placeholder={isMobile ? 'Search or scan barcode…' : 'Search or scan barcode (min. 3 characters)…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applySearch(query);
                selectSearchText();
              }
            }}
            sx={{
              flexGrow: 1,
              width: '100%',
              maxWidth: { xs: 'none', sm: 420 },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              {stats.articles} articles · {stats.variations} variations
            </Typography>
            {isMobile ? (
              <Tooltip title="Categories">
                <IconButton onClick={() => setCategoriesOpen(true)} color="primary">
                  <CategoryIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => setCategoriesOpen(true)}
                sx={{ flexShrink: 0 }}
              >
                Categories
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialog({ open: true, initial: null })}
              sx={{ flexShrink: 0 }}
            >
              {isMobile ? 'New' : 'New article'}
            </Button>
          </Box>
        </Box>

        <Paper variant="outlined">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>
                {search
                  ? `No articles match "${search}".`
                  : 'No articles. Import a CSV or create one.'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableNavigation
                edge="top"
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                compact={isMobile}
              />
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small" sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell padding="checkbox" />
                      <TableCell>Item name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Price / Variations</TableCell>
                      <TableCell>Barcode</TableCell>
                      <TableCell align="center">Online</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((a) => (
                      <ArticleRow key={a.id} article={a} onEdit={(art) => setDialog({ open: true, initial: art })} onDelete={handleDelete} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TableNavigation
                edge="bottom"
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                compact={isMobile}
              />
            </>
          )}
        </Paper>
      </Container>

      <ArticleDialog
        open={dialog.open}
        initial={dialog.initial}
        categories={categories}
        onManageCategories={() => setCategoriesOpen(true)}
        onClose={() => setDialog({ open: false, initial: null })}
        onSave={handleSave}
      />

      <CategoryDialog
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        onChanged={async () => {
          await loadCategories();
          await load(page, pageSize, search);
        }}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} variant="filled">{toast.message}</Alert>}
      </Snackbar>
    </Box>
  );
}
