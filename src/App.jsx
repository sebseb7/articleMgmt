import { Component, createRef } from 'react';
import { enqueueSnackbar } from 'notistack';
import { api } from './api.js';
import ArticleDialog from './ArticleDialog.jsx';
import CategoryDialog from './CategoryDialog.jsx';
import AppShell from './AppShell.jsx';
import ImportProgressOverlay from './ImportProgressOverlay.jsx';
import { theme } from './theme.js';
import {
  DEFAULT_PAGE_SIZE, effectiveSearchQuery, categoryFilterKey, categoryFiltersEqual, mediaQueryString,
} from './articleTableUtils.js';

class App extends Component {
  state = {
    view: 'articles',
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
    changelogEntries: [],
    changelogTotal: 0,
    changelogPage: 0,
    changelogPageSize: DEFAULT_PAGE_SIZE,
    changelogLoading: false,
    importProgress: null,
  };

  searchRef = createRef();
  loadSeq = 0;
  changelogLoadSeq = 0;

  componentDidMount() {
    this.mediaQueryList = window.matchMedia(mediaQueryString(theme, 'down'));
    this.setState({ isMobile: this.mediaQueryList.matches });
    this.mediaQueryList.addEventListener('change', this.handleMediaChange);

    this.loadCategories();
    this.load(this.state.page, this.state.pageSize, this.state.search);
    this.setupKeydownListener();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      page, pageSize, search, query, dialog, categoryFilters, missingBarcodeOnly,
      view, changelogPageSize,
    } = this.state;

    if (prevState.view !== view) {
      if (view === 'changelog') {
        this.loadChangelog(this.state.changelogPage, this.state.changelogPageSize);
      }
    }

    if (view === 'changelog' && prevState.changelogPageSize !== changelogPageSize) {
      this.loadChangelog(this.state.changelogPage, changelogPageSize);
    }

    if (view === 'articles' && (
      prevState.pageSize !== pageSize
      || prevState.search !== search
      || !categoryFiltersEqual(prevState.categoryFilters, categoryFilters)
      || prevState.missingBarcodeOnly !== missingBarcodeOnly
    )) {
      const includeListMeta =
        prevState.search !== search
        || prevState.missingBarcodeOnly !== missingBarcodeOnly;
      this.load(page, pageSize, search, missingBarcodeOnly, categoryFilters, {
        includeListMeta,
      });
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
      if (this.state.view === 'changelog') {
        await this.loadChangelog(this.state.changelogPage, this.state.changelogPageSize);
      }
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
      this.cancelBarcodeCapture();
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

  applyListResult = (seq, result, { includeListMeta = true, page } = {}) => {
    if (seq !== this.loadSeq) return;
    const patch = {
      articles: result.articles,
      total: result.total,
      pageSize: result.pageSize,
      loading: false,
    };
    if (page !== undefined) {
      patch.page = page;
    }
    if (includeListMeta) {
      patch.stats = result.stats;
      patch.categoryCounts = result.categoryCounts;
    }
    this.setState(patch);
  };

  loadChangelog = async (
    nextPage = this.state.changelogPage,
    nextPageSize = this.state.changelogPageSize,
    { page: pageOverride } = {},
  ) => {
    const seq = ++this.changelogLoadSeq;
    if (this.state.changelogEntries.length === 0) {
      this.setState({ changelogLoading: true });
    }
    try {
      const res = await api.listChangelog({
        page: nextPage + 1,
        pageSize: nextPageSize,
      });
      if (seq !== this.changelogLoadSeq) return;

      if (res.items.length === 0 && res.total > 0 && nextPage > 0) {
        const correctedPage = nextPage - 1;
        await this.loadChangelog(correctedPage, nextPageSize, { page: correctedPage });
        return;
      }

      this.setState({
        changelogEntries: res.items,
        changelogTotal: res.total,
        changelogPageSize: res.pageSize,
        changelogPage: pageOverride ?? nextPage,
        changelogLoading: false,
      });
    } catch (e) {
      if (seq !== this.changelogLoadSeq) return;
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
      this.setState({ changelogLoading: false });
    }
  };

  toggleView = () => {
    this.setState((prev) => ({
      view: prev.view === 'articles' ? 'changelog' : 'articles',
    }));
  };

  handleChangelogPageSizeChange = (nextPageSize) => {
    this.setState({ changelogPageSize: nextPageSize, changelogPage: 0 });
  };

  handleChangelogPageChange = (nextPage) => {
    const { changelogPageSize } = this.state;
    this.loadChangelog(nextPage, changelogPageSize, { page: nextPage });
  };

  load = async (
    nextPage = this.state.page,
    nextPageSize = this.state.pageSize,
    nextSearch = this.state.search,
    nextMissingBarcodeOnly = this.state.missingBarcodeOnly,
    nextCategoryFilters = this.state.categoryFilters,
    { includeListMeta = true, page: pageOverride } = {},
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
        includeMeta: includeListMeta,
      });
      if (seq !== this.loadSeq) return;

