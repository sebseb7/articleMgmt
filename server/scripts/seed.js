#!/usr/bin/env node
import { existsSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { DEMO_ARTICLES, DEMO_USER, DEMO_MISSING_BARCODES } from '../demo-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const fresh = process.argv.includes('--fresh');
const dbPath = resolve(projectRoot, process.env.DB_PATH || 'data/data.db');

function removeDbFiles(path) {
  for (const file of [path, `${path}-wal`, `${path}-shm`]) {
    if (!existsSync(file)) continue;
    try {
      unlinkSync(file);
    } catch (e) {
      if (e.code === 'EBUSY' || e.code === 'EPERM') {
        console.error(
          `Cannot remove ${file}: the file is in use.\n`
          + 'Stop the API server first (Ctrl+C in the terminal running npm run server or npm run dev),\n'
          + 'close any open database files in your editor, then run seed:fresh again.\n'
          + 'On Windows, check Task Manager for leftover "node.exe server/index.js" processes.',
        );
        process.exit(1);
      }
      throw e;
    }
  }
}

if (fresh) {
  removeDbFiles(dbPath);
  console.log(`Removed existing database at ${dbPath}`);
}

const { default: db } = await import('../db.js');
const {
  collectBarcodesFromParsedArticles,
  assertNoDuplicateBarcodes,
} = await import('../barcodes.js');
const { bumpLocalBarcodeMaxFromBarcodes } = await import('../metadata.js');
const { findOrCreateCategory, clearCategories } = await import('../categories.js');

const insertArticle = db.prepare(`
  INSERT INTO articles
    (item_uuid, item_name, tax_rate, category_id, image_url, image_thumb_avif, visible_online,
     track_inventory, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@item_uuid, @item_name, @tax_rate, @category_id, @image_url, @image_thumb_avif, @visible_online,
     @track_inventory, @price, @quantity, @low_threshold, @barcode,
     @variant_uuid, @sort_order)
`);

const insertVariation = db.prepare(`
  INSERT INTO variations
    (article_id, variation_name, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@article_id, @variation_name, @price, @quantity, @low_threshold, @barcode,
     @variant_uuid, @sort_order)
`);

function variationPayload(v, articleId, order) {
  return {
    article_id: articleId,
    variation_name: v.variation_name ?? '',
    price: v.price ?? null,
    quantity: v.quantity ?? null,
    low_threshold: v.low_threshold ?? null,
    barcode: v.barcode ?? null,
    variant_uuid: v.variant_uuid ?? null,
    sort_order: order,
  };
}

function ensureDemoUser() {
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(DEMO_USER.username);
  if (existing) return;
  const hash = bcrypt.hashSync(DEMO_USER.password, 12);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
    DEMO_USER.username,
    hash,
  );
}

function importDemoArticles() {
  const importedBarcodes = collectBarcodesFromParsedArticles(DEMO_ARTICLES);
  assertNoDuplicateBarcodes(importedBarcodes);
  bumpLocalBarcodeMaxFromBarcodes(importedBarcodes);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM variations').run();
    db.prepare('DELETE FROM articles').run();
    clearCategories();
    db.prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('articles','variations','categories')",
    ).run();

    let variationCount = 0;
    DEMO_ARTICLES.forEach((a, idx) => {
      const { variations, category, ...rest } = a;
      const category_id = findOrCreateCategory(category);
      const info = insertArticle.run({
        ...rest,
        category_id,
        sort_order: idx,
        image_thumb_avif: rest.image_thumb_avif ?? null,
      });
      const articleId = info.lastInsertRowid;
      variations.forEach((v, i) => {
        insertVariation.run(variationPayload(v, articleId, i));
      });
      variationCount += variations.length > 0 ? variations.length : 1;
    });
    return variationCount;
  });

  return tx();
}

function seedMissingBarcodes() {
  const upsert = db.prepare(`
    INSERT INTO missing (barcode, note) VALUES (?, ?)
    ON CONFLICT(barcode) DO UPDATE SET note = excluded.note
  `);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM missing').run();
    for (const entry of DEMO_MISSING_BARCODES) {
      upsert.run(entry.barcode, entry.note);
    }
  });
  tx();
}

try {
  ensureDemoUser();
  const variationCount = importDemoArticles();
  seedMissingBarcodes();
  console.log(
    `Seeded ${DEMO_ARTICLES.length} articles (${variationCount} variations), `
    + `${DEMO_MISSING_BARCODES.length} missing barcodes, and user "${DEMO_USER.username}".`,
  );
  console.log(`Database: ${dbPath}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
