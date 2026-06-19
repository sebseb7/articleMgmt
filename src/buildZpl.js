const DOTS_PER_MM = 203 / 25.4;
const PRINT_SPEED_IPS = 2;

function escapeZplField(value) {
  return value.replace(/\^/g, '').replace(/~/g, '');
}

function formatPriceLabel(price) {
  let text;
  if (typeof price === 'number') {
    text = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } else {
    text = String(price).replace(/\s*€\s*$/, '').trim();
  }
  return escapeZplField(`${text} €`);
}

function estimateFont0TextWidth(text, fontHeight) {
  let width = 0;
  for (const char of text) {
    if (char === '1' || char === ',' || char === '.') width += fontHeight * 0.3;
    else if (char === ' ') width += fontHeight * 0.25;
    else if (char === '€') width += fontHeight * 0.58;
    else width += fontHeight * 0.54;
  }
  return Math.round(width);
}

/** 25,4 × 12,7 mm label — matches ZebraLabel app "25x13" size */
export function buildSmallLabelZpl(price, offset = { xMm: 0, yMm: 0 }) {
  const labelWidth = 203;
  const labelHeight = 102;
  const fontHeight = 48;
  const pillHeight = 60;
  const textPaddingLeft = 14;
  const textPaddingRight = 10;
  const textNudgeY = 5;
  const maxPillWidth = labelWidth - 8;

  const safePrice = formatPriceLabel(price);
  const textWidth = estimateFont0TextWidth(safePrice, fontHeight);
  const pillWidth = Math.min(
    textWidth + textPaddingLeft + textPaddingRight,
    maxPillWidth,
  );
  const pillX = Math.round((labelWidth - pillWidth) / 2);
  const pillY = Math.round((labelHeight - pillHeight) / 2);
  const textX = pillX + textPaddingLeft;
  const textY = pillY + Math.round((pillHeight - fontHeight) / 2) + textNudgeY;
  const textFieldWidth = pillWidth - textPaddingLeft - textPaddingRight;

  const lhX = Math.round(offset.xMm * DOTS_PER_MM);
  const lhY = Math.round(offset.yMm * DOTS_PER_MM);
  const labelHome = lhX === 0 && lhY === 0 ? '^LH0,0' : `^LH${lhX},${lhY}`;

  return `^XA
^CI28
^PR${PRINT_SPEED_IPS},${PRINT_SPEED_IPS},${PRINT_SPEED_IPS}
^PW${labelWidth}
^LL${labelHeight}
${labelHome}
^FO${pillX},${pillY}^GB${pillWidth},${pillHeight},${pillHeight},B,6^FS
^CF0,${fontHeight}
^FO${textX},${textY}^FB${textFieldWidth},1,0,L,0^FR^FD${safePrice}^FS
^XZ
`.trim() + '\r\n';
}

export function buildSmallLabelZplCopies(price, copies = 1, offset) {
  let zpl = buildSmallLabelZpl(price, offset);
  if (copies > 1) {
    zpl = zpl.replace('^XZ', `^PQ${copies}\n^XZ`);
  }
  return zpl;
}