      if (includeListMeta) {
        const counts = res.categoryCounts ?? [];
        const validFilters = nextCategoryFilters.filter((filterKey) =>
          counts.some((cat) => categoryFilterKey(cat.id) === filterKey),
        );
        if (!categoryFiltersEqual(validFilters, nextCategoryFilters)) {
          if (seq !== this.loadSeq) return;
          this.setState({ categoryFilters: validFilters });
          await this.load(nextPage, nextPageSize, nextSearch, nextMissingBarcodeOnly, validFilters, {
            includeListMeta,
          });
          return;
        }
      }
      if (res.items.length === 0 && res.total > 0 && nextPage > 0) {
        if (seq !== this.loadSeq) return;
        const correctedPage = nextPage - 1;
        await this.load(correctedPage, nextPageSize, nextSearch, nextMissingBarcodeOnly, nextCategoryFilters, {
          includeListMeta,
          page: correctedPage,
        });
        return;
      }
      this.applyListResult(seq, {
        articles: res.items,
        total: res.total,
        pageSize: res.pageSize,
        stats: res.stats,
        categoryCounts: res.categoryCounts,
      }, { includeListMeta, page: pageOverride });
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
    const { pageSize, search, missingBarcodeOnly, categoryFilters } = this.state;
    this.load(nextPage, pageSize, search, missingBarcodeOnly, categoryFilters, {
      includeListMeta: false,
      page: nextPage,
    });
  };

  handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { pageSize } = this.state;
    try {
      const text = await file.text();
      this.setState({ importProgress: { phase: 'start', articles: 0, thumbnails: 0 } });
      const res = await api.importCsv(text, (progress) => {
        this.setState({ importProgress: progress });
      });
      this.setState({
        importProgress: null,
        page: 0,
        search: '',
        query: '',
        categoryFilters: [],
      });
      await this.load(0, pageSize, '');
      await this.loadCategories();
      if (this.state.view === 'changelog') {
        await this.loadChangelog(0, this.state.changelogPageSize, { page: 0 });
      }
      this.notify(`Imported ${res.articles} articles and ${res.variations} variations.`);
    } catch (err) {
      this.setState({ importProgress: null });
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
      if (this.state.view === 'changelog') {
        await this.loadChangelog(this.state.changelogPage, this.state.changelogPageSize);
      }
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
      if (this.state.view === 'changelog') {
        await this.loadChangelog(this.state.changelogPage, this.state.changelogPageSize);
      }
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
      if (this.state.view === 'changelog') {
        await this.loadChangelog(0, this.state.changelogPageSize, { page: 0 });
      }
      this.notify('Database flushed.');
    } catch (e) {
      if (!this.handleAuthError(e)) this.notify(e.message, 'error');
    }
  };

  handleQueryChange = (query) => {
    this.setState({ query });
  };

  handleMissingBarcodeChange = (missingBarcodeOnly) => {
    this.setState({ missingBarcodeOnly, page: 0 });
  };

  handleSearchEnter = () => {
    const { query } = this.state;
    this.applySearch(query);
    this.selectSearchText();
  };

  openNewArticle = () => {
    this.setState({ dialog: { open: true, initial: null } });
  };

  openEditArticle = (article) => {
    this.setState({ dialog: { open: true, initial: article } });
  };

  closeArticleDialog = () => {
    this.setState({ dialog: { open: false, initial: null } });
  };

  openCategoriesDialog = () => {
    this.setState({ categoriesOpen: true });
  };

  closeCategoriesDialog = () => {
    this.setState({ categoriesOpen: false });
  };

  handleCategoriesChanged = async () => {
    const { page, pageSize, search } = this.state;
    await this.loadCategories();
    await this.load(page, pageSize, search);
    if (this.state.view === 'changelog') {
      await this.loadChangelog(this.state.changelogPage, this.state.changelogPageSize);
    }
  };

  render() {
    const { user, onLogout } = this.props;
    const {
      view,
      articles, total, page, pageSize, stats, loading, query, search,
      missingBarcodeOnly, categoryFilters, categoryCounts,
      dialog, categoriesOpen, categories, isMobile,
      barcodeCapture, barcodeCaptureBuffer,
      changelogEntries, changelogTotal, changelogPage, changelogPageSize, changelogLoading,
      importProgress,
    } = this.state;

    return (
      <>
        <ImportProgressOverlay progress={importProgress} />
        <AppShell
          user={user}
          onLogout={onLogout}
          view={view}
          onToggleView={this.toggleView}
          searchRef={this.searchRef}
          query={query}
          stats={stats}
          isMobile={isMobile}
          missingBarcodeOnly={missingBarcodeOnly}
          categoryCounts={categoryCounts}
          categoryFilters={categoryFilters}
          onQueryChange={this.handleQueryChange}
          onMissingBarcodeChange={this.handleMissingBarcodeChange}
          onSearchEnter={this.handleSearchEnter}
          onAddCategoryFilter={this.addCategoryFilter}
          onRemoveCategoryFilter={this.removeCategoryFilter}
          onOpenCategories={this.openCategoriesDialog}
          onNewArticle={this.openNewArticle}
          onImportFile={this.handleImportFile}
          onExport={this.handleExport}
          onFlushDb={this.handleFlushDb}
          articles={articles}
          total={total}
          page={page}
          pageSize={pageSize}
          loading={loading}
          search={search}
          barcodeCapture={barcodeCapture}
          barcodeCaptureBuffer={barcodeCaptureBuffer}
          onStartBarcodeCapture={this.startBarcodeCapture}
          onEditArticle={this.openEditArticle}
          onDeleteArticle={this.handleDelete}
          onPageChange={this.handlePageChange}
          onPageSizeChange={this.handlePageSizeChange}
          changelogEntries={changelogEntries}
          changelogTotal={changelogTotal}
          changelogPage={changelogPage}
          changelogPageSize={changelogPageSize}
          changelogLoading={changelogLoading}
          onChangelogPageChange={this.handleChangelogPageChange}
          onChangelogPageSizeChange={this.handleChangelogPageSizeChange}
        />

        <ArticleDialog
          open={dialog.open}
          initial={dialog.initial}
          categories={categories}
          onManageCategories={this.openCategoriesDialog}
          onClose={this.closeArticleDialog}
          onSave={this.handleSave}
        />

        <CategoryDialog
          open={categoriesOpen}
          onClose={this.closeCategoriesDialog}
          onChanged={this.handleCategoriesChanged}
        />
      </>
    );
  }
}

export default App;
