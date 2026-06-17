import { Component } from 'react';
import { Chip } from '@mui/material';

export default class NewBadge extends Component {
  render() {
    const { sx } = this.props;
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
}
