# Operations: Availability, Backups & Retention

Issue #23 (Jira OEPSE-26) · SRS **NFR-OE-004** (99.5% availability during exam windows, per month), **NFR-OE-006** (daily backup, keep last 7), **NFR-OE-014** (retain attempts/results ≥ 1 year; Administrator deletes a deactivated user's data on request).

## Health check

`GET /api/health` pings MongoDB:

| Database | HTTP | Body |
|---|---|---|
| reachable | 200 | `{ "status": "ok", "database": "up", "time": … }` |
| unreachable | 503 | `{ "status": "degraded", "database": "down", "time": … }` |

It stays reachable over plain HTTP so a load balancer can probe it (see [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md)).

## Availability measurement (NFR-OE-004)

1. Run the probe on a **different machine** from the server, so it can see when the server is down:
   ```bash
   node tools/availability-probe.mjs https://<host>/api/health probe.jsonl 60
   ```
   It appends one line per check: `{"at": "...", "up": true, "status": 200, "ms": 42}`. "Up" means HTTP 200 **and** `database: "up"`.
2. Monthly report, counting only samples inside published exam windows:
   ```bash
   MONGODB_URI=... npm --workspace server run availability -- probe.jsonl
   ```
   It prints, per month: samples, up, availability %, and whether it meets 99.5%.

With 60 s probes, one failed check in a 2-hour window is 0.83% downtime. Probe at 30 s or less if windows are short.

## Backups (NFR-OE-006)

- **What:** every collection in one gzip-compressed Extended-JSON file, `oep-backup-<ISO time>.json.gz`. Types (ObjectId, Date) are preserved.
- **Automatic:** set `BACKUP_DIR` and the API server writes a backup at start-up and every `BACKUP_INTERVAL_HOURS` (default 24). It keeps the newest `BACKUP_RETAIN` (default 7) and deletes older ones.
- **Manual / cron:**
  ```bash
  MONGODB_URI=... BACKUP_DIR=/var/backups/oep npm --workspace server run backup
  MONGODB_URI=... npm --workspace server run restore -- /var/backups/oep/oep-backup-2026-10-26T02-00-00.000Z.json.gz
  ```
  Restore **replaces** the contents of each collection in the file. Stop the API first.
- **Store backups off the database server** (a different disk or an object store). `backups/` is git-ignored.
- **Restore drill:** run a restore into a scratch database once a month and record it below.

## Retention (NFR-OE-014, SEC-OE-011)

| Data | Retention | How |
|---|---|---|
| Attempts, answers, scores | Kept indefinitely (≥ 1 year) | No expiry index on `attempts`, `exams` or `users`. Enforced by a test |
| Audit log | Kept indefinitely (≥ 12 months) | No expiry index on `auditlogs`. Enforced by a test |
| Sessions | 30 min inactivity | TTL index on `sessions.expiresAt` (the only expiring collection) |
| Backups | Newest 7 | `BACKUP_RETAIN` |

**Deleting a user's data on request:** `DELETE /api/admin/users/:userId/data` (Administrator, CSRF token required).

- The account must already be **deactivated** (`active: false`), otherwise 409 `USER_ACTIVE`.
- Deletes the user, their attempts, notifications and sessions, and removes them from exam assignments.
- Refuses with 409 `USER_OWNS_CONTENT` if the account owns questions or exams (an instructor's content must be reassigned first).
- **Audit entries are kept** (they hold only the user ID) and a `USER_DATA_DELETED` entry is written.
- Administrators can deactivate accounts in the `Manage accounts` panel. The same administrator-only panel exposes the read-only audit review interface and its date, user, and action filters. Retention is indefinite in the application database; operators must preserve the MongoDB audit collection in their backup/retention controls and record production verification separately.

## Evidence and limits

- `server/test/operations.test.js` covers:
  - a backup round trip, including hidden fields
  - keeping only the latest 7 of 9 daily backups
  - the availability calculation: only exam-window samples count, and each month is checked against the target
  - the deletion rules
  - no expiry on retained collections
  - health check 200 / 503
- The backup and restore commands were also run end to end against a throwaway database (backup → delete → restore, document count back to 1).
- **There is no production deployment yet.** No real availability figure exists, and no scheduled backup has run on a server. Record the first month's availability report and a restore drill here once deployed.
- Backups are compressed but **not encrypted** (SEC-OE-012, Should). Encrypt the backup location, e.g. an encrypted volume or bucket.

### Restore drill log

| Date | Backup file | Target | Result | By |
|---|---|---|---|---|
| | | | | |

## Scale validation (OEPSE-25)

Run the load measurement against a running API from a separate terminal or machine:

```powershell
$env:SCALE_REQUESTS=1000
$env:SCALE_CONCURRENCY=25
$env:SCALE_MAX_P95_MS=500
$env:SCALE_MAX_ERROR_RATE=1
npm.cmd --workspace server run scale:load -- http://localhost:4000/api/health
```

The command reports request count, concurrency, error rate, p50, p95 and maximum latency. It exits with code 1 when the configured p95 or error-rate target is missed. Record the JSON output, date, host and deployed version for each acceptance run; a local run is not a production capacity claim.

Measure current MongoDB storage usage with:

```powershell
$env:MONGODB_URI='mongodb://localhost:27017/online_exam_portal'
npm.cmd --workspace server run scale:storage
```

The storage report includes collection count, document count, data bytes, storage bytes and index bytes. Capacity acceptance requires repeating this measurement with the agreed representative dataset and retaining the output with the load result.
