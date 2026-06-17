import db from './db.js';

const LOCAL_BARCODE_MAX_KEY = 'local_barcode_max';
const DEFAULT_LOCAL_BARCODE_MAX = '2342000000000';

const getValue = db.prepare('SELECT value FROM metadata WHERE key = ?');
const setValue = db.prepare('UPDATE metadata SET value = ? WHERE key = ?');
const insertValue = db.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)');

export function allocateNextLocalBarcode() {
  return db.transaction(() => {
    let row = getValue.get(LOCAL_BARCODE_MAX_KEY);
    if (!row) {
      insertValue.run(LOCAL_BARCODE_MAX_KEY, DEFAULT_LOCAL_BARCODE_MAX);
      row = getValue.get(LOCAL_BARCODE_MAX_KEY);
    }
    const next = (BigInt(row.value) + 1n).toString();
    setValue.run(next, LOCAL_BARCODE_MAX_KEY);
    return next.padStart(13, '0');
  })();
}
