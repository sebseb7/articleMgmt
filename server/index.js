import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db, { dbPath } from './db.js';
import { startBackupScheduler } from './backup.js';
import registerApi from './api/index.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '25mb' }));

const PORT = process.env.PORT || 3991;

registerApi(app);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  startBackupScheduler(db, dbPath);
});
