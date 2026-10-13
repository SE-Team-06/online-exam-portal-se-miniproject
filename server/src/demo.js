import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import app, { submitExpiredAttempts } from './app.js';
import { User, Question, Exam } from './models/index.js';
import { hashPassword } from './security/password.js';

process.env.MONGOMS_DOWNLOAD_DIR ??= new URL('../../.cache/mongodb-binaries', import.meta.url).pathname.replace(/^\//, '').replaceAll('/', '\\');
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri());
const password = `Demo-${randomBytes(10).toString('base64url')}-7a`;
const [instructor, student] = await Promise.all([
  User.create({ name: 'Demo Instructor', email: 'instructor@example.test', passwordHash: await hashPassword(password), role: 'Instructor', emailVerified: true }),
  User.create({ name: 'Demo Student', email: 'student@example.test', passwordHash: await hashPassword(password), role: 'Student', emailVerified: true }),
]);
const question = await Question.create({ ownerId: instructor._id, text: 'Which HTTP status code indicates a successful response?', options: [{ _id: 'a', text: '200' }, { _id: 'b', text: '404' }, { _id: 'c', text: '500' }], correctOptionId: 'a', marks: 1 });
const now = new Date();
await Exam.create({ ownerId: instructor._id, title: 'Demo: HTTP Basics', durationMinutes: 10, startAt: new Date(now.getTime() - 60_000), endAt: new Date(now.getTime() + 30 * 60_000), passMark: 1, questionIds: [question._id], assignedStudentIds: [student._id], status: 'Published' });
const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => {
  console.log(`Demo API: http://localhost:${port}`);
  console.log('Temporary demo accounts (discarded when stopped):');
  console.log(`Instructor: instructor@example.test / ${password}`);
  console.log(`Student: student@example.test / ${password}`);
  console.log('Stop with Ctrl+C. No demo data is written to a persistent database.');
});
const expiryWorker = setInterval(() => submitExpiredAttempts().catch((e) => console.error('Expiry worker failed:', e.message)), 5000);
async function shutdown() { clearInterval(expiryWorker); server.close(); await mongoose.disconnect(); await mongo.stop(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
