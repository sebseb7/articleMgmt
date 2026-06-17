import { Component } from 'react';
import { Box, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { categoryFilterKey } from './articleTableUtils.js';

export default class CategoryFilterChips extends Component {
  render() {
    const { categoryCounts, categoryFilters, onAddCategoryFilter, onRemoveCategoryFilter } = this.props;
    if (!categoryCounts.length) return null;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {categoryCounts.map((cat) => {
          const filterKey = categoryFilterKey(cat.id);
          const active = categoryFilters.includes(filterKey);
          return (
            <Chip
              key={String(filterKey)}
              size="small"
              label={`${cat.name} (${cat.count})`}
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              onClick={() => (
                active
                  ? onRemoveCategoryFilter(filterKey)
                  : onAddCategoryFilter(filterKey)
              )}
              onDelete={active ? () => onRemoveCategoryFilter(filterKey) : undefined}
              deleteIcon={<DeleteIcon />}
            />
          );
        })}
      </Box>
    );
  }
}
