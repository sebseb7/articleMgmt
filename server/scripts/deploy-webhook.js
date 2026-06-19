#!/usr/bin/env node
import 'dotenv/config';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PORT = Number(process.env.WEBHOOK_PORT) || 3992;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const DEPLOY_COMMAND =
  process.env.DEPLOY_COMMAND ||
  'git pull && npm i . && pm2 start sumupbackend && npm run build';
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

let deploying = false;

function verifySignature(rawBody, signature) {
  if (!SECRET || !signature?.startsWith('sha256=')) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(rawBody)
    .digest('hex');
  const actual = signature.slice(7);
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

function runDeploy() {
  if (deploying) {
    console.log('[webhook] deploy already in progress, skipping');
    return false;
  }
  deploying = true;
  console.log('[webhook] starting deploy...');
  const child = spawn('bash', ['-lc', DEPLOY_COMMAND], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  child.on('close', (code) => {
    deploying = false;
    console.log(`[webhook] deploy finished (exit ${code})`);
  });
  child.on('error', (err) => {
    deploying = false;
    console.error('[webhook] deploy failed to start:', err.message);
  });
  return true;
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function parsePayload(rawBody, contentType) {
  const body = rawBody.toString('utf8');
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const payload = new URLSearchParams(body).get('payload');
    if (!payload) {
      throw new Error('missing payload field');
    }
    return JSON.parse(payload);
  }
  return JSON.parse(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    send(res, 405, 'Method not allowed');
    return;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const rawBody = Buffer.concat(chunks);
    const signature = req.headers['x-hub-signature-256'];

    if (!verifySignature(rawBody, signature)) {
      send(res, 401, 'Invalid signature');
      return;
    }

    const eventType = req.headers['x-github-event'];

    if (eventType === 'ping') {
      send(res, 200, 'pong');
      return;
    }

    if (eventType !== 'push') {
      send(res, 200, 'ignored');
      return;
    }

    let payload;
    try {
      payload = parsePayload(rawBody, req.headers['content-type']);
    } catch (err) {
      console.error('[webhook] failed to parse payload:', err.message);
      send(res, 400, 'Invalid payload');
      return;
    }

    const ref = payload.ref;
    if (ref && ref !== 'refs/heads/main' && ref !== 'refs/heads/master') {
      send(res, 200, 'ignored branch');
      return;
    }

    if (!runDeploy()) {
      send(res, 409, 'deploy already running');
      return;
    }

    send(res, 202, 'deploy started');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Deploy webhook listening on http://127.0.0.1:${PORT}`);
  if (!SECRET) {
    console.warn('[webhook] GITHUB_WEBHOOK_SECRET is not set; all requests will be rejected');
  }
});
