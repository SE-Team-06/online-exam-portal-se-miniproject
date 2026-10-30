import 'dotenv/config';
import mongoose from 'mongoose';

const asNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export async function runLoad(url, { requests = 100, concurrency = 10, timeoutMs = 10_000 } = {}) {
  let next = 0;
  let failures = 0;
  const latencies = [];
  async function worker() {
    while (true) {
      const current = next;
      next += 1;
      if (current >= requests) return;
      const started = Date.now();
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!response.ok) failures += 1;
      } catch {
        failures += 1;
      } finally {
        latencies.push(Date.now() - started);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
  return {
    url, requests, concurrency, failures,
    errorRate: Number(((failures / requests) * 100).toFixed(2)),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    maxMs: Math.max(...latencies),
  };
}

export async function readStorageStats(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI must be configured.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      dataBytes: stats.dataSize,
      storageBytes: stats.storageSize,
      indexesBytes: stats.indexSize,
      documents: stats.objects,
    };
  } finally {
    await mongoose.disconnect();
  }
}

const [command, arg] = process.argv.slice(2);
if (command === 'load') {
  if (!arg) throw new Error('Usage: npm --workspace server run scale:load -- <health URL>');
  const result = await runLoad(arg, {
    requests: asNumber(process.env.SCALE_REQUESTS, 100),
    concurrency: asNumber(process.env.SCALE_CONCURRENCY, 10),
    timeoutMs: asNumber(process.env.SCALE_TIMEOUT_MS, 10_000),
  });
  console.log(JSON.stringify(result, null, 2));
  const maxP95 = asNumber(process.env.SCALE_MAX_P95_MS, 500);
  const maxErrorRate = asNumber(process.env.SCALE_MAX_ERROR_RATE, 1);
  if (result.p95Ms > maxP95 || result.errorRate > maxErrorRate) process.exitCode = 1;
} else if (command === 'storage') {
  const result = await readStorageStats();
  console.log(JSON.stringify(result, null, 2));
} else {
  throw new Error('Command must be load or storage.');
}
