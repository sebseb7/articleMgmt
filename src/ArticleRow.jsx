import { Component } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Collapse, Chip, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { hasUuid } from './uuid.js';
import NewBadge from './NewBadge.jsx';
import BarcodeAssignButton from './BarcodeAssignButton.jsx';
import { money } from './articleTableUtils.js';

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

function renderBarcodeValue(barcode, articleId, variationId, barcodeCapture, barcodeCaptureBuffer, onStartBarcodeCapture) {
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

export default class ArticleRow extends Component {
  state = { open: false };

  toggleOpen = () => {
    this.setState((prev) => ({ open: !prev.open }));
  };

  render() {
    const {
      article, onEdit, onDelete, barcodeCapture, barcodeCaptureBuffer, onStartBarcodeCapture,
    } = this.props;
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
            {hasVar ? (
              barcodeLabel === 'missing' ? 'missing' : '—'
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-start' }}>
                {renderBarcodeValue(
                  article.barcode,
                  article.id,
                  null,
                  barcodeCapture,
                  barcodeCaptureBuffer,
                  onStartBarcodeCapture,
                )}
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
                          <TableCell>
                            {renderBarcodeValue(
                              v.barcode,
                              article.id,
                              v.id,
                              barcodeCapture,
                              barcodeCaptureBuffer,
                              onStartBarcodeCapture,
                            )}
                          </TableCell>
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
