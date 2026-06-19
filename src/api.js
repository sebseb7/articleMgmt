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

  listChangelog: ({ page = 1, pageSize = 25 } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return fetch(`/api/changelog?${params}`, credentials).then(json);
  },

  stats: () => fetch('/api/stats', credentials).then(json),

  generateBarcode: () =>
    fetch('/api/barcode/generate', { method: 'POST', ...credentials }).then(json),

  lookupBarcode: (barcode) => {
    const params = new URLSearchParams({ barcode: String(barcode) });
    return fetch(`/api/barcodes/lookup?${params}`, credentials).then(json);
  },

  listMissingBarcodes: () => fetch('/api/missing', credentials).then(json),

  upsertMissingBarcode: (barcode, note) =>
    fetch('/api/missing', {
      method: 'PUT',
      ...credentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode, note }),
    }).then(json),

  removeMissingBarcode: (barcode) =>
    fetch(`/api/missing/${encodeURIComponent(barcode)}`, {
      method: 'DELETE',
      ...credentials,
    }).then(json),

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

  importCsv: async (csvText, onProgress) => {
    const r = await fetch('/api/import', {
      method: 'POST',
      ...credentials,
      headers: { 'Content-Type': 'text/csv' },
      body: csvText,
    });
    if (r.status === 401) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const contentType = r.headers.get('content-type') || '';
    if (!r.ok || !contentType.includes('ndjson')) {
      return json(r);
    }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.phase === 'done') {
          result = event;
        } else if (event.phase === 'error') {
          throw new Error(event.error || 'Import failed.');
        } else {
          await new Promise((resolve) => {
            setTimeout(() => {
              onProgress?.(event);
              resolve();
            }, 0);
          });
        }
      }
    }

    if (buffer.trim()) {
      const event = JSON.parse(buffer);
      if (event.phase === 'done') {
        result = event;
      } else if (event.phase === 'error') {
        throw new Error(event.error || 'Import failed.');
      } else {
        await new Promise((resolve) => {
          setTimeout(() => {
            onProgress?.(event);
            resolve();
          }, 0);
        });
      }
    }

    if (!result) {
      throw new Error('Import failed.');
    }
    return result;
  },

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
