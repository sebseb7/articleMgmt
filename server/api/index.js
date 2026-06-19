import authLogin from './auth/login.js';
import authLogout from './auth/logout.js';
import authMe from './auth/me.js';
import articlesList from './articles/list.js';
import articlesCreate from './articles/create.js';
import articlesUpdate from './articles/update.js';
import articlesDelete from './articles/delete.js';
import articlesBarcode from './articles/barcode.js';
import changelogList from './changelog/list.js';
import statsGet from './stats/get.js';
import barcodeGenerate from './barcode/generate.js';
import barcodesLookup from './barcodes/lookup.js';
import missingList from './missing/list.js';
import missingUpsert from './missing/upsert.js';
import missingDelete from './missing/delete.js';
import categoriesList from './categories/list.js';
import categoriesCreate from './categories/create.js';
import categoriesUpdate from './categories/update.js';
import categoriesDelete from './categories/delete.js';
import flushPost from './flush/post.js';
import importPost from './import/post.js';
import exportGet from './export/get.js';

const routes = [
  authLogin,
  authLogout,
  authMe,
  articlesList,
  articlesCreate,
  articlesUpdate,
  articlesDelete,
  articlesBarcode,
  changelogList,
  statsGet,
  barcodeGenerate,
  barcodesLookup,
  missingList,
  missingUpsert,
  missingDelete,
  categoriesList,
  categoriesCreate,
  categoriesUpdate,
  categoriesDelete,
  flushPost,
  importPost,
  exportGet,
];

export default function registerApi(app) {
  for (const register of routes) {
    register(app);
  }
}
