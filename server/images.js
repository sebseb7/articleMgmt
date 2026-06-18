import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import sharp from 'sharp';
import { dbPath } from './db.js';

export const imagesDir = join(dirname(dbPath), 'images');
mkdirSync(imagesDir, { recursive: true });

const FETCH_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function fileStemForUrl(url, idHint) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 12);
  const safeId = String(idHint ?? 'item').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  return `${safeId}-${hash}`;
}

function extensionFromUrl(url, contentType) {
  try {
    const ext = extname(new URL(url).pathname);
    if (ext && ext.length <= 6) return ext.toLowerCase();
  } catch {
    // ignore invalid URL paths
  }
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  return '.jpg';
}

export function resetImagesDir() {
  rmSync(imagesDir, { recursive: true, force: true });
  mkdirSync(imagesDir, { recursive: true });
}

/**
 * Download an article image, store the original beside the database, and return
 * a 32×32 AVIF thumbnail encoded as base64 for SQLite storage.
 */
export async function importArticleImage(imageUrl, idHint) {
  const url = String(imageUrl ?? '').trim();
  if (!url) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Image fetch failed (${response.status})`);
  }

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error('Empty image response');
  }
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds size limit');
  }

  const input = Buffer.from(arrayBuffer);
  const stem = fileStemForUrl(url, idHint);
  const ext = extensionFromUrl(url, contentType);
  writeFileSync(join(imagesDir, `${stem}${ext}`), input);

  const thumbBuffer = await sharp(input)
    .resize(32, 32, { fit: 'cover' })
    .avif()
    .toBuffer();
  writeFileSync(join(imagesDir, `${stem}-32.avif`), thumbBuffer);

  return thumbBuffer.toString('base64');
}

export async function enrichArticlesWithImageThumbs(articles, onProgress) {
  const enriched = [];
  const thumbnailTotal = articles.filter((a) => a.image_url).length;
  let thumbnailIndex = 0;

  for (const article of articles) {
    if (!article.image_url) {
      enriched.push({ ...article, image_thumb_avif: null });
      continue;
    }
    thumbnailIndex += 1;
    onProgress?.({
      done: thumbnailIndex - 1,
      total: thumbnailTotal,
      itemName: article.item_name,
      active: thumbnailIndex,
    });
    try {
      const idHint = article.item_uuid ?? article.sort_order;
      const image_thumb_avif = await importArticleImage(article.image_url, idHint);
      enriched.push({ ...article, image_thumb_avif });
    } catch (e) {
      console.warn(
        `Thumbnail skipped for "${article.item_name}" (${article.image_url}): ${e.message}`,
      );
      enriched.push({ ...article, image_thumb_avif: null });
    }
    onProgress?.({
      done: thumbnailIndex,
      total: thumbnailTotal,
      itemName: article.item_name,
    });
  }
  return enriched;
}
