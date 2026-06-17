import { Chip } from '@mui/material';

export default function NewBadge({ sx }) {
  return (
    <Chip
      size="small"
      label="new"
      color="warning"
      variant="outlined"
      sx={{ height: 20, fontSize: '0.7rem', verticalAlign: 'middle', ...sx }}
    />
  );
}
