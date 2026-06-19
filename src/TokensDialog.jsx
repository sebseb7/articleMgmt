import { Component } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Box, Typography, FormGroup, FormControlLabel, Checkbox, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { QRCodeSVG } from 'qrcode.react';
import { api } from './api.js';
import { withNoAutofill } from './textFieldUtils.js';

const ZEBRA_LABEL_RELEASES_URL = 'https://github.com/sebseb7/ZebraLabel/releases/latest';

const SCOPE_OPTIONS = [
  { id: 'read', label: 'Read — query price by barcode' },
  { id: 'write', label: 'Write — update price, use printers' },
  { id: 'admin', label: 'Admin — delete by barcode' },
  { id: 'printer', label: 'Printer — printer agent' },
];

function apiBaseUrl() {
  return window.location.origin;
}

function tokenQrPayload(token) {
  return JSON.stringify({ url: apiBaseUrl(), token });
}

export default class TokensDialog extends Component {
  state = {
    tokens: [],
    name: '',
    scopes: { read: true, write: false, admin: false },
    createdToken: '',
    qrOpen: false,
    error: '',
    loading: false,
    creating: false,
  };

  componentDidUpdate(prevProps) {
    if (this.props.open && !prevProps.open) {
      this.setState({
        name: '',
        scopes: { read: true, write: false, admin: false },
        createdToken: '',
        qrOpen: false,
        error: '',
      });
      this.load();
    }
  }

  load = async () => {
    this.setState({ loading: true });
    try {
      const tokens = await api.listTokens();
      this.setState({ tokens });
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleScopeChange = (scope) => (e) => {
    this.setState((prev) => ({
      scopes: { ...prev.scopes, [scope]: e.target.checked },
    }));
  };

  handleCreate = async () => {
    const { name, scopes } = this.state;
    const selected = SCOPE_OPTIONS.filter((o) => scopes[o.id]).map((o) => o.id);
    this.setState({ creating: true, error: '' });
    try {
      const created = await api.createToken(name, selected);
      this.setState({ createdToken: created.token, name: '', scopes: { read: true, write: false, admin: false } });
      await this.load();
    } catch (e) {
      this.setState({ error: e.message });
    } finally {
      this.setState({ creating: false });
    }
  };

  handleDelete = async (id) => {
    this.setState({ error: '' });
    try {
      await api.deleteToken(id);
      await this.load();
    } catch (e) {
      this.setState({ error: e.message });
    }
  };

  copyToken = async () => {
    const { createdToken } = this.state;
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
    } catch {
      // clipboard may be unavailable
    }
  };

  openQr = () => {
    if (this.state.createdToken) this.setState({ qrOpen: true });
  };

  closeQr = () => {
    this.setState({ qrOpen: false });
  };

  renderCompanionAppCard = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        p: 2,
        mb: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(13, 148, 136, 0.06)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0,
        }}
      >
        <PrintIcon />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          ZebraLabel companion app
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Install on Android to connect a USB Zebra printer and run it as a printer agent.
          Create a token and scan the token QR code in the app to pair.
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="small"
        component="a"
        href={ZEBRA_LABEL_RELEASES_URL}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<OpenInNewIcon />}
        sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
      >
        Download
      </Button>
    </Box>
  );

  render() {
    const { open, onClose } = this.props;
    const {
      tokens, name, scopes, createdToken, qrOpen, error, loading, creating,
    } = this.state;

    return (
      <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>API tokens</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Machine tokens for the price API and printer integration.
            {' '}
            Pass as <code>Authorization: Bearer &lt;token&gt;</code>.
          </Typography>

          {this.renderCompanionAppCard()}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => this.setState({ error: '' })}>
              {error}
            </Alert>
          )}

          {createdToken && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              action={(
                <Box sx={{ display: 'flex' }}>
                  <IconButton color="inherit" size="small" onClick={this.openQr} aria-label="Show token as QR code">
                    <QrCode2Icon fontSize="small" />
                  </IconButton>
                  <IconButton color="inherit" size="small" onClick={this.copyToken} aria-label="Copy token">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                Copy this token now — it will not be shown again:
                {' '}
                <strong>{createdToken}</strong>
              </Typography>
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Create token</Typography>
            <TextField
              label="Name"
              size="small"
              fullWidth
              value={name}
              onChange={(e) => this.setState({ name: e.target.value })}
              sx={{ mb: 1.5 }}
              slotProps={withNoAutofill()}
            />
            <FormGroup>
              {SCOPE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={(
                    <Checkbox
                      size="small"
                      checked={scopes[opt.id]}
                      onChange={this.handleScopeChange(opt.id)}
                    />
                  )}
                  label={opt.label}
                />
              ))}
            </FormGroup>
            <Button
              variant="contained"
              size="small"
              onClick={this.handleCreate}
              disabled={creating || !name.trim()}
              sx={{ mt: 1 }}
            >
              Create token
            </Button>
          </Box>

          <Typography variant="subtitle2" gutterBottom>Your tokens</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Prefix</TableCell>
                <TableCell>Scopes</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">{token.tokenPrefix}</Typography>
                  </TableCell>
                  <TableCell>{token.scopes.join(', ')}</TableCell>
                  <TableCell>{token.createdAt}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => this.handleDelete(token.id)} aria-label="Delete token">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && tokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">No tokens yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={qrOpen} onClose={this.closeQr} maxWidth="xs" fullWidth>
        <DialogTitle>Token QR code</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pb: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'common.white', borderRadius: 1 }}>
            <QRCodeSVG value={tokenQrPayload(createdToken)} size={220} level="M" />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            JSON payload with API base URL and token. It will not be shown again after you close this dialog.
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ wordBreak: 'break-all', px: 1 }}>
            {tokenQrPayload(createdToken)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.closeQr}>Close</Button>
        </DialogActions>
      </Dialog>
      </>
    );
  }
}
