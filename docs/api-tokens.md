# Token-based API

Machine-to-machine access to article prices and label printers.

## Authentication

Send the token on every HTTP request:

```
Authorization: Bearer amt_<secret>
```

For **Server-Sent Events** (`EventSource` cannot set headers), pass the same token as a query parameter instead:

```
GET /api/v1/printer/events?access_token=amt_<secret>
```

Browser sessions (logged-in UI) use the `auth_token` cookie and do not need a bearer token.

Tokens are created in the web UI under **Settings → API tokens**. The full secret is shown once at creation (copy or scan the QR code). Only a short prefix is stored after that.

## QR code format

The QR dialog encodes a JSON object (UTF-8, no whitespace):

```json
{"url":"https://articles.example.com","token":"amt_…"}
```

| Field   | Description |
|---------|-------------|
| `url`   | API server base URL — `window.location.origin` where the token was created (scheme + host + port, no trailing slash) |
| `token` | Full bearer token (`amt_…`) |

Clients call `{url}/api/v1/…` and send `Authorization: Bearer {token}` (or `access_token` for SSE).

## Scopes

| Scope     | Role |
|-----------|------|
| `read`    | Price lookup only |
| `write`   | Price create/update **and** printer client (list printers, print ZPL) |
| `admin`   | Price delete by barcode |
| `printer` | printer agent |

Assign only the scopes each client needs. A physical printer daemon uses `printer`; an app that prints labels uses `write` (or a browser session).

---

## `write` scope — price API & printer client

### Price endpoints

Base path: `/api/v1/price`

#### GET `?barcode=<barcode>` — look up price

```bash
curl -H "Authorization: Bearer amt_…" \
  "https://articles.example.com/api/v1/price?barcode=2342000000001"
```

**Found:**

```json
{
  "found": true,
  "barcode": "2342000000001",
  "type": "article",
  "articleId": 1,
  "variationId": null,
  "name": "Espresso",
  "price": 2.5,
  "taxRate": 0.19
}
```

**Not found:** `{ "found": false, "barcode": "2342000000001" }`

#### PUT — create or update price

```bash
curl -X PUT -H "Authorization: Bearer amt_…" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"2342000000001","price":2.80,"name":"Espresso","taxRate":0.19}' \
  https://articles.example.com/api/v1/price
```

`price` is required. `name` and `taxRate` (or `tax_rate`) are optional. Creates a minimal article if the barcode is unknown.

### `admin` scope — delete price by barcode

#### DELETE `?barcode=<barcode>`

```bash
curl -X DELETE -H "Authorization: Bearer amt_…" \
  "https://articles.example.com/api/v1/price?barcode=2342000000001"
```

Deletes the article (article barcode) or variation (variation barcode). Returns `404` if not found.

### Printer client (also available with browser session)

Logged-in users have the same printer access as a `write` token.

#### GET `/api/v1/printer/printers` — snapshot of connected printers

```bash
curl -H "Authorization: Bearer amt_…" \
  https://articles.example.com/api/v1/printer/printers
```

```json
{
  "printers": [
    { "id": "a1b2c3d4", "name": "zebra-counter", "connectedAt": "2026-06-19T12:00:00.000Z" }
  ]
}
```

#### GET `/api/v1/printer/events` — SSE subscription

Long-lived stream of printer presence and print job updates.

```bash
curl -N -H "Authorization: Bearer amt_…" \
  https://articles.example.com/api/v1/printer/events
```

Or with `EventSource` and query token:

```javascript
const es = new EventSource(`/api/v1/printer/events?access_token=${encodeURIComponent(token)}`);
```

**Server → client events**

| Event            | Payload | When |
|------------------|---------|------|
| `printers`       | `{ printers: [{ id, name, connectedAt }] }` | On connect |
| `printer_online` | `{ printerId, name }` | Agent connected |
| `printer_offline`| `{ printerId, name }` | Agent disconnected |
| `print_queued`   | `{ jobId, printerId, printerName }` | Job sent to agent |
| `print_result`   | `{ jobId, printerId, ok, error }` | Agent acknowledged job |

Lines are standard SSE: `event: <name>\ndata: <json>\n\n`. Comment lines (`: heartbeat`) are keep-alives.

#### POST `/api/v1/printer/print` — send ZPL to a printer

Blocks until the agent acknowledges (or times out after 60s).

```bash
curl -X POST -H "Authorization: Bearer amt_…" \
  -H "Content-Type: application/json" \
  -d '{"printerId":"a1b2c3d4","zpl":"^XA^FO50,50^ADN,36,20^FDHello^FS^XZ"}' \
  https://articles.example.com/api/v1/printer/print
```

