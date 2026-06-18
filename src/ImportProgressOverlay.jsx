import { PureComponent } from 'react';
import { Backdrop, LinearProgress, Paper, Typography } from '@mui/material';

function progressMessage(progress) {
  const {
    phase, done, current, total, active, itemName, articles, thumbnails,
  } = progress;

  if (phase === 'start') {
    if (thumbnails > 0) {
      return `Importing ${articles} article(s), fetching ${thumbnails} thumbnail(s)…`;
    }
    return `Importing ${articles} article(s)…`;
  }
  if (phase === 'thumbnail' && total > 0) {
    const label = itemName ? `: ${itemName}` : '';
    const index = active ?? done ?? current ?? 0;
    return `Downloading thumbnail ${index} of ${total}${label}`;
  }
  if (phase === 'saving') {
    return 'Saving to database…';
  }
  return 'Importing…';
}

function progressValue(progress) {
  const { phase, done, current, total, thumbnails } = progress;
  if (phase === 'start') {
    return thumbnails > 0 ? 0 : null;
  }
  if (phase === 'thumbnail' && total > 0) {
    const completed = done ?? current ?? 0;
    return (completed / total) * 100;
  }
  if (phase === 'saving') {
    return 100;
  }
  return null;
}

export default class ImportProgressOverlay extends PureComponent {
  render() {
    const { progress } = this.props;
    if (!progress) return null;

    const value = progressValue(progress);
    const message = progressMessage(progress);
    const progressKey = [
      progress.phase,
      progress.done ?? progress.current ?? 0,
      progress.active ?? '',
      progress.total ?? 0,
    ].join('-');

    return (
      <Backdrop
        open
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
          color: '#fff',
        }}
      >
        <Paper
          elevation={8}
          sx={{ p: 3, width: '100%', maxWidth: 420, mx: 2 }}
          aria-live="polite"
          aria-busy="true"
        >
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {message}
          </Typography>
          <LinearProgress
            key={progressKey}
            variant={value != null ? 'determinate' : 'indeterminate'}
            value={value ?? 0}
          />
        </Paper>
      </Backdrop>
    );
  }
}
