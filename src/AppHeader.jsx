import { PureComponent, createRef } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip,
  Menu, MenuItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import StorefrontIcon from '@mui/icons-material/Storefront';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SettingsIcon from '@mui/icons-material/Settings';
import NavigationIcon from '@mui/icons-material/Menu';
import KeyIcon from '@mui/icons-material/Key';
import CheckIcon from '@mui/icons-material/Check';
import PrintIcon from '@mui/icons-material/Print';

const SUMUP_CATALOG_URL = 'https://me.sumup.com/catalog';

/** Top app bar only — no search, filters, or list state. */
export default class AppHeader extends PureComponent {
  fileRef = createRef();

  state = {
    navAnchor: null,
    settingsAnchor: null,
  };

  openNavMenu = (e) => {
    this.setState({ navAnchor: e.currentTarget });
  };

  closeNavMenu = () => {
    this.setState({ navAnchor: null });
  };

  openSettingsMenu = (e) => {
    this.setState({ settingsAnchor: e.currentTarget });
  };

  closeSettingsMenu = () => {
    this.setState({ settingsAnchor: null });
  };

  handleNavigate = (target) => {
    this.closeNavMenu();
    this.props.onNavigate(target);
  };

  handleSettingsAction = (action) => {
    this.closeSettingsMenu();
    if (action === 'tokens') this.props.onOpenTokens();
    else if (action === 'import') this.fileRef.current?.click();
    else if (action === 'export') this.props.onExport();
    else if (action === 'flush') this.props.onFlushDb();
  };

  renderNavItem = (target, icon, label, selected) => (
    <MenuItem key={target} onClick={() => this.handleNavigate(target)} selected={selected}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{label}</ListItemText>
      {selected && (
        <ListItemIcon sx={{ minWidth: 'auto !important', ml: 1 }}>
          <CheckIcon fontSize="small" />
        </ListItemIcon>
      )}
    </MenuItem>
  );

  renderPrinterStatus = () => {
    const { printers } = this.props;
    const connected = printers.length > 0;
    const title = connected
      ? `Printer connected: ${printers.map((p) => p.name).join(', ')}`
      : 'No printer connected';

    return (
      <Tooltip title={title}>
        <PrintIcon
          aria-label={title}
          sx={{
            fontSize: { xs: 24, sm: 26 },
            color: connected ? 'success.light' : 'grey.500',
          }}
        />
      </Tooltip>
    );
  };

  renderMenus = (isIcon) => {
    const { view, missingListOpen } = this.props;
    const { navAnchor, settingsAnchor } = this.state;
    const articlesSelected = view === 'articles' && !missingListOpen;
    const changelogSelected = view === 'changelog';
    const missingSelected = missingListOpen;

    const navTrigger = isIcon ? (
      <Tooltip title="Navigate">
        <IconButton color="inherit" onClick={this.openNavMenu}>
          <NavigationIcon />
        </IconButton>
      </Tooltip>
    ) : (
      <Button color="inherit" startIcon={<NavigationIcon />} onClick={this.openNavMenu}>
        Navigate
      </Button>
    );

    const settingsTrigger = isIcon ? (
      <Tooltip title="Settings">
        <IconButton color="inherit" onClick={this.openSettingsMenu}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    ) : (
      <Button color="inherit" startIcon={<SettingsIcon />} onClick={this.openSettingsMenu}>
        Settings
      </Button>
    );

    return (
      <>
        {navTrigger}
        <Menu anchorEl={navAnchor} open={Boolean(navAnchor)} onClose={this.closeNavMenu}>
          {this.renderNavItem('articles', <ArticleIcon fontSize="small" />, 'Articles', articlesSelected)}
          {this.renderNavItem('changelog', <HistoryIcon fontSize="small" />, 'Changelog', changelogSelected)}
          {this.renderNavItem('missing', <QrCode2Icon fontSize="small" />, 'Missing barcodes', missingSelected)}
        </Menu>

        {settingsTrigger}
        <Menu anchorEl={settingsAnchor} open={Boolean(settingsAnchor)} onClose={this.closeSettingsMenu}>
          <MenuItem onClick={() => this.handleSettingsAction('tokens')}>
            <ListItemIcon><KeyIcon fontSize="small" /></ListItemIcon>
            <ListItemText>API tokens</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => this.handleSettingsAction('import')}>
            <ListItemIcon><UploadIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Import CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => this.handleSettingsAction('export')}>
            <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Export CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => this.handleSettingsAction('flush')}>
            <ListItemIcon><DeleteSweepIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Flush DB</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  };

  render() {
    const { user, isMobile, onImportFile, onLogout } = this.props;

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
              gap: { xs: 0.5, md: 1.5 },
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
                <Tooltip title="SumUp">
                  <IconButton
                    color="inherit"
                    component="a"
                    href={SUMUP_CATALOG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <StorefrontIcon />
                  </IconButton>
                </Tooltip>
                {this.renderPrinterStatus()}
                {this.renderMenus(true)}
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
                  component="a"
                  href={SUMUP_CATALOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<StorefrontIcon />}
                >
                  SumUp
                </Button>
                {this.renderPrinterStatus()}
                {this.renderMenus(false)}
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
