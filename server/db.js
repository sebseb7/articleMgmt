import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
export const dataDir = join(projectRoot, 'data');
mkdirSync(dataDir, { recursive: true });
export const dbPath = process.env.DB_PATH
  ? join(projectRoot, process.env.DB_PATH)
  : join(dataDir, 'data.db');
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE
  );

  CREATE TABLE IF NOT EXISTS articles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    item_uuid       TEXT UNIQUE,
    item_name       TEXT NOT NULL,
    tax_rate        REAL,
    category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url       TEXT,
    visible_online  INTEGER NOT NULL DEFAULT 0,
    track_inventory INTEGER NOT NULL DEFAULT 0,
    price           REAL,
    quantity        INTEGER,
    low_threshold   INTEGER,
    barcode         TEXT,
    variant_uuid    TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS variations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id     INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    variation_name TEXT NOT NULL,
    price          REAL,
    quantity       INTEGER,
    low_threshold  INTEGER,
    barcode        TEXT,
    variant_uuid   TEXT,
    sort_order     INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_variations_article ON variations(article_id);
  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS metadata (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS changelog (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    username    TEXT NOT NULL,
    action      TEXT NOT NULL,
    entity_type TEXT,
    entity_id   INTEGER,
    summary     TEXT NOT NULL,
    details     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_changelog_created ON changelog(created_at DESC);
`);

db.prepare(
  "INSERT OR IGNORE INTO metadata (key, value) VALUES ('local_barcode_max', '2342000000000')"
).run();

// Migrate legacy articles.category (TEXT) → category_id
const articleCols = db.prepare('PRAGMA table_info(articles)').all().map((c) => c.name);
if (!articleCols.includes('category_id')) {
  db.exec('ALTER TABLE articles ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL');
}
if (articleCols.includes('category')) {
  const distinct = db
    .prepare(
      "SELECT DISTINCT TRIM(category) AS name FROM articles WHERE category IS NOT NULL AND TRIM(category) != ''"
    )
    .all();
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const lookupCat = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE');
  const assignCat = db.prepare('UPDATE articles SET category_id = ? WHERE category = ?');
  for (const { name } of distinct) {
    insertCat.run(name);
    const cat = lookupCat.get(name);
    if (cat) assignCat.run(cat.id, name);
  }
  try {
    db.exec('ALTER TABLE articles DROP COLUMN category');
  } catch {
    // SQLite < 3.35 cannot drop columns; category_id is authoritative
  }
}

if (db.prepare('PRAGMA table_info(articles)').all().some((c) => c.name === 'seo_title')) {
  try {
    db.exec('ALTER TABLE articles DROP COLUMN seo_title');
  } catch {
    // SQLite < 3.35 cannot drop columns; column is ignored
  }
}

if (!db.prepare('PRAGMA table_info(articles)').all().some((c) => c.name === 'image_thumb_avif')) {
  db.exec('ALTER TABLE articles ADD COLUMN image_thumb_avif TEXT');
}

export default db;
