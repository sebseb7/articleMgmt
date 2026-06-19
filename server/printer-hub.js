import { randomBytes } from 'node:crypto';

/** @typedef {{ id: string, name: string, res: import('express').Response, connectedAt: string }} PrinterAgent */
/** @typedef {{ res: import('express').Response, auth: object }} PrinterClient */

/** @type {Map<string, PrinterAgent>} */
const agents = new Map();
/** @type {Set<PrinterClient>} */
const clients = new Set();
/** @type {Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout, printerId: string }>} */
const pendingJobs = new Map();

const JOB_TIMEOUT_MS = 60_000;

function makeId() {
  return randomBytes(8).toString('hex');
}

export function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function listPrinters() {
  return [...agents.values()].map(({ id, name, connectedAt }) => ({ id, name, connectedAt }));
}

function broadcastToClients(event, data) {
  for (const client of clients) {
    try {
      sseWrite(client.res, event, data);
    } catch {
      clients.delete(client);
    }
  }
}

function beginSse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
}

export function connectAgent(req, res, name) {
  const id = makeId();
  const printerName = String(name || '').trim() || `printer-${id.slice(0, 6)}`;
  const agent = { id, name: printerName, res, connectedAt: new Date().toISOString() };
  agents.set(id, agent);

  beginSse(res);
  sseWrite(res, 'registered', { printerId: id, name: printerName });
  broadcastToClients('printer_online', { printerId: id, name: printerName });

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    agents.delete(id);
    broadcastToClients('printer_offline', { printerId: id, name: printerName });
  });
}

export function connectClient(req, res) {
  const client = { res, auth: req.auth };
  clients.add(client);

  beginSse(res);
  sseWrite(res, 'printers', { printers: listPrinters() });

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

export function queuePrint(printerId, zpl, meta = {}) {
  const agent = agents.get(printerId);
  if (!agent) {
    const err = new Error('Printer not connected.');
    err.status = 404;
    throw err;
  }
  const zplText = String(zpl ?? '');
  if (!zplText.trim()) {
    const err = new Error('ZPL payload is required.');
    err.status = 400;
    throw err;
  }

  const jobId = makeId();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingJobs.delete(jobId);
      const err = new Error('Print job timed out.');
      err.status = 504;
      reject(err);
    }, JOB_TIMEOUT_MS);

    pendingJobs.set(jobId, { resolve, reject, timeout, printerId });

    try {
      sseWrite(agent.res, 'print', { jobId, zpl: zplText, ...meta });
      broadcastToClients('print_queued', { jobId, printerId, printerName: agent.name });
    } catch (e) {
      clearTimeout(timeout);
      pendingJobs.delete(jobId);
      reject(e);
    }
  });
}

export function completePrintJob(printerId, { jobId, ok, error }) {
  const pending = pendingJobs.get(jobId);
  if (!pending) {
    const err = new Error('Unknown or expired print job.');
    err.status = 404;
    throw err;
  }
  if (pending.printerId !== printerId) {
    const err = new Error('Print job does not belong to this printer.');
    err.status = 403;
    throw err;
  }

  clearTimeout(pending.timeout);
  pendingJobs.delete(jobId);

  const result = {
    jobId,
    printerId,
    ok: Boolean(ok),
    error: error ? String(error) : null,
  };

  broadcastToClients('print_result', result);

  if (result.ok) {
    pending.resolve(result);
  } else {
    const err = new Error(result.error || 'Print failed.');
    err.status = 500;
    err.result = result;
    pending.reject(err);
  }

  return result;
}

export function getConnectedPrinters() {
  return listPrinters();
}
