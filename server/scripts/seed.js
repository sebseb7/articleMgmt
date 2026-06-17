#!/usr/bin/env node
import { existsSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { DEMO_ARTICLES, DEMO_USER } from '../demo-data.js';
import {
  collectBarcodesFromParsedArticles,
  assertNoDuplicateBarcodes,
} from '../barcodes.js';
import { bumpLocalBarcodeMaxFromBarcodes } from '../metadata.js';
import { findOrCreateCategory, clearCategories } from '../categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const fresh = process.argv.includes('--fresh');
const dbPath = resolve(projectRoot, process.env.DB_PATH || 'data/data.db');

function removeDbFiles(path) {
  for (const file of [path, `${path}-wal`, `${path}-shm`]) {
    if (existsSync(file)) unlinkSync(file);
  }
}

if (fresh) {
  removeDbFiles(dbPath);
  console.log(`Removed existing database at ${dbPath}`);
}

const { default: db } = await import('../db.js');

const insertArticle = db.prepare(`
  INSERT INTO articles
    (item_uuid, item_name, tax_rate, category_id, image_url, visible_online,
     track_inventory, price, quantity, low_threshold, barcode,
     variant_uuid, sort_order)
  VALUES
    (@item_uuid, @item_name, @tax_rate, @category_id, @image_url, @visible_online,
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
      const info = insertArticle.run({ ...rest, category_id, sort_order: idx });
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

try {
  ensureDemoUser();
  const variationCount = importDemoArticles();
  console.log(
    `Seeded ${DEMO_ARTICLES.length} articles (${variationCount} variations) and user "${DEMO_USER.username}".`,
  );
  console.log(`Database: ${dbPath}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
