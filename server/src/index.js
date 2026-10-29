import 'dotenv/config';
import mongoose from 'mongoose';
import app, { submitExpiredAttempts } from './app.js';
import { startBackupSchedule } from './ops/backup.js';

const port = Number(process.env.PORT ?? 4000);
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured.');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
const server = app.listen(port, () => console.log(`Online Exam Portal API listening on http://localhost:${port}`));
const expiryWorker = setInterval(() => submitExpiredAttempts().catch((e) => console.error('Expiry worker failed:', e.message)), 5000);
const backupWorker = process.env.BACKUP_DIR ? startBackupSchedule({ dir: process.env.BACKUP_DIR, intervalHours: Number(process.env.BACKUP_INTERVAL_HOURS ?? 24), retain: Number(process.env.BACKUP_RETAIN ?? 7) }) : null;
async function shutdown() { clearInterval(expiryWorker); clearInterval(backupWorker); server.close(); await mongoose.disconnect(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
