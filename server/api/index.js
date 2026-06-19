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
import missingLookupProduct from './missing/lookup-product.js';
import categoriesList from './categories/list.js';
import categoriesCreate from './categories/create.js';
import categoriesUpdate from './categories/update.js';
import categoriesDelete from './categories/delete.js';
import flushPost from './flush/post.js';
import importPost from './import/post.js';
import exportGet from './export/get.js';
import tokensList from './tokens/list.js';
import tokensCreate from './tokens/create.js';
import tokensDelete from './tokens/delete.js';
import v1PriceGet from './v1/price/get.js';
import v1PricePut from './v1/price/put.js';
import v1PriceDelete from './v1/price/delete.js';
import v1PrinterAgent from './v1/printer/agent.js';
import v1PrinterAgentAck from './v1/printer/agent-ack.js';
import v1PrinterEvents from './v1/printer/events.js';
import v1PrinterPrint from './v1/printer/print.js';

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
  missingLookupProduct,
  categoriesList,
  categoriesCreate,
  categoriesUpdate,
  categoriesDelete,
  flushPost,
  importPost,
  exportGet,
  tokensList,
  tokensCreate,
  tokensDelete,
  v1PriceGet,
  v1PricePut,
  v1PriceDelete,
  v1PrinterAgent,
  v1PrinterAgentAck,
  v1PrinterEvents,
  v1PrinterPrint,
];

export default function registerApi(app) {
  for (const register of routes) {
    register(app);
  }
}
