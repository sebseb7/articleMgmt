export function normalizePrice(value) {
  if (value === null || value === '') return null;
  let s = String(value).trim().replace(/\s/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    s = s.replace(',', '.');
  }
  const num = Number(s);
  if (!Number.isFinite(num)) throw new Error('Price must be a number.');
  return num;
}
