import { PureComponent } from 'react';
import {
  Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import TableNavigation from './TableNavigation.jsx';
import { formatChangelogAction, formatChangelogTimestamp } from './changelogUtils.js';

export default class ChangelogPanel extends PureComponent {
  render() {
    const {
      entries, total, page, pageSize, loading, isMobile,
      onPageChange, onPageSizeChange,
    } = this.props;
    const showEmpty = !loading && total === 0;
    const isInitialLoad = loading && entries.length === 0;

    return (
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="h2">
            Changelog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent changes by logged-in user
          </Typography>
        </Box>

        {isInitialLoad && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {showEmpty && (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>No changes recorded yet.</Typography>
          </Box>
        )}

        {!isInitialLoad && !showEmpty && (
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
            <TableContainer sx={{ maxHeight: { xs: 'none', md: 'calc(100vh - 320px)' } }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: { xs: '28%', sm: '18%' } }}>When</TableCell>
                    <TableCell sx={{ width: { xs: '22%', sm: '14%' }, display: { xs: 'none', sm: 'table-cell' } }}>
                      User
                    </TableCell>
                    <TableCell sx={{ width: { xs: '20%', sm: '12%' } }}>Type</TableCell>
                    <TableCell>Summary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        {formatChangelogTimestamp(entry.created_at)}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {entry.username}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatChangelogAction(entry.action)}
                          size="small"
                          variant="outlined"
                          sx={{ maxWidth: '100%' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {entry.summary}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                          {entry.username}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
        )}
      </Paper>
    );
  }
}
