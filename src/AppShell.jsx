import { PureComponent } from 'react';
import { Box, Container } from '@mui/material';
import AppHeader from './AppHeader.jsx';
import ArticlesSearchRow from './ArticlesSearchRow.jsx';
import CategoryFilterChips from './CategoryFilterChips.jsx';
import ArticlesPanel from './ArticlesPanel.jsx';

export default class AppShell extends PureComponent {
  render() {
    const {
      user, onLogout, searchRef,
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
    } = this.props;

    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppHeader
          user={user}
          isMobile={isMobile}
          onImportFile={onImportFile}
          onExport={onExport}
          onFlushDb={onFlushDb}
          onLogout={onLogout}
        />
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 3 } }}>
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
        </Container>
      </Box>
    );
  }
}
