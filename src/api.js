const credentials = { credentials: 'include' };

const json = async (r) => {
  if (r.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!r.ok) {
    let message = r.statusText;
    try {
      const body = await r.json();
      message = body.error || message;
    } catch {
      // ignore non-json error bodies
    }
    throw new Error(message);
  }
  return r.json();
};

export const api = {
  me: () => fetch('/api/auth/me', credentials).then(json),

  login: (username, password) =>
    fetch('/api/auth/login', {
      method: 'POST',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(json),

  logout: () =>
    fetch('/api/auth/logout', { method: 'POST', ...credentials }).then(json),

  list: ({ page = 1, pageSize = 25, q = '', missingBarcode = false, categoryIds, includeMeta = true } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q) params.set('q', q);
    if (missingBarcode) params.set('missingBarcode', '1');
    if (categoryIds?.length) params.set('categoryIds', categoryIds.map(String).join(','));
    if (!includeMeta) params.set('meta', '0');
    return fetch(`/api/articles?${params}`, credentials).then(json);
  },

  stats: () => fetch('/api/stats', credentials).then(json),

  generateBarcode: () =>
    fetch('/api/barcode/generate', { method: 'POST', ...credentials }).then(json),

  listCategories: () => fetch('/api/categories', credentials).then(json),

  createCategory: (name) =>
    fetch('/api/categories', {
      method: 'POST',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(json),

  updateCategory: (id, name) =>
    fetch(`/api/categories/${id}`, {
      method: 'PUT',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(json),

  removeCategory: (id) =>
    fetch(`/api/categories/${id}`, { method: 'DELETE', ...credentials }).then(json),

  create: (article) =>
    fetch('/api/articles', {
      method: 'POST',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article),
    }).then(json),

  update: (id, article) =>
    fetch(`/api/articles/${id}`, {
      method: 'PUT',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article),
    }).then(json),

  assignBarcode: (id, { barcode, variationId } = {}) =>
    fetch(`/api/articles/${id}/barcode`, {
      method: 'PUT',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode, variationId }),
    }).then(json),

  remove: (id) => fetch(`/api/articles/${id}`, { method: 'DELETE', ...credentials }).then(json),

  import: (csvText) =>
    fetch('/api/import', {
      method: 'POST',
      ...credentials,
      headers: { 'Content-Type': 'text/csv' },
      body: csvText,
    }).then(json),

  flushDb: () =>
    fetch('/api/flush', { method: 'POST', ...credentials }).then(json),

  exportCsv: async () => {
    const r = await fetch('/api/export', credentials);
    if (r.status === 401) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    if (!r.ok) throw new Error('Export failed.');
    const blob = await r.blob();
    const disposition = r.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] || 'items-export.csv';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};
