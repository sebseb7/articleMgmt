import { Component, lazy, Suspense } from 'react';
import {
  Box, Typography, CircularProgress,
} from '@mui/material';
import TableNavigation from './TableNavigation.jsx';
import { formatCategoryFilterLabel, TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, isAllPageSize } from './articleTableUtils.js';

const ArticlesGrid = lazy(() => import('./ArticlesGrid.jsx'));

export default class ArticlesPaper extends Component {
  render() {
    const {
      articles, total, page, pageSize, loading, search, isMobile, missingBarcodeOnly,
      categoryFilters, categoryCounts, barcodeCapture, barcodeCaptureBuffer,
      onStartBarcodeCapture, onEdit, onDelete, onPageChange, onPageSizeChange,
    } = this.props;
    const categoryLabel = formatCategoryFilterLabel(categoryCounts, categoryFilters);
    const hasCategoryFilter = categoryFilters.length > 0;
    const showEmptyState = !loading && total === 0;
    const isInitialLoad = loading && articles.length === 0;
    const visibleRows = isAllPageSize(pageSize) ? Math.max(articles.length, 1) : pageSize;
    const tableMinHeight = TABLE_HEADER_HEIGHT + visibleRows * TABLE_ROW_HEIGHT;

    if (showEmptyState) {
      return (
        <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>
            {missingBarcodeOnly
              ? (search
                ? `No articles with missing barcodes match "${search}"${categoryLabel}.`
                : (hasCategoryFilter
                  ? `No articles with missing barcodes${categoryLabel}.`
                  : 'No articles with missing barcodes.'))
              : (search
                ? `No articles match "${search}"${categoryLabel}.`
                : (hasCategoryFilter
                  ? `No articles${categoryLabel}.`
                  : 'No articles. Import a CSV or create one.'))}
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
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          compact={isMobile}
        />
        <Box sx={{ minHeight: tableMinHeight }}>
          <Suspense
            fallback={(
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: tableMinHeight }}>
                <CircularProgress />
              </Box>
            )}
          >
            <ArticlesGrid
              articles={articles}
              barcodeCapture={barcodeCapture}
              barcodeCaptureBuffer={barcodeCaptureBuffer}
              onStartBarcodeCapture={onStartBarcodeCapture}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Suspense>
        </Box>
        <TableNavigation
          edge="bottom"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          compact={isMobile}
        />
      </>
    );
  }
}
