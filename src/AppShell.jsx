import { PureComponent } from 'react';
import { Box, Container } from '@mui/material';
import AppHeader from './AppHeader.jsx';
import ArticlesSearchRow from './ArticlesSearchRow.jsx';
import CategoryFilterChips from './CategoryFilterChips.jsx';
import ArticlesPanel from './ArticlesPanel.jsx';

import ChangelogPanel from './ChangelogPanel.jsx';

export default class AppShell extends PureComponent {
  render() {
    const {
      user, onLogout, searchRef, view, onToggleView,
      query, stats, isMobile, missingBarcodeOnly,
      categoryCounts, categoryFilters,
      onQueryChange, onMissingBarcodeChange, onSearchEnter,
      onAddCategoryFilter, onRemoveCategoryFilter,
      onOpenCategories, onNewArticle,
      onImportFile, onExport, onFlushDb,
      articles, total, page, pageSize, loading, search,
      barcodeCapture, barcodeCaptureBuffer,
      onStartBarcodeCapture, onEditArticle, onDeleteArticle,
      onPageChange, onPageSizeChange,
      changelogEntries, changelogTotal, changelogPage, changelogPageSize, changelogLoading,
      onChangelogPageChange, onChangelogPageSizeChange,
    } = this.props;

    const showArticles = view === 'articles';

    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppHeader
          user={user}
          isMobile={isMobile}
          view={view}
          onToggleView={onToggleView}
          onImportFile={onImportFile}
          onExport={onExport}
          onFlushDb={onFlushDb}
          onLogout={onLogout}
        />
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 3 } }}>
          {showArticles ? (
            <>
              <Box sx={{ mb: 2 }}>
                <ArticlesSearchRow
              searchRef={searchRef}
              query={query}
              stats={stats}
              isMobile={isMobile}
              missingBarcodeOnly={missingBarcodeOnly}
              onOpenCategories={onOpenCategories}
              onNewArticle={onNewArticle}
              onQueryChange={onQueryChange}
              onMissingBarcodeChange={onMissingBarcodeChange}
              onSearchEnter={onSearchEnter}
            />
            <CategoryFilterChips
              categoryCounts={categoryCounts}
              categoryFilters={categoryFilters}
              onAddCategoryFilter={onAddCategoryFilter}
              onRemoveCategoryFilter={onRemoveCategoryFilter}
            />
          </Box>
          <ArticlesPanel
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
            onStartBarcodeCapture={onStartBarcodeCapture}
            onEditArticle={onEditArticle}
            onDeleteArticle={onDeleteArticle}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
            </>
          ) : (
            <ChangelogPanel
              entries={changelogEntries}
              total={changelogTotal}
              page={changelogPage}
              pageSize={changelogPageSize}
              loading={changelogLoading}
              isMobile={isMobile}
              onPageChange={onChangelogPageChange}
              onPageSizeChange={onChangelogPageSizeChange}
            />
          )}
        </Container>
      </Box>
    );
  }
}
