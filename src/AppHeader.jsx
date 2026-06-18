import { PureComponent, createRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

/** Top app bar only — no search, filters, or list state. */
export default class AppHeader extends PureComponent {
  fileRef = createRef();

  render() {
    const { user, isMobile, view, onImportFile, onExport, onFlushDb, onLogout, onToggleView } = this.props;
    const onChangelog = view === 'articles';

    return (
      <AppBar position="static" elevation={0}>
        <Toolbar
          sx={{
            gap: 1,
            flexWrap: 'wrap',
            py: { xs: 1, sm: 0 },
            minHeight: { xs: 'auto', sm: 64 },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              width: { xs: '100%', md: 'auto' },
              lineHeight: 1.3,
            }}
          >
            SumUp Article Editor
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'flex-end', md: 'flex-start' },
            }}
          >
            <input
              ref={this.fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={onImportFile}
            />
            {isMobile ? (
              <>
                <Tooltip title={onChangelog ? 'Changelog' : 'Articles'}>
                  <IconButton color="inherit" onClick={onToggleView}>
                    {onChangelog ? <HistoryIcon /> : <ArticleIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Import CSV">
                  <IconButton color="inherit" onClick={() => this.fileRef.current?.click()}>
                    <UploadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export CSV">
                  <IconButton color="inherit" onClick={onExport}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Flush DB">
                  <IconButton color="inherit" onClick={onFlushDb}>
                    <DeleteSweepIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Logout (${user.username})`}>
                  <IconButton color="inherit" onClick={onLogout}>
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  startIcon={onChangelog ? <HistoryIcon /> : <ArticleIcon />}
                  onClick={onToggleView}
                >
                  {onChangelog ? 'Changelog' : 'Articles'}
                </Button>
                <Button color="inherit" startIcon={<UploadIcon />} onClick={() => this.fileRef.current?.click()}>
                  Import CSV
                </Button>
                <Button color="inherit" startIcon={<DownloadIcon />} onClick={onExport}>
                  Export CSV
                </Button>
                <Button color="inherit" startIcon={<DeleteSweepIcon />} onClick={onFlushDb}>
                  Flush DB
                </Button>
                <Typography variant="body2" sx={{ opacity: 0.9, mx: 0.5 }}>
                  {user.username}
                </Typography>
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  }
}
