import { Component } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  CircularProgress, TableContainer,
} from '@mui/material';
import ArticleRow from './ArticleRow.jsx';
import TableNavigation from './TableNavigation.jsx';
import { formatCategoryFilterLabel, TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT } from './articleTableUtils.js';

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
    const tableMinHeight = TABLE_HEADER_HEIGHT + pageSize * TABLE_ROW_HEIGHT;

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
          loading={loading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
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
                  barcodeCapture={barcodeCapture}
                  barcodeCaptureBuffer={barcodeCaptureBuffer}
                  onStartBarcodeCapture={onStartBarcodeCapture}
                  onEdit={onEdit}
                  onDelete={onDelete}
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
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          compact={isMobile}
        />
      </>
    );
  }
}
