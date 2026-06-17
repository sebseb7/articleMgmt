import { Component } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Chip, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  themeQuartz,
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowApiModule,
  RenderApiModule,
  CellStyleModule,
  ValidationModule,
} from 'ag-grid-community';
import { hasUuid } from './uuid.js';
import NewBadge from './NewBadge.jsx';
import BarcodeAssignButton from './BarcodeAssignButton.jsx';
import { money } from './articleTableUtils.js';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowApiModule,
  RenderApiModule,
  CellStyleModule,
  ...(import.meta.env.DEV ? [ValidationModule] : []),
]);

const ARTICLE_ROW_HEIGHT = 52;
const DETAIL_HEADER_HEIGHT = 52;
const DETAIL_VARIATION_ROW_HEIGHT = 41;
const DETAIL_VERTICAL_PADDING = 24;

const agTheme = themeQuartz.withParams({
  accentColor: '#0d9488',
  backgroundColor: '#f7fbfb',
  foregroundColor: '#134e4a',
  textColor: '#134e4a',
  headerBackgroundColor: 'rgba(13, 148, 136, 0.1)',
  headerTextColor: '#0f766e',
  headerFontWeight: 600,
  borderColor: 'rgba(13, 148, 136, 0.2)',
  rowHoverColor: 'rgba(8, 145, 178, 0.06)',
  rowBorder: { style: 'solid', width: 1, color: 'rgba(13, 148, 136, 0.16)' },
  wrapperBorder: false,
  fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
});

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

  return articleBarcode || null;
}

function isBarcodeCapturing(barcodeCapture, articleId, variationId = null) {
  if (!barcodeCapture) return false;
  return barcodeCapture.articleId === articleId && barcodeCapture.variationId === variationId;
}

function renderBarcodeValue(barcode, articleId, variationId, context) {
  const { barcodeCapture, barcodeCaptureBuffer, onStartBarcodeCapture } = context;
  const active = isBarcodeCapturing(barcodeCapture, articleId, variationId);
  const hasBarcode = String(barcode ?? '').trim();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <BarcodeAssignButton
        active={active}
        onStart={() => onStartBarcodeCapture(articleId, variationId)}
      />
      {active && barcodeCaptureBuffer ? (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {barcodeCaptureBuffer}
        </Typography>
      ) : (
        hasBarcode && <span>{barcode}</span>
      )}
    </Box>
  );
}

