import { PureComponent, lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, isAllPageSize } from './articleTableUtils.js';

const ArticlesGrid = lazy(() => import('./ArticlesGrid.jsx'));

/** Grid only — no pagination props, so page changes do not re-render the table. */
export default class ArticlesList extends PureComponent {
  render() {
    const {
      articles, pageSize, barcodeCapture, barcodeCaptureBuffer,
      onStartBarcodeCapture, onEdit, onDelete,
    } = this.props;
    const visibleRows = isAllPageSize(pageSize) ? Math.max(articles.length, 1) : pageSize;
    const tableMinHeight = TABLE_HEADER_HEIGHT + visibleRows * TABLE_ROW_HEIGHT;

    return (
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
    );
  }
}
