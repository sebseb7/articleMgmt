import db from './db.js';
import { normalizeBarcode } from './barcodes.js';

const getByBarcode = db.prepare(
  'SELECT barcode, note FROM missing WHERE barcode = ?',
);
const upsertMissing = db.prepare(`
  INSERT INTO missing (barcode, note) VALUES (?, ?)
  ON CONFLICT(barcode) DO UPDATE SET note = excluded.note
`);
const deleteByBarcode = db.prepare('DELETE FROM missing WHERE barcode = ?');
const listAll = db.prepare(
  'SELECT barcode, note FROM missing ORDER BY barcode',
);

export function getMissingBarcode(barcode) {
  const value = normalizeBarcode(barcode);
  if (!value) return null;
  return getByBarcode.get(value) ?? null;
}

export function listMissingBarcodes() {
  return listAll.all();
}

export function upsertMissingBarcode(barcode, note) {
  const value = normalizeBarcode(barcode);
  if (!value) throw new Error('Barcode is required.');
  const trimmedNote = String(note ?? '').trim();
  upsertMissing.run(value, trimmedNote || null);
  return { barcode: value, note: trimmedNote || null };
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
