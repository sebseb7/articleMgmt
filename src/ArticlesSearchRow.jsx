import { PureComponent } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, IconButton, Tooltip, FormControlLabel, Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import { withNoAutofill } from './textFieldUtils.js';

const searchFieldSlotProps = withNoAutofill({
  input: {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon fontSize="small" />
      </InputAdornment>
    ),
  },
});

/** Search + article actions — no category filter chip state. */
export default class ArticlesSearchRow extends PureComponent {
  handleQueryChange = (e) => {
    this.props.onQueryChange(e.target.value);
  };

  handleMissingBarcodeChange = (e) => {
    this.props.onMissingBarcodeChange(e.target.checked);
  };

  handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.props.onSearchEnter();
    }
  };

  render() {
    const {
      searchRef, query, stats, isMobile, missingBarcodeOnly,
      onOpenCategories, onNewArticle,
    } = this.props;

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexGrow: 1,
            width: '100%',
            maxWidth: { xs: 'none', sm: 560 },
          }}
        >
          <TextField
            inputRef={searchRef}
            size="small"
            placeholder={isMobile ? 'Search or scan barcode…' : 'Search or scan barcode (min. 3 characters)…'}
            value={query}
            onChange={this.handleQueryChange}
            onKeyDown={this.handleSearchKeyDown}
            sx={{
              flexGrow: 1,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
            slotProps={searchFieldSlotProps}
          />
          <FormControlLabel
            control={(
              <Switch
                size="small"
                checked={missingBarcodeOnly}
                onChange={this.handleMissingBarcodeChange}
              />
            )}
            label={isMobile ? 'Missing' : 'Missing barcode'}
            sx={{ flexShrink: 0, m: 0, whiteSpace: 'nowrap' }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {stats.articles} articles · {stats.variations} variations
          </Typography>
          {isMobile ? (
            <Tooltip title="Categories">
              <IconButton onClick={onOpenCategories} color="primary">
                <CategoryIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={onOpenCategories}
              sx={{ flexShrink: 0 }}
            >
              Categories
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewArticle}
            sx={{ flexShrink: 0 }}
          >
            {isMobile ? 'New' : 'New article'}
          </Button>
        </Box>
      </Box>
    );
  }
}
