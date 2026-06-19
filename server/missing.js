import db from './db.js';
import { lookupBarcode, normalizeBarcode } from './barcodes.js';
import { normalizePrice } from './priceUtils.js';

const getByBarcode = db.prepare(
  'SELECT barcode, note, price FROM missing WHERE barcode = ?',
);
const upsertMissing = db.prepare(`
  INSERT INTO missing (barcode, note, price) VALUES (?, ?, ?)
  ON CONFLICT(barcode) DO UPDATE SET
    note = excluded.note,
    price = excluded.price
`);
const deleteByBarcode = db.prepare('DELETE FROM missing WHERE barcode = ?');
const listAll = db.prepare(
  'SELECT barcode, note, price FROM missing ORDER BY barcode',
);

export function getMissingBarcode(barcode) {
  const value = normalizeBarcode(barcode);
  if (!value) return null;
  return getByBarcode.get(value) ?? null;
}

export function listMissingBarcodes() {
  return listAll.all();
}

export function upsertMissingBarcode(barcode, { note, price } = {}) {
  const value = normalizeBarcode(barcode);
  if (!value) throw new Error('Barcode is required.');
  const { article, variation } = lookupBarcode(value);
  if (article || variation) {
    const err = new Error(`Barcode "${value}" is already used by an article or variation.`);
    err.code = 'barcode_in_catalog';
    throw err;
  }
  const existing = getByBarcode.get(value);
  let nextNote = existing?.note ?? null;
  let nextPrice = existing?.price ?? null;
  if (note !== undefined) {
    const trimmedNote = String(note ?? '').trim();
    nextNote = trimmedNote || null;
  }
  if (price !== undefined) {
    nextPrice = normalizePrice(price);
  }
  if (existing && existing.note === nextNote && existing.price === nextPrice) {
    return { barcode: value, note: nextNote, price: nextPrice, unchanged: true };
  }
  upsertMissing.run(value, nextNote, nextPrice);
  return { barcode: value, note: nextNote, price: nextPrice };
}

export function deleteMissingBarcode(barcode) {
  const value = normalizeBarcode(barcode);
  if (!value) throw new Error('Barcode is required.');
  const existing = getByBarcode.get(value);
  if (!existing) throw new Error('Barcode is not on the missing list.');
  deleteByBarcode.run(value);
}

export function clearMissingBarcodes() {
  db.prepare('DELETE FROM missing').run();
}
