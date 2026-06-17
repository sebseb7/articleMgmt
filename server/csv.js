import Papa from 'papaparse';

// The exact 47-column header of the SumUp item export, in order.
export const HEADER = [
  'Item name',
  'Variations',
  'Option set 1',
  'Option 1',
  'Option set 2',
  'Option 2',
  'Option set 3',
  'Option 3',
  'Option set 4',
  'Option 4',
  'Is variation visible? (Yes/No)',
  'Price',
  'Cost price',
  'Variable price? (Yes/No)',
  'Tax rate (%)',
  'On sale in Online Store?',
  'Regular price (before sale)',
  'Set up different prices and VAT for takeaway',
  'Takeaway price',
  'Takeaway tax rate',
  'Unit',
  'Track inventory? (Yes/No)',
  'Quantity',
  'Low stock threshold',
  'SKU',
  'Barcode',
  'Modifiers',
  'Description (Online Store and Invoices only)',
  'Category',
  'Display item at Checkout? (Yes/No)',
  'Display colour in POS checkout',
  'Image 1',
  'Image 2',
  'Image 3',
  'Image 4',
  'Image 5',
  'Image 6',
  'Image 7',
  'Display item in Online Store? (Yes/No)',
  'SEO title (Online Store only)',
  'SEO description (Online Store only)',
  'Shipping weight [kg] (Online Store only)',
  'Display service in Bookings? (Yes/No)',
  'Duration [minutes] (Bookings only)',
  'Location [business/customer] (Bookings only)',
  'Item id (Do not change)',
  'Variant id (Do not change)',
];

// Column indices we actually read/write.
const C = {
  ITEM_NAME: 0,
  VARIATIONS: 1,
  IS_VAR_VISIBLE: 10,
  PRICE: 11,
  VARIABLE_PRICE: 13,
  TAX_RATE: 14,
  ON_SALE: 15,
  TAKEAWAY_SETUP: 17,
  UNIT: 20,
  TRACK_INVENTORY: 21,
  QUANTITY: 22,
  LOW_THRESHOLD: 23,
  BARCODE: 25,
  CATEGORY: 28,
  DISPLAY_CHECKOUT: 29,
  IMAGE_1: 31,
  DISPLAY_ONLINE: 38,
  SEO_TITLE: 39,
  ITEM_ID: 45,
  VARIANT_ID: 46,
};

const trimOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

const toNumber = (v) => {
  const s = trimOrNull(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toInt = (v) => {
  const n = toNumber(v);
  return n === null ? null : Math.trunc(n);
};

const fmtDecimal = (v) => (v === null || v === undefined ? '' : Number(v).toFixed(2));
const fmtInt = (v) => (v === null || v === undefined ? '' : String(Math.trunc(v)));

/**
 * Parse a SumUp CSV string into an array of articles, each with nested variations.
 * Article rows are identified by a non-empty "Item name"; following rows with an
 * empty item name but a "Variations" value belong to the current article.
 */
export function parseCsv(text) {
  const { data } = Papa.parse(text, { skipEmptyLines: true });
  const articles = [];
  let current = null;
  let articleOrder = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;

    const itemName = trimOrNull(row[C.ITEM_NAME]);
    const variationName = trimOrNull(row[C.VARIATIONS]);

    // Skip the header row.
    if (itemName === 'Item name') continue;

    if (itemName !== null) {
      current = {
        item_uuid: trimOrNull(row[C.ITEM_ID]),
        item_name: itemName,
        tax_rate: toNumber(row[C.TAX_RATE]),
        category: trimOrNull(row[C.CATEGORY]),
        image_url: trimOrNull(row[C.IMAGE_1]),
        visible_online: trimOrNull(row[C.DISPLAY_ONLINE]) === 'Yes' ? 1 : 0,
        track_inventory: trimOrNull(row[C.TRACK_INVENTORY]) === 'Yes' ? 1 : 0,
        // Standalone fields (only meaningful when there are no variations):
        price: toNumber(row[C.PRICE]),
        quantity: toInt(row[C.QUANTITY]),
        low_threshold: toInt(row[C.LOW_THRESHOLD]),
        barcode: trimOrNull(row[C.BARCODE]),
        variant_uuid: trimOrNull(row[C.VARIANT_ID]),
        sort_order: articleOrder++,
        variations: [],
      };
      articles.push(current);
    } else if (variationName !== null && current) {
      current.variations.push({
        variation_name: variationName,
        price: toNumber(row[C.PRICE]),
        quantity: toInt(row[C.QUANTITY]),
        low_threshold: toInt(row[C.LOW_THRESHOLD]),
        barcode: trimOrNull(row[C.BARCODE]),
        variant_uuid: trimOrNull(row[C.VARIANT_ID]),
        sort_order: current.variations.length,
      });
    }
  }

  return articles;
}

function emptyRow() {
  return new Array(HEADER.length).fill('');
}

/**
 * Serialise articles (with nested variations) back into the exact SumUp CSV format.
 */
export function buildCsv(articles) {
  const rows = [HEADER.slice()];

  for (const a of articles) {
    const variations = a.variations || [];
    const standalone = variations.length === 0;

    const row = emptyRow();
    row[C.ITEM_NAME] = a.item_name ?? '';
    row[C.VARIABLE_PRICE] = 'No';
    row[C.TAX_RATE] = fmtDecimal(a.tax_rate);
    row[C.ON_SALE] = 'No';
    row[C.TAKEAWAY_SETUP] = 'No';
    row[C.UNIT] = 'each.each';
    row[C.TRACK_INVENTORY] = a.track_inventory ? 'Yes' : 'No';
    row[C.CATEGORY] = a.category ?? '';
    row[C.DISPLAY_CHECKOUT] = 'Yes';
    row[C.IMAGE_1] = a.image_url ?? '';
    row[C.DISPLAY_ONLINE] = a.visible_online ? 'Yes' : 'No';
    row[C.SEO_TITLE] = a.item_name ?? '';
    row[C.ITEM_ID] = a.item_uuid ?? '';

    if (standalone) {
      // A standalone item carries its own price/stock and an implicit variant.
      row[C.IS_VAR_VISIBLE] = 'Yes';
      row[C.PRICE] = fmtDecimal(a.price);
      row[C.QUANTITY] = fmtInt(a.quantity);
      row[C.LOW_THRESHOLD] = fmtInt(a.low_threshold);
      row[C.BARCODE] = a.barcode ?? '';
      row[C.VARIANT_ID] = a.variant_uuid ?? '';
    }
    rows.push(row);

    for (const v of variations) {
      const vrow = emptyRow();
      vrow[C.VARIATIONS] = v.variation_name ?? '';
      vrow[C.IS_VAR_VISIBLE] = 'Yes';
      vrow[C.PRICE] = fmtDecimal(v.price);
      vrow[C.QUANTITY] = fmtInt(v.quantity);
      vrow[C.LOW_THRESHOLD] = fmtInt(v.low_threshold);
      vrow[C.BARCODE] = v.barcode ?? '';
      vrow[C.VARIANT_ID] = v.variant_uuid ?? '';
      rows.push(vrow);
    }
  }

  return Papa.unparse(rows, { quotes: false, newline: '\n' });
}
