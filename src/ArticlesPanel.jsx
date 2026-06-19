import { PureComponent } from 'react';
import { Paper } from '@mui/material';
import ArticlesPaper from './ArticlesPaper.jsx';

/** Articles table + pagination — isolated from toolbar/search so page changes stay local. */
export default class ArticlesPanel extends PureComponent {
  render() {
    const {
      articles, total, page, pageSize, loading, search, isMobile,
      missingBarcodeOnly, categoryFilters, categoryCounts,
      barcodeCapture, barcodeCaptureBuffer, printers, printingKey,
      onStartBarcodeCapture, onEditArticle, onDeleteArticle, onPrintPrice,
      onPageChange, onPageSizeChange,
    } = this.props;

    return (
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
          onStartBarcodeCapture={onStartBarcodeCapture}
          onEdit={onEditArticle}
          onDelete={onDeleteArticle}
          onPrintPrice={onPrintPrice}
          printers={printers}
          printingKey={printingKey}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Paper>
    );
  }
}
