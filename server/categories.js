import db from './db.js';

const findByName = db.prepare(
  'SELECT id, name FROM categories WHERE name = ? COLLATE NOCASE'
);
const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
const listAll = db.prepare('SELECT id, name FROM categories ORDER BY name COLLATE NOCASE');
const getById = db.prepare('SELECT id, name FROM categories WHERE id = ?');
const updateCategory = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
const deleteCategory = db.prepare('DELETE FROM categories WHERE id = ?');
const countArticles = db.prepare(
  'SELECT COUNT(*) AS c FROM articles WHERE category_id = ?'
);

export function listCategories() {
  return listAll.all();
}

export function findOrCreateCategory(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  const existing = findByName.get(trimmed);
  if (existing) return existing.id;
  const info = insertCategory.run(trimmed);
  return Number(info.lastInsertRowid);
}

export function createCategory(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Category name is required.');
  try {
    const info = insertCategory.run(trimmed);
    return { id: Number(info.lastInsertRowid), name: trimmed };
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      throw new Error(`Category already exists: ${trimmed}`);
    }
    throw e;
  }
}

export function updateCategoryById(id, name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Category name is required.');
  const existing = getById.get(id);
  if (!existing) throw new Error('Category not found.');
  try {
    updateCategory.run(trimmed, id);
    return { id, name: trimmed };
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      throw new Error(`Category already exists: ${trimmed}`);
    }
    throw e;
  }
}

export function deleteCategoryById(id) {
  const existing = getById.get(id);
  if (!existing) throw new Error('Category not found.');
  const used = countArticles.get(id).c;
  if (used > 0) {
    throw new Error(`Category is used by ${used} article(s). Reassign them first.`);
  }
  deleteCategory.run(id);
}

export function clearCategories() {
  db.prepare('DELETE FROM categories').run();
}
