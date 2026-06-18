import { PureComponent } from 'react';
import { Box, Typography, Select, MenuItem, Pagination, PaginationItem } from '@mui/material';
import { ALL_PAGE_SIZE, PAGE_SIZE_OPTIONS, isAllPageSize } from './articleTableUtils.js';

export default class TableNavigation extends PureComponent {
  render() {
    const { page, pageSize, total, onPageChange, onPageSizeChange, edge = 'bottom', compact = false } = this.props;
    const allRows = isAllPageSize(pageSize);
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
            value={allRows ? ALL_PAGE_SIZE : pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>{n === ALL_PAGE_SIZE ? 'All' : n}</MenuItem>
            ))}
          </Select>
          <Typography variant="body2" color="text.secondary">
            {total === 0
              ? '0 items'
              : (allRows
                ? `${total} items`
                : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}`)}
          </Typography>
        </Box>
        {!allRows && (
          <Pagination
            count={Math.max(1, Math.ceil(total / pageSize))}
            page={page + 1}
            onChange={(_, nextPage) => onPageChange(nextPage - 1)}
            showFirstButton
            showLastButton
            siblingCount={compact ? 0 : 1}
            boundaryCount={compact ? 1 : 1}
            color="primary"
            size={compact ? 'small' : 'medium'}
            renderItem={(item) => <PaginationItem {...item} disableRipple />}
            sx={{ alignSelf: compact ? 'center' : { xs: 'center', sm: 'auto' } }}
          />
        )}
      </Box>
    );
  }
}
