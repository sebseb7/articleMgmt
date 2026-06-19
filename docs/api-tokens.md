# Token-based price API

Machine-to-machine access to look up and manage prices by barcode.

## Authentication

Send the token in every request:

```
Authorization: Bearer amt_<secret>
```

Tokens are created in the web UI under **Settings → API tokens**. The full secret is shown once at creation (copy or scan the QR code). Only a short prefix is stored for identification after that.

## QR code format

When you open the QR dialog after creating a token, the code encodes a JSON object (UTF-8, no whitespace):

```json
{"url":"https://articles.example.com","token":"amt_…"}
```

| Field   | Description |
|---------|-------------|
| `url`   | API server base URL — `window.location.origin` from the browser where the token was created (scheme + host + port, no trailing slash) |
| `token` | Full bearer token (`amt_…`) |

Clients should parse the JSON, call `{url}/api/v1/price`, and send `Authorization: Bearer {token}`.

Example (dev with Vite on port 4991, API proxied at `/api`):

```json
{"url":"http://localhost:4991","token":"amt_xYz…"}
```

## Scopes

| Scope   | Allows |
|---------|--------|
| `read`  | Look up price by barcode |
| `write` | Create or update price (and optional name / tax rate) |
| `admin` | Delete article or variation by barcode |

Assign only the scopes a client needs.

## Endpoints

Base URL: `http://localhost:3991` (or your deployed host).

### GET `/api/v1/price?barcode=<barcode>` — read

```bash
curl -H "Authorization: Bearer amt_…" \
  "http://localhost:3991/api/v1/price?barcode=2342000000001"
```

**Found (article):**

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

**Not found:**

```json
{ "found": false, "barcode": "2342000000001" }
```

### PUT `/api/v1/price` — write

Updates price on an existing article or variation. If the barcode is unknown, creates a minimal article.

```bash
curl -X PUT -H "Authorization: Bearer amt_…" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"2342000000001","price":2.80,"name":"Espresso","taxRate":0.19}' \
  http://localhost:3991/api/v1/price
```

`price` is required. `name` and `taxRate` (or `tax_rate`) are optional.

### DELETE `/api/v1/price?barcode=<barcode>` — admin

Deletes the article (if the barcode is on the article) or the variation (if on a variation).

```bash
curl -X DELETE -H "Authorization: Bearer amt_…" \
  "http://localhost:3991/api/v1/price?barcode=2342000000001"
```

Returns `404` if the barcode does not exist.

## Errors

| Status | Meaning |
|--------|---------|
| `401`  | Missing or invalid token |
| `403`  | Token lacks the required scope |
| `400`  | Invalid request (e.g. missing barcode or price) |
| `404`  | Barcode not found (delete only) |

Responses use `{ "error": "…" }`.
