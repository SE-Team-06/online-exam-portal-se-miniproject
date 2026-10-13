import 'dotenv/config';
import mongoose from 'mongoose';
import app, { submitExpiredAttempts } from './app.js';

const port = Number(process.env.PORT ?? 4000);
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured.');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
const server = app.listen(port, () => console.log(`Online Exam Portal API listening on http://localhost:${port}`));
const expiryWorker = setInterval(() => submitExpiredAttempts().catch((e) => console.error('Expiry worker failed:', e.message)), 5000);
async function shutdown() { clearInterval(expiryWorker); server.close(); await mongoose.disconnect(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