**Success:**

```json
{ "jobId": "e5f6…", "printerId": "a1b2c3d4", "ok": true, "error": null }
```

The same result is broadcast on the `print_result` SSE event to all subscribed clients.

---

## `printer` scope — printer agent

Implement a small daemon on the machine attached to the Zebra (or compatible) printer. It maintains one persistent SSE connection to the server and receives print jobs as ZPL blobs.

### Overview

```
┌─────────────┐   SSE (printer)    ┌──────────────┐   SSE (write/session)   ┌──────────────┐
│ Printer     │◄──────────────────►│ API server   │◄───────────────────────►│ Print client │
│ agent       │   print / ack      │ (multiplex)  │   events / POST print   │ (write/UI)   │
└─────────────┘                    └──────────────┘                         └──────────────┘
       │                                    │
       └── sends ZPL to local printer ──────┘
```

The server keeps one SSE connection per agent. All `write`/session clients share printer status and job results through a separate client SSE channel. Print jobs are routed from `POST /print` to the correct agent SSE stream.

### 1. Connect — GET `/api/v1/printer/agent`

Requires `printer` scope. Optional query `name` (defaults to `printer-<id>`).

```bash
curl -N -H "Authorization: Bearer amt_…" \
  "https://articles.example.com/api/v1/printer/agent?name=zebra-counter"
```

Use `fetch` with a readable stream, or any SSE client. **Do not** use browser `EventSource` for the agent if you need custom headers — use `fetch` + stream parsing or a library.

**First event — `registered`**

```json
{ "printerId": "a1b2c3d4e5f6g7h8", "name": "zebra-counter" }
```

Store `printerId`; it is required for acknowledgements.

**Subsequent events — `print`**

```json
{
  "jobId": "f9e8d7c6b5a43210",
  "zpl": "^XA^FO50,50^ADN,36,20^FDHello^FS^XZ",
  "requestedBy": "demo",
  "via": "session"
}
```

Send `zpl` to the printer (raw TCP port 9100, USB, or driver). ZPL is the Zebra Programming Language; the blob is opaque to the server.

### 2. Acknowledge — POST `/api/v1/printer/agent/ack`

After printing (or on failure), report the outcome:

```bash
curl -X POST -H "Authorization: Bearer amt_…" \
  -H "Content-Type: application/json" \
  -d '{"printerId":"a1b2c3d4e5f6g7h8","jobId":"f9e8d7c6b5a43210","ok":true}' \
  https://articles.example.com/api/v1/printer/agent/ack
```

On failure:

```json
{ "printerId": "…", "jobId": "…", "ok": false, "error": "Paper out" }
```

The server completes the waiting `POST /print` request and emits `print_result` to client SSE subscribers.

### 3. Agent lifecycle

1. Open SSE to `/api/v1/printer/agent` with `printer` token.
2. Wait for `registered`; save `printerId`.
3. On `print`, write `zpl` to the device.
4. POST `/api/v1/printer/agent/ack` with `jobId` and `ok`.
5. On disconnect, server emits `printer_offline` to clients.
6. Reconnect with exponential backoff; a new `printerId` is assigned each connection.

### Minimal agent loop (pseudo-code)

```javascript
async function runAgent(token, printerName) {
  const res = await fetch(`${baseUrl}/api/v1/printer/agent?name=${printerName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let printerId = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const eventLine = chunk.match(/^event: (.+)$/m);
      const dataLine = chunk.match(/^data: (.+)$/m);
      if (!eventLine || !dataLine) continue;

      const event = eventLine[1];
      const data = JSON.parse(dataLine[1]);

      if (event === 'registered') {
        printerId = data.printerId;
      } else if (event === 'print') {
        try {
          await sendZplToPrinter(data.zpl);
          await ack(token, printerId, data.jobId, true);
        } catch (e) {
          await ack(token, printerId, data.jobId, false, e.message);
        }
      }
    }
  }
}
```

### Agent requirements

- Token with **`printer`** scope only (no `write` needed on the device).
- Handle SSE reconnects; jobs in flight when disconnected will time out on the client side.
- Send valid ZPL; the server does not validate label content.
- Ack every `print` event exactly once with the matching `jobId`.

---

## Errors

| Status | Meaning |
|--------|---------|
| `401`  | Missing or invalid auth |
| `403`  | Token lacks the required scope |
| `400`  | Invalid request body or parameters |
| `404`  | Barcode or printer not found |
| `504`  | Print job timed out (no agent ack within 60s) |

JSON errors: `{ "error": "…" }`.
