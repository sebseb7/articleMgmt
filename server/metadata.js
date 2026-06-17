import db from './db.js';

const LOCAL_BARCODE_MAX_KEY = 'local_barcode_max';
const LOCAL_BARCODE_RANGE_MIN = 2342000000000n;
const LOCAL_BARCODE_RANGE_MAX = 2342999999999n;

const getValue = db.prepare('SELECT value FROM metadata WHERE key = ?');
const setValue = db.prepare('UPDATE metadata SET value = ? WHERE key = ?');
const insertValue = db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)');

function ensureLocalBarcodeMaxRow() {
  let row = getValue.get(LOCAL_BARCODE_MAX_KEY);
  if (!row) {
    insertValue.run(LOCAL_BARCODE_MAX_KEY, LOCAL_BARCODE_RANGE_MIN.toString());
    row = getValue.get(LOCAL_BARCODE_MAX_KEY);
  }
  return row;
}

export function isInLocalBarcodeRange(barcode) {
  const value = String(barcode ?? '').trim();
  if (!/^\d+$/.test(value)) return false;
  const n = BigInt(value);
  return n >= LOCAL_BARCODE_RANGE_MIN && n <= LOCAL_BARCODE_RANGE_MAX;
}

export function bumpLocalBarcodeMaxFromBarcodes(barcodes) {
  let maxInRange = null;
  for (const raw of barcodes) {
    if (!isInLocalBarcodeRange(raw)) continue;
    const n = BigInt(String(raw).trim());
    if (maxInRange === null || n > maxInRange) maxInRange = n;
  }
  if (maxInRange === null) return;

  db.transaction(() => {
    const row = ensureLocalBarcodeMaxRow();
    const current = BigInt(row.value);
    if (maxInRange > current) {
      setValue.run(maxInRange.toString(), LOCAL_BARCODE_MAX_KEY);
    }
  })();
}

export function allocateNextLocalBarcode() {
  return db.transaction(() => {
    const row = ensureLocalBarcodeMaxRow();
    const next = (BigInt(row.value) + 1n).toString();
    setValue.run(next, LOCAL_BARCODE_MAX_KEY);
    return next.padStart(13, '0');
  })();
}
