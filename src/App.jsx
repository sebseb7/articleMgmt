import { Component, createRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Paper, TextField,
  InputAdornment, IconButton, Tooltip, FormControlLabel, Switch,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CategoryIcon from '@mui/icons-material/Category';
import { api } from './api.js';
import ArticleDialog from './ArticleDialog.jsx';
import CategoryDialog from './CategoryDialog.jsx';
import ArticlesPaper from './ArticlesPaper.jsx';
import CategoryFilterChips from './CategoryFilterChips.jsx';
import { theme } from './theme.js';
import {
  DEFAULT_PAGE_SIZE, effectiveSearchQuery, categoryFilterKey, categoryFiltersEqual, mediaQueryString,
} from './articleTableUtils.js';

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
    categoryFilters: [],
    categoryCounts: [],
    missingBarcodeOnly: false,
    dialog: { open: false, initial: null },
    categoriesOpen: false,
    categories: [],
    isMobile: false,
    barcodeCapture: null,
    barcodeCaptureBuffer: '',
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
    const { page, pageSize, search, query, dialog } = this.state;

    if (
      prevState.pageSize !== pageSize
      || prevState.search !== search
      || !categoryFiltersEqual(prevState.categoryFilters, this.state.categoryFilters)
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

    if (prevState.dialog.open && !dialog.open && !this.state.isMobile) {
      this.searchRef.current?.focus({ preventScroll: true });
    }

    if (
      (!prevState.dialog.open && dialog.open)
      || (prevState.dialog.open && !dialog.open)
      || prevState.page !== page
      || prevState.search !== search
    ) {
      this.cancelBarcodeCapture();
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
    enqueueSnackbar(message, { variant: severity });
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

  cancelBarcodeCapture = () => {
    if (!this.state.barcodeCapture && !this.state.barcodeCaptureBuffer) return;
    this.setState({ barcodeCapture: null, barcodeCaptureBuffer: '' });
  };

  startBarcodeCapture = (articleId, variationId = null) => {
    const { barcodeCapture } = this.state;
    const sameTarget = barcodeCapture
      && barcodeCapture.articleId === articleId
      && barcodeCapture.variationId === variationId;
    if (sameTarget) {
      this.cancelBarcodeCapture();
      return;
    }
    this.setState({
      barcodeCapture: { articleId, variationId },
      barcodeCaptureBuffer: '',
    });
  };

  updateArticleBarcodeInState = (articleId, variationId, barcode) => {
    this.setState((prev) => ({
      articles: prev.articles.map((article) => {
        if (article.id !== articleId) return article;
        if (variationId != null) {
          return {
            ...article,
            variations: (article.variations || []).map((variation) => (
              variation.id === variationId ? { ...variation, barcode } : variation
            )),
          };
        }
        return { ...article, barcode };
      }),
    }));
  };

  commitBarcodeCapture = async () => {
    const { barcodeCapture, barcodeCaptureBuffer } = this.state;
    if (!barcodeCapture) return;

    const barcode = barcodeCaptureBuffer.trim();
    const { articleId, variationId } = barcodeCapture;
    try {
      await api.assignBarcode(articleId, { barcode: barcode || null, variationId });
      this.updateArticleBarcodeInState(articleId, variationId, barcode || null);
      this.cancelBarcodeCapture();
      this.notify(barcode ? 'Barcode saved.' : 'Barcode cleared.');
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  addCategoryFilter = (filterKey) => {
    this.setState((prev) => {
      if (prev.categoryFilters.includes(filterKey)) return null;
      return { categoryFilters: [...prev.categoryFilters, filterKey], page: 0 };
    });
  };

  removeCategoryFilter = (filterKey) => {
    this.setState((prev) => ({
      categoryFilters: prev.categoryFilters.filter((key) => key !== filterKey),
      page: 0,
    }));
  };

  applyListResult = (seq, result) => {
    if (seq !== this.loadSeq) return;
    this.setState({
      articles: result.articles,
      total: result.total,
      pageSize: result.pageSize,
      stats: result.stats,
      categoryCounts: result.categoryCounts,
      loading: false,
    });
  };

  load = async (
    nextPage = this.state.page,
    nextPageSize = this.state.pageSize,
    nextSearch = this.state.search,
    nextMissingBarcodeOnly = this.state.missingBarcodeOnly,
    nextCategoryFilters = this.state.categoryFilters,
  ) => {
    const seq = ++this.loadSeq;
    if (this.state.articles.length === 0) {
      this.setState({ loading: true });
    }
    try {
      const res = await api.list({
        page: nextPage + 1,
        pageSize: nextPageSize,
        q: nextSearch,
        missingBarcode: nextMissingBarcodeOnly,
        categoryIds: nextCategoryFilters,
      });
      if (seq !== this.loadSeq) return;

      const counts = res.categoryCounts ?? [];
      const validFilters = nextCategoryFilters.filter((filterKey) =>
        counts.some((cat) => categoryFilterKey(cat.id) === filterKey),
      );
      if (!categoryFiltersEqual(validFilters, nextCategoryFilters)) {
        if (seq !== this.loadSeq) return;
        this.setState({ categoryFilters: validFilters });
        await this.load(nextPage, nextPageSize, nextSearch, nextMissingBarcodeOnly, validFilters);
        return;
      }
      if (res.items.length === 0 && res.total > 0 && nextPage > 0) {
        if (seq !== this.loadSeq) return;
        const correctedPage = nextPage - 1;
        this.setState({ page: correctedPage });
        await this.load(correctedPage, nextPageSize, nextSearch, nextMissingBarcodeOnly, nextCategoryFilters);
        return;
      }
      this.applyListResult(seq, {
        articles: res.items,
        total: res.total,
        pageSize: res.pageSize,
        stats: res.stats,
        categoryCounts: counts,
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
      const { barcodeCapture } = this.state;

      if (barcodeCapture) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.commitBarcodeCapture();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.cancelBarcodeCapture();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          this.setState((prev) => ({
            barcodeCaptureBuffer: prev.barcodeCaptureBuffer.slice(0, -1),
          }));
          return;
        }
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          this.setState((prev) => ({
            barcodeCaptureBuffer: prev.barcodeCaptureBuffer + e.key,
          }));
          return;
        }
        return;
      }

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

  handlePageChange = (nextPage) => {
    this.setState({ page: nextPage });
    const { pageSize, search, missingBarcodeOnly, categoryFilters } = this.state;
    this.load(nextPage, pageSize, search, missingBarcodeOnly, categoryFilters);
  };

  handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { pageSize } = this.state;
    try {
      const text = await file.text();
      const res = await api.import(text);
      this.setState({ page: 0, search: '', query: '', categoryFilters: [] });
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

  handleFlushDb = async () => {
    if (!window.confirm('Delete all articles and variations? Categories will be kept.')) return;
    const { pageSize } = this.state;
    try {
      await api.flushDb();
      this.setState({ page: 0, search: '', query: '', categoryFilters: [] });
      this.cancelBarcodeCapture();
      await this.load(0, pageSize, '');
      this.notify('Database flushed.');
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  render() {
    const { user, onLogout } = this.props;
    const {
      articles, total, page, pageSize, stats, loading, query, search,
      missingBarcodeOnly, categoryFilters, categoryCounts,
      dialog, categoriesOpen, categories, isMobile,
      barcodeCapture, barcodeCaptureBuffer,
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
                  <Tooltip title="Flush DB">
                    <IconButton color="inherit" onClick={this.handleFlushDb}>
                      <DeleteSweepIcon />
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
                  <Button color="inherit" startIcon={<DeleteSweepIcon />} onClick={this.handleFlushDb}>
                    Flush DB
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
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
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
            <CategoryFilterChips
              categoryCounts={categoryCounts}
              categoryFilters={categoryFilters}
              onAddCategoryFilter={this.addCategoryFilter}
              onRemoveCategoryFilter={this.removeCategoryFilter}
            />
          </Box>

          <Paper variant="outlined" sx={{ position: 'relative' }}>
            <ArticlesPaper
              articles={articles}
              total={total}
              page={page}
              pageSize={pageSize}
              loading={loading}
              search={search}
              isMobile={isMobile}
              missingBarcodeOnly={missingBarcodeOnly}
              categoryFilters={categoryFilters}
              categoryCounts={categoryCounts}
              barcodeCapture={barcodeCapture}
              barcodeCaptureBuffer={barcodeCaptureBuffer}
              onStartBarcodeCapture={this.startBarcodeCapture}
              onEdit={(art) => this.setState({ dialog: { open: true, initial: art } })}
              onDelete={this.handleDelete}
              onPageChange={this.handlePageChange}
              onPageSizeChange={this.handlePageSizeChange}
            />
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
      </Box>
    );
  }
}

export default App;
