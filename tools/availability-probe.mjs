// External availability probe for NFR-OE-004. Run on a different machine from the server:
//   node tools/availability-probe.mjs https://<host>/api/health probe.jsonl [intervalSeconds=60]
// Appends one JSON line per check: {"at": ISO time, "up": true|false, "status": HTTP status or null, "ms": latency}
import { appendFile } from 'node:fs/promises';

const [url, out = 'probe.jsonl', interval = '60'] = process.argv.slice(2);
if (!url) { console.error('Usage: node tools/availability-probe.mjs <health URL> [out.jsonl] [intervalSeconds]'); process.exit(2); }
async function probe() {
  const started = Date.now();
  let status = null; let up = false;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    status = response.status;
    up = response.ok && (await response.json()).database === 'up';
  } catch { up = false; }
  await appendFile(out, `${JSON.stringify({ at: new Date(started).toISOString(), up, status, ms: Date.now() - started })}\n`);
}
await probe();
setInterval(probe, Number(interval) * 1000);
