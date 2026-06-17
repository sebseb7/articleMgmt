import { Component, createRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Paper, Table, TableHead,
  TableBody, TableRow, TableCell, IconButton, Collapse, Chip, TextField,
  InputAdornment, Snackbar, Alert, CircularProgress, TableContainer, Tooltip,
  Pagination, Select, MenuItem, FormControlLabel, Switch,
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
import { theme } from './theme.js';

const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const money = (v) => (v === null || v === undefined ? '—' : euroFormat.format(Number(v)));

const MIN_SEARCH_CHARS = 3;
const DEFAULT_PAGE_SIZE = 25;
const TABLE_ROW_HEIGHT = 42;
const TABLE_HEADER_HEIGHT = 48;

function compactLength(text) {
  return text.replace(/\s/g, '').length;
}

function effectiveSearchQuery(query) {
  return compactLength(query) >= MIN_SEARCH_CHARS ? query.trim() : '';
}

function mediaQueryString(theme, key) {
  return theme.breakpoints[key]('sm').replace(/^@media\s*/, '');
}

function hasMissingVariantBarcode(variations) {
  return variations.some((v) => !String(v.barcode ?? '').trim());
}

function articleBarcodeLabel(article) {
  const variations = article.variations || [];
  const hasVar = variations.length > 0;
  const articleBarcode = String(article.barcode ?? '').trim();

  if (hasVar) {
    if (!articleBarcode && hasMissingVariantBarcode(variations)) {
      return 'missing';
    }
    return '—';
  }

  return articleBarcode || '—';
}

class ArticleRow extends Component {
  state = { open: false };

  toggleOpen = () => {
    this.setState((prev) => ({ open: !prev.open }));
  };

  render() {
    const { article, onEdit, onDelete } = this.props;
    const { open } = this.state;
    const variations = article.variations || [];
    const hasVar = variations.length > 0;
    const barcodeLabel = articleBarcodeLabel(article);

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
              <IconButton size="small" onClick={this.toggleOpen}>
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
            {hasVar ? barcodeLabel : (
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
}

class TableNavigation extends Component {
  render() {
    const { page, pageSize, total, loading, onPageChange, onPageSizeChange, edge = 'bottom', compact = false } = this.props;
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
          disabled={total === 0 || loading}
          size={compact ? 'small' : 'medium'}
          sx={{ alignSelf: compact ? 'center' : { xs: 'center', sm: 'auto' } }}
        />
      </Box>
    );
  }
}

class App extends Component {
  state = {
    articles: [],
    total: 0,
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    stats: { articles: 0, variations: 0 },
    loading: true,
    query: '',
    search: '',
    missingBarcodeOnly: false,
    dialog: { open: false, initial: null },
    categoriesOpen: false,
    categories: [],
    toast: null,
    isMobile: false,
  };

  fileRef = createRef();
  searchRef = createRef();
  loadSeq = 0;

  componentDidMount() {
    this.mediaQueryList = window.matchMedia(mediaQueryString(theme, 'down'));
    this.setState({ isMobile: this.mediaQueryList.matches });
    this.mediaQueryList.addEventListener('change', this.handleMediaChange);

    this.loadCategories();
    this.load(this.state.page, this.state.pageSize, this.state.search);
    this.setupKeydownListener();
  }

  componentDidUpdate(prevProps, prevState) {
    const { page, pageSize, search, query, dialog, loading } = this.state;

    if (
      prevState.page !== page
      || prevState.pageSize !== pageSize
      || prevState.search !== search
      || prevState.missingBarcodeOnly !== this.state.missingBarcodeOnly
    ) {
      this.load(page, pageSize, search);
    }

    if (prevState.query !== query) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = window.setTimeout(() => {
        this.applySearch(this.state.query);
      }, 250);
    }

    if (
      (prevState.dialog.open !== dialog.open || prevState.loading !== loading)
      && !dialog.open
      && !loading
    ) {
      this.searchRef.current?.focus({ preventScroll: true });
    }

    if (prevState.dialog.open !== dialog.open) {
      this.teardownKeydownListener();
      this.setupKeydownListener();
    }
  }

  componentWillUnmount() {
    this.mediaQueryList?.removeEventListener('change', this.handleMediaChange);
    clearTimeout(this.searchDebounceTimer);
    this.teardownKeydownListener();
  }

  handleMediaChange = (e) => {
    this.setState({ isMobile: e.matches });
  };

  notify = (message, severity = 'success') => {
    this.setState({ toast: { message, severity } });
  };

  handleAuthError = (e) => {
    const { onLogout } = this.props;
    if (e.status === 401) {
      onLogout();
      return true;
    }
    return false;
  };

  applySearch = (text) => {
    const nextSearch = effectiveSearchQuery(text);
    this.setState({ page: 0, search: nextSearch });
  };

  selectSearchText = () => {
    const input = this.searchRef.current;
    if (!input) return;
    input.focus();
    input.select();
  };

  loadCategories = async () => {
    try {
      const categories = await api.listCategories();
      this.setState({ categories });
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  load = async (
    nextPage = this.state.page,
    nextPageSize = this.state.pageSize,
    nextSearch = this.state.search,
    nextMissingBarcodeOnly = this.state.missingBarcodeOnly,
  ) => {
    const seq = ++this.loadSeq;
    this.setState({ loading: true });
    try {
      const res = await api.list({
        page: nextPage + 1,
        pageSize: nextPageSize,
        q: nextSearch,
        missingBarcode: nextMissingBarcodeOnly,
      });
      if (seq !== this.loadSeq) return;
      if (res.items.length === 0 && res.total > 0 && nextPage > 0) {
        this.setState({ page: nextPage - 1, loading: false });
        return;
      }
      this.setState({
        articles: res.items,
        total: res.total,
        page: res.page - 1,
        pageSize: res.pageSize,
        stats: res.stats,
        loading: false,
      });
    } catch (e) {
      if (seq !== this.loadSeq) return;
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
      this.setState({ loading: false });
    }
  };

  setupKeydownListener = () => {
    if (this.state.dialog.open) return;
    this.handleKeydown = (e) => {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      const isSearchField = target === this.searchRef.current;

      if (isEditable && !isSearchField) return;

      if (e.key === 'Enter') {
        if (!isSearchField) {
          e.preventDefault();
          this.searchRef.current?.focus();
        }
        this.applySearch(this.state.query);
        this.selectSearchText();
        return;
      }

      if (/^\d$/.test(e.key) && !isSearchField) {
        e.preventDefault();
        this.searchRef.current?.focus();
        this.setState((prev) => ({ query: prev.query + e.key }));
      }
    };
    window.addEventListener('keydown', this.handleKeydown);
  };

  teardownKeydownListener = () => {
    if (this.handleKeydown) {
      window.removeEventListener('keydown', this.handleKeydown);
      this.handleKeydown = null;
    }
  };

  handlePageSizeChange = (nextPageSize) => {
    this.setState({ pageSize: nextPageSize, page: 0 });
  };

  handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { pageSize } = this.state;
    try {
      const text = await file.text();
      const res = await api.import(text);
      this.setState({ page: 0, search: '', query: '' });
      await this.load(0, pageSize, '');
      await this.loadCategories();
      this.notify(`Imported ${res.articles} articles and ${res.variations} variations.`);
    } catch (err) {
      if (!this.handleAuthError(err)) this.notify(err.message, 'error');
    }
  };

  handleSave = async (payload) => {
    const { dialog, page, pageSize, search } = this.state;
    try {
      if (dialog.initial?.id) {
        await api.update(dialog.initial.id, payload);
        this.notify('Article updated.');
      } else {
        await api.create(payload);
        this.notify('Article created.');
      }
      this.setState({ dialog: { open: false, initial: null } });
      await this.load(page, pageSize, search);
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.item_name}" and its variations?`)) return;
    const { page, pageSize, search } = this.state;
    try {
      await api.remove(article.id);
      await this.load(page, pageSize, search);
      this.notify('Article deleted.');
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  handleExport = async () => {
    try {
      await api.exportCsv();
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  renderArticlesPaper() {
    const {
      articles, total, page, pageSize, loading, search, isMobile, missingBarcodeOnly,
    } = this.state;
    const showEmptyState = !loading && total === 0;
    const isInitialLoad = loading && articles.length === 0;
    const tableMinHeight = TABLE_HEADER_HEIGHT + pageSize * TABLE_ROW_HEIGHT;

    if (showEmptyState) {
      return (
        <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>
            {missingBarcodeOnly
              ? (search
                ? `No articles with missing barcodes match "${search}".`
                : 'No articles with missing barcodes.')
              : (search
                ? `No articles match "${search}".`
                : 'No articles. Import a CSV or create one.')}
          </Typography>
        </Box>
      );
    }

    if (isInitialLoad) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6, minHeight: tableMinHeight + 120 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <>
        <TableNavigation
          edge="top"
          page={page}
          pageSize={pageSize}
          total={total}
          loading={loading}
          onPageChange={(nextPage) => this.setState({ page: nextPage })}
          onPageSizeChange={this.handlePageSizeChange}
          compact={isMobile}
        />
        <TableContainer
          sx={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            minHeight: tableMinHeight,
          }}
        >
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
              {articles.map((a) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  onEdit={(art) => this.setState({ dialog: { open: true, initial: art } })}
                  onDelete={this.handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TableNavigation
          edge="bottom"
          page={page}
          pageSize={pageSize}
          total={total}
          loading={loading}
          onPageChange={(nextPage) => this.setState({ page: nextPage })}
          onPageSizeChange={this.handlePageSizeChange}
          compact={isMobile}
        />
      </>
    );
  }

  render() {
    const { user, onLogout } = this.props;
    const {
      articles, total, page, pageSize, stats, loading, query, search,
      missingBarcodeOnly, dialog, categoriesOpen, categories, toast, isMobile,
    } = this.state;

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
              <input ref={this.fileRef} type="file" accept=".csv,text/csv" hidden onChange={this.handleImportFile} />
              {isMobile ? (
                <>
                  <Tooltip title="Import CSV">
                    <IconButton color="inherit" onClick={() => this.fileRef.current?.click()}>
                      <UploadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export CSV">
                    <IconButton color="inherit" onClick={this.handleExport}>
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
                  <Button color="inherit" startIcon={<UploadIcon />} onClick={() => this.fileRef.current?.click()}>
                    Import CSV
                  </Button>
                  <Button color="inherit" startIcon={<DownloadIcon />} onClick={this.handleExport}>
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexGrow: 1,
                width: '100%',
                maxWidth: { xs: 'none', sm: 560 },
              }}
            >
              <TextField
                inputRef={this.searchRef}
                size="small"
                placeholder={isMobile ? 'Search or scan barcode…' : 'Search or scan barcode (min. 3 characters)…'}
                value={query}
                onChange={(e) => this.setState({ query: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    this.applySearch(query);
                    this.selectSearchText();
                  }
                }}
                sx={{
                  flexGrow: 1,
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
              <FormControlLabel
                control={(
                  <Switch
                    size="small"
                    checked={missingBarcodeOnly}
                    onChange={(e) => this.setState({
                      missingBarcodeOnly: e.target.checked,
                      page: 0,
                    })}
                  />
                )}
                label={isMobile ? 'Missing' : 'Missing barcode'}
                sx={{ flexShrink: 0, m: 0, whiteSpace: 'nowrap' }}
              />
            </Box>
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
                  <IconButton onClick={() => this.setState({ categoriesOpen: true })} color="primary">
                    <CategoryIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<CategoryIcon />}
                  onClick={() => this.setState({ categoriesOpen: true })}
                  sx={{ flexShrink: 0 }}
                >
                  Categories
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => this.setState({ dialog: { open: true, initial: null } })}
                sx={{ flexShrink: 0 }}
              >
                {isMobile ? 'New' : 'New article'}
              </Button>
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ position: 'relative' }}>
            {this.renderArticlesPaper()}
          </Paper>
        </Container>

        <ArticleDialog
          open={dialog.open}
          initial={dialog.initial}
          categories={categories}
          onManageCategories={() => this.setState({ categoriesOpen: true })}
          onClose={() => this.setState({ dialog: { open: false, initial: null } })}
          onSave={this.handleSave}
        />

        <CategoryDialog
          open={categoriesOpen}
          onClose={() => this.setState({ categoriesOpen: false })}
          onChanged={async () => {
            const { page, pageSize, search } = this.state;
            await this.loadCategories();
            await this.load(page, pageSize, search);
          }}
        />

        <Snackbar
          open={!!toast}
          autoHideDuration={4000}
          onClose={() => this.setState({ toast: null })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {toast && <Alert severity={toast.severity} onClose={() => this.setState({ toast: null })} variant="filled">{toast.message}</Alert>}
        </Snackbar>
      </Box>
    );
  }
}

export default App;
