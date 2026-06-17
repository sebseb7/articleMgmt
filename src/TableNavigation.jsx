import { Component } from 'react';
import { Box, Typography, Select, MenuItem, Pagination } from '@mui/material';

export default class TableNavigation extends Component {
  render() {
    const { page, pageSize, total, loading, onPageChange, onPageSizeChange, edge = 'bottom', compact = false } = this.props;
    const borderSx = edge === 'top'
      ? { borderBottom: 1, borderColor: 'divider' }
      : { borderTop: 1, borderColor: 'divider' };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: compact ? 'column' : { xs: 'column', sm: 'row' },
          alignItems: compact ? 'stretch' : { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          px: { xs: 1, sm: 2 },
          py: 1.5,
          ...borderSx,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Rows per page
          </Typography>
          <Select
            size="small"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
          <Typography variant="body2" color="text.secondary">
            {total === 0
              ? '0 items'
              : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}`}
          </Typography>
        </Box>
        <Pagination
          count={Math.max(1, Math.ceil(total / pageSize))}
          page={page + 1}
          onChange={(_, nextPage) => onPageChange(nextPage - 1)}
          showFirstButton
          showLastButton
          siblingCount={compact ? 0 : 1}
          boundaryCount={compact ? 1 : 1}
          color="primary"
          disabled={total === 0 || loading}
          size={compact ? 'small' : 'medium'}
          sx={{ alignSelf: compact ? 'center' : { xs: 'center', sm: 'auto' } }}
        />
      </Box>
    );
  }
}
