const RECONNECT_MS = 3000;

/**
 * Persistent SSE client for /api/v1/printer/events.
 * Session auth uses cookies (same-origin EventSource).
 * API tokens with app scope: pass accessToken for ?access_token=.
 */
export function connectPrinterEvents({ onPrinters, accessToken } = {}) {
  const printers = new Map();
  let es = null;
  let reconnectTimer = null;
  let closed = false;

  const notify = () => {
    onPrinters?.([...printers.values()]);
  };

  const handlePrinters = (list) => {
    printers.clear();
    for (const p of list || []) {
      printers.set(p.id, p);
    }
    notify();
  };

  const connect = () => {
    if (closed) return;
    const url = accessToken
      ? `/api/v1/printer/events?access_token=${encodeURIComponent(accessToken)}`
      : '/api/v1/printer/events';
    es = new EventSource(url);

    es.addEventListener('printers', (e) => {
      try {
        handlePrinters(JSON.parse(e.data).printers);
      } catch {
        // ignore malformed payloads
      }
    });

    es.addEventListener('printer_online', (e) => {
      try {
        const { printerId, name } = JSON.parse(e.data);
        printers.set(printerId, {
          id: printerId,
          name,
          connectedAt: new Date().toISOString(),
        });
        notify();
      } catch {
        // ignore
      }
    });

    es.addEventListener('printer_offline', (e) => {
      try {
        const { printerId } = JSON.parse(e.data);
        printers.delete(printerId);
        notify();
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      es?.close();
      es = null;
      if (!closed) {
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      }
    };
  };

  connect();

  return () => {
    closed = true;
    clearTimeout(reconnectTimer);
    es?.close();
    es = null;
  };
}
