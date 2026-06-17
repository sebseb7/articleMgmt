const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export const money = (v) => (v === null || v === undefined ? '—' : euroFormat.format(Number(v)));

export const MIN_SEARCH_CHARS = 3;
export const DEFAULT_PAGE_SIZE = 25;
export const TABLE_ROW_HEIGHT = 42;
export const TABLE_HEADER_HEIGHT = 48;

function compactLength(text) {
  return text.replace(/\s/g, '').length;
}

export function effectiveSearchQuery(query) {
  return compactLength(query) >= MIN_SEARCH_CHARS ? query.trim() : '';
}

export function categoryFilterKey(categoryId) {
  return categoryId == null ? 'none' : categoryId;
}

export function categoryFiltersEqual(a, b) {
  if (a.length !== b.length) return false;
  const left = [...a].map(String).sort();
  const right = [...b].map(String).sort();
  return left.every((value, index) => value === right[index]);
}

export function formatCategoryFilterLabel(categoryCounts, categoryFilters) {
  if (!categoryFilters.length) return '';
  const names = categoryCounts
    .filter((cat) => categoryFilters.includes(categoryFilterKey(cat.id)))
    .map((cat) => cat.name);
  return names.length ? ` in ${names.join(', ')}` : '';
}

export function mediaQueryString(theme, key) {
  return theme.breakpoints[key]('sm').replace(/^@media\s*/, '');
}
