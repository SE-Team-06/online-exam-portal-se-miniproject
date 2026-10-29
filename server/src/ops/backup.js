import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { gunzipSync, gzipSync } from 'node:zlib';
import path from 'node:path';
import mongoose from 'mongoose';

const { EJSON } = mongoose.mongo.BSON;
const PREFIX = 'oep-backup-';

// NFR-OE-006: one gzip'd Extended-JSON file per backup containing every collection.
export async function createBackup(dir, { now = new Date(), retain = 7 } = {}) {
  await mkdir(dir, { recursive: true });
  const db = mongoose.connection.db;
  const collections = {};
  for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (name.startsWith('system.')) continue;
    collections[name] = await db.collection(name).find({}).toArray();
  }
  const file = path.join(dir, `${PREFIX}${now.toISOString().replaceAll(':', '-')}.json.gz`);
  const body = EJSON.stringify({ createdAt: now, database: db.databaseName, collections }, { relaxed: false });
  await writeFile(file, gzipSync(body));
  const removed = await pruneBackups(dir, retain);
  return { file, collections: Object.fromEntries(Object.entries(collections).map(([name, docs]) => [name, docs.length])), removed };
}

export async function listBackups(dir) {
  const names = (await readdir(dir).catch(() => [])).filter((name) => name.startsWith(PREFIX) && name.endsWith('.json.gz'));
  return names.sort().map((name) => path.join(dir, name));
}

export async function pruneBackups(dir, retain = 7) {
  const files = await listBackups(dir);
  const stale = files.slice(0, Math.max(0, files.length - retain));
  await Promise.all(stale.map((file) => rm(file)));
  return stale;
}

// Replaces the contents of every collection in the backup. Collections not in the backup are left alone.
export async function restoreBackup(file) {
  const { collections } = EJSON.parse(gunzipSync(await readFile(file)).toString('utf8'), { relaxed: false });
  const db = mongoose.connection.db;
  const restored = {};
  for (const [name, docs] of Object.entries(collections)) {
    await db.collection(name).deleteMany({});
    if (docs.length) await db.collection(name).insertMany(docs, { ordered: false });
    restored[name] = docs.length;
  }
  return restored;
}

export function startBackupSchedule({ dir, intervalHours = 24, retain = 7, log = console }) {
  const run = () => createBackup(dir, { retain })
    .then(({ file, removed }) => log.log(`Backup written: ${path.basename(file)}${removed.length ? `, removed ${removed.length} old` : ''}`))
    .catch((error) => log.error('Backup failed:', error.message));
  run();
  return setInterval(run, intervalHours * 60 * 60 * 1000);
}
