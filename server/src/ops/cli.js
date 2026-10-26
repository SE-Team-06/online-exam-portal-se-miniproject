// Operational commands. Usage (from the repo root):
//   npm --workspace server run backup                 -> writes a backup to BACKUP_DIR (default ./backups), keeps BACKUP_RETAIN (default 7)
//   npm --workspace server run restore -- <file>      -> restores a backup file (replaces collection contents)
//   npm --workspace server run availability -- <probe.jsonl>   -> availability during exam windows per month
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { createBackup, restoreBackup } from './backup.js';
import { availabilityByMonth } from './availability.js';
import { Exam } from '../models/index.js';

const [command, arg] = process.argv.slice(2);
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured.');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  if (command === 'backup') {
    const result = await createBackup(process.env.BACKUP_DIR ?? 'backups', { retain: Number(process.env.BACKUP_RETAIN ?? 7) });
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'restore') {
    if (!arg) throw new Error('Pass the backup file to restore.');
    console.log(JSON.stringify(await restoreBackup(arg), null, 2));
  } else if (command === 'availability') {
    if (!arg) throw new Error('Pass the probe log (JSON lines: {"at": ISO time, "up": true|false}).');
    const samples = (await readFile(arg, 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));
    const windows = await Exam.find({ status: 'Published' }).select('startAt endAt').lean();
    console.table(availabilityByMonth(samples, windows));
  } else {
    throw new Error('Command must be backup, restore or availability.');
  }
} finally {
  await mongoose.disconnect();
}
