const ACTION_LABELS = {
  flush: 'DB flush',
  import: 'Import',
  article_create: 'Article',
  article_update: 'Article',
  article_delete: 'Article',
  category_create: 'Category',
  category_update: 'Category',
  category_delete: 'Category',
  variation_update: 'Variation',
};

export function formatChangelogAction(action) {
  return ACTION_LABELS[action] || action;
}

export function formatChangelogTimestamp(iso) {
  if (!iso) return '';
  const normalized = iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}