class EditCellRenderer extends Component {
  render() {
    const { data, context } = this.props;
    return (
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => context.onEdit(data.article)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }
}

class ExpandCellRenderer extends Component {
  render() {
    const { data, context } = this.props;
    const variations = data.article.variations || [];
    if (variations.length === 0) return null;
    const open = context.isExpanded(data.id);
    return (
      <IconButton size="small" onClick={() => context.onToggle(data.id)}>
        {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
      </IconButton>
    );
  }
}

class NameCellRenderer extends Component {
  render() {
    const { article } = this.props.data;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Typography fontWeight={600} noWrap>{article.item_name}</Typography>
        {!hasUuid(article.item_uuid) && <NewBadge />}
      </Box>
    );
  }
}

class CategoryCellRenderer extends Component {
  render() {
    const { article } = this.props.data;
    return article.category ? <Chip size="small" label={article.category} /> : null;
  }
}

class PriceCellRenderer extends Component {
  render() {
    const { article } = this.props.data;
    const variations = article.variations || [];
    return variations.length > 0
      ? <Chip size="small" variant="outlined" label={`${variations.length} variations`} />
      : <span>{money(article.price)}</span>;
  }
}

class BarcodeCellRenderer extends Component {
  render() {
    const { data, context } = this.props;
    const { article } = data;
    const variations = article.variations || [];
    const hasVar = variations.length > 0;

    if (hasVar) {
      const label = articleBarcodeLabel(article);
      return <span>{label === 'missing' ? 'missing' : '—'}</span>;
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start' }}>
        {renderBarcodeValue(article.barcode, article.id, null, context)}
        {!hasUuid(article.variant_uuid) && <NewBadge />}
      </Box>
    );
  }
}

class OnlineCellRenderer extends Component {
  render() {
    const { article } = this.props.data;
    return article.visible_online
      ? <Chip size="small" color="primary" variant="outlined" label="online" />
      : <span>—</span>;
  }
}

class DeleteCellRenderer extends Component {
  render() {
    const { data, context } = this.props;
    return (
      <Tooltip title="Delete">
        <IconButton size="small" onClick={() => context.onDelete(data.article)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }
}

class VariationsDetailRenderer extends Component {
  render() {
    const { data, context } = this.props;
    const { article } = data;
    const variations = article.variations || [];
    return (
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
                <TableCell>
                  {renderBarcodeValue(v.barcode, article.id, v.id, context)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  }
}

export default class ArticlesGrid extends Component {
  state = { expanded: new Set() };

  gridApi = null;

  columnDefs = [
    {
      colId: 'edit',
      headerName: '',
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      cellRenderer: EditCellRenderer,
      cellStyle: { justifyContent: 'center' },
    },
    {
      colId: 'expand',
      headerName: '',
      width: 52,
      minWidth: 52,
      maxWidth: 52,
      cellRenderer: ExpandCellRenderer,
      cellStyle: { justifyContent: 'center' },
    },
    {
      colId: 'item_name',
      headerName: 'Item name',
      flex: 2,
      minWidth: 160,
      cellRenderer: NameCellRenderer,
    },
    {
      colId: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 110,
      cellRenderer: CategoryCellRenderer,
    },
    {
      colId: 'tax',
      headerName: 'Tax',
      width: 84,
      minWidth: 84,
      cellStyle: { justifyContent: 'flex-end' },
      headerClass: 'ag-right-aligned-header',
      valueGetter: (params) => params.data.article.tax_rate,
      valueFormatter: (params) => (params.value != null ? `${Number(params.value).toFixed(0)}%` : '—'),
    },
    {
      colId: 'price',
      headerName: 'Price / Variations',
      flex: 1,
      minWidth: 150,
      cellRenderer: PriceCellRenderer,
      cellStyle: { justifyContent: 'flex-end' },
      headerClass: 'ag-right-aligned-header',
    },
    {
      colId: 'barcode',
      headerName: 'Barcode',
      flex: 1.5,
      minWidth: 170,
      cellRenderer: BarcodeCellRenderer,
      cellStyle: { fontFamily: 'monospace', fontSize: '0.85rem' },
    },
    {
      colId: 'online',
      headerName: 'Online',
      width: 96,
      minWidth: 96,
      cellRenderer: OnlineCellRenderer,
      cellStyle: { justifyContent: 'center' },
      headerClass: 'ag-center-aligned-header',
    },
    {
      colId: 'delete',
      headerName: '',
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      cellRenderer: DeleteCellRenderer,
      cellStyle: { justifyContent: 'center' },
    },
  ];

  defaultColDef = {
    sortable: false,
    resizable: true,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    cellStyle: { display: 'flex', alignItems: 'center' },
    suppressKeyboardEvent: () => true,
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.articles !== this.props.articles && this.state.expanded.size > 0) {
      this.setState({ expanded: new Set() });
    }
    const barcodeChanged =
      prevProps.barcodeCapture !== this.props.barcodeCapture
      || prevProps.barcodeCaptureBuffer !== this.props.barcodeCaptureBuffer;
    const expandedChanged = prevState.expanded !== this.state.expanded;
    if (barcodeChanged) {
      this.refreshBarcodeCells();
    }
    if (expandedChanged) {
      this.gridApi?.resetRowHeights();
    }
  }

  handleGridReady = (params) => {
    this.gridApi = params.api;
  };

  refreshBarcodeCells = () => {
    const api = this.gridApi;
    if (!api) return;
    api.refreshCells({ force: true, columns: ['barcode'] });
    const detailNodes = [];
    api.forEachNode((node) => {
      if (node.data?.kind === 'detail') detailNodes.push(node);
    });
    if (detailNodes.length) api.redrawRows({ rowNodes: detailNodes });
  };

  isExpanded = (id) => this.state.expanded.has(id);

  toggleExpand = (id) => {
    this.setState((prev) => {
      const expanded = new Set(prev.expanded);
      if (expanded.has(id)) expanded.delete(id);
      else expanded.add(id);
      return { expanded };
    });
  };

  rowDataCache = { articles: null, expanded: null, rows: [] };

  getRowData() {
    const { articles } = this.props;
    const { expanded } = this.state;
    const cache = this.rowDataCache;
    if (cache.articles === articles && cache.expanded === expanded) {
      return cache.rows;
    }
    const rows = [];
    articles.forEach((article) => {
      rows.push({ kind: 'article', id: article.id, article });
      const variations = article.variations || [];
      if (expanded.has(article.id) && variations.length > 0) {
        rows.push({ kind: 'detail', id: article.id, article });
      }
    });
    this.rowDataCache = { articles, expanded, rows };
    return rows;
  }

  getRowId = (params) => `${params.data.kind}-${params.data.id}`;

  isFullWidthRow = (params) => params.rowNode.data?.kind === 'detail';

  getRowHeight = (params) => {
    if (params.data?.kind === 'detail') {
      const variations = params.data.article.variations || [];
      return DETAIL_HEADER_HEIGHT + variations.length * DETAIL_VARIATION_ROW_HEIGHT + DETAIL_VERTICAL_PADDING;
    }
    return ARTICLE_ROW_HEIGHT;
  };

  render() {
    const {
      barcodeCapture, barcodeCaptureBuffer, onStartBarcodeCapture, onEdit, onDelete,
    } = this.props;

    const context = {
      onEdit,
      onDelete,
      onToggle: this.toggleExpand,
      isExpanded: this.isExpanded,
      barcodeCapture,
      barcodeCaptureBuffer,
      onStartBarcodeCapture,
    };

    return (
      <Box sx={{ width: '100%', '& .ag-cell': { display: 'flex', alignItems: 'center' } }}>
        <AgGridReact
          theme={agTheme}
          domLayout="autoHeight"
          rowData={this.getRowData()}
          columnDefs={this.columnDefs}
          defaultColDef={this.defaultColDef}
          context={context}
          getRowId={this.getRowId}
          isFullWidthRow={this.isFullWidthRow}
          fullWidthCellRenderer={VariationsDetailRenderer}
          getRowHeight={this.getRowHeight}
          headerHeight={48}
          suppressCellFocus
          onGridReady={this.handleGridReady}
        />
      </Box>
    );
  }
}
