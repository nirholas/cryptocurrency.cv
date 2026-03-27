# Disaster Recovery & Backup System

> RTO/RPO targets, backup procedures, and recovery runbooks for free-crypto-news.

## Recovery Objectives

| Metric                             | Target          | Description                                                                         |
| ---------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| **RPO** (Recovery Point Objective) | **24 hours**    | Maximum acceptable data loss. Backups run daily; at most 24h of data could be lost. |
| **RTO** (Recovery Time Objective)  | **4 hours**     | Maximum time to restore full service from a disaster event.                         |
| **RTO Estimated (Actual)**         | **~30 minutes** | Typical restore time with automated scripts and pre-staged backups.                 |
| **Backup Retention**               | **30 days**     | Both local and remote backups retained for 30 days by default.                      |

## Backup Components

The full backup system (`scripts/backup-full.sh`) captures three critical components:

### 1. Postgres Database

- **Method:** `pg_dump` with `--format=custom --compress=6`
- **Output:** `postgres.sql.gz` (compressed custom format)
- **Also saves:** `postgres-schema.sql` (schema-only dump for reference)
- **RPO impact:** Contains all structured data (articles, users, analytics)

### 2. Redis Cache

- **Method:** Key-by-key export to JSON, supporting all data types (string, list, set, hash, zset)
- **Output:** `redis-snapshot.json.gz`
- **Includes:** Key types, TTL values, and full payloads
- **RPO impact:** Cache can be rebuilt from Postgres, but snapshot speeds recovery

### 3. Archive Directory

- **Method:** `tar -czf` of the entire `archive/` directory
- **Output:** `archive.tar.gz`
- **Includes:** All historical articles, indexes, market data, snapshots
- **RPO impact:** Contains the complete news archive — critical for historical data
- **PITR support:** Point-in-time recovery available via git history and timestamp filtering

## Backup Schedule (Recommended)

```cron
# Daily full backup at 3 AM UTC
0 3 * * * /path/to/scripts/backup-full.sh >> /var/log/backup.log 2>&1

# Weekly integrity verification
0 6 * * 0 /path/to/scripts/backup-full.sh --no-upload && echo "Integrity OK"
```

## Quick Reference

### Run a Full Backup

```bash
# Full backup (Postgres + Redis + Archive → S3)
./scripts/backup-full.sh

# Backup specific components only
./scripts/backup-full.sh --postgres
./scripts/backup-full.sh --redis
./scripts/backup-full.sh --archive

# Dry run (preview what would be backed up)
./scripts/backup-full.sh --dry-run

# Skip S3 upload (local only)
./scripts/backup-full.sh --no-upload
```

### Restore from Backup

```bash
# Restore latest local backup
./scripts/restore-full.sh --latest

# Restore from specific file
./scripts/restore-full.sh backups/full-backup_20260301T030000Z.tar.gz

# Restore from S3
./scripts/restore-full.sh --from-s3 s3://my-bucket/backups/2026/03/01/full-backup_20260301T030000Z.tar.gz

# Restore specific components only
./scripts/restore-full.sh --latest --postgres
./scripts/restore-full.sh --latest --redis
./scripts/restore-full.sh --latest --archive

# Preview restore (dry run)
./scripts/restore-full.sh --latest --dry-run

# List available backups
./scripts/restore-full.sh --list
```

### Point-in-Time Recovery (Archive)

```bash
# Recover archive to specific timestamp
./scripts/archive-pitr.sh --timestamp "2026-02-15T12:00:00Z"

# Recover to a specific date (end of day)
./scripts/archive-pitr.sh --date "2026-02-15"

# Recover to a specific git commit
./scripts/archive-pitr.sh --commit abc1234

# Recover to N days ago
./scripts/archive-pitr.sh --days-ago 7

# List available recovery points
./scripts/archive-pitr.sh --list-snapshots

# Preview recovery (dry run)
./scripts/archive-pitr.sh --date "2026-02-15" --dry-run
```

## Environment Variables

| Variable                | Required      | Default                  | Description                              |
| ----------------------- | ------------- | ------------------------ | ---------------------------------------- |
| `DATABASE_URL`          | For PG backup | —                        | Postgres connection string               |
| `PGHOST`                | Alternative   | `localhost`              | Postgres host                            |
| `PGPORT`                | Alternative   | `5432`                   | Postgres port                            |
| `PGUSER`                | Alternative   | `postgres`               | Postgres user                            |
| `PGPASSWORD`            | Alternative   | —                        | Postgres password                        |
| `PGDATABASE`            | Alternative   | `free_crypto_news`       | Postgres database                        |
| `REDIS_URL`             | For Redis     | `redis://localhost:6379` | Redis connection URL                     |
| `BACKUP_S3_BUCKET`      | For S3        | —                        | S3 bucket name                           |
| `BACKUP_S3_ENDPOINT`    | For non-AWS   | —                        | S3-compatible endpoint (MinIO, R2, etc.) |
| `BACKUP_S3_REGION`      | Optional      | `us-east-1`              | S3 region                                |
| `AWS_ACCESS_KEY_ID`     | For S3        | —                        | AWS/S3 access key                        |
| `AWS_SECRET_ACCESS_KEY` | For S3        | —                        | AWS/S3 secret key                        |
| `BACKUP_RETENTION_DAYS` | Optional      | `30`                     | Days to retain backups                   |
| `BACKUP_DIR`            | Optional      | `./backups`              | Local backup directory                   |
| `BACKUP_ENCRYPTION_KEY` | Optional      | —                        | GPG passphrase for AES-256 encryption    |
| `ADMIN_API_KEY`         | For API       | —                        | Admin API authentication token           |

## Disaster Recovery Runbook

### Scenario 1: Database Corruption

**RTO: ~15 minutes**

1. Stop the application: `pm2 stop all` or scale to 0
2. Restore Postgres: `./scripts/restore-full.sh --latest --postgres`
3. Verify: `psql $DATABASE_URL -c "SELECT count(*) FROM articles;"`
4. Restart application
5. Monitor for errors in logs

### Scenario 2: Redis Data Loss

**RTO: ~5 minutes**

1. Redis data is non-critical (cache layer)
2. Option A: Let cache rebuild naturally from Postgres
3. Option B: Restore from backup: `./scripts/restore-full.sh --latest --redis`
4. Verify: `redis-cli DBSIZE`

### Scenario 3: Archive Corruption or Accidental Deletion

**RTO: ~20 minutes**

1. Identify the time range of good data
2. Point-in-time recovery: `./scripts/archive-pitr.sh --timestamp "2026-02-28T00:00:00Z"`
3. Review recovered files: `ls backups/pitr-recovery/`
4. Compare: `diff -r backups/pitr-recovery/ archive/`
5. Apply: `cp -r backups/pitr-recovery/* archive/`

### Scenario 4: Complete Server Loss

**RTO: ~4 hours (within RTO target)**

1. Provision new infrastructure (Railway/Vercel/Docker)
2. Set environment variables from secure vault
3. Download latest backup from S3:
   ```bash
   ./scripts/restore-full.sh --from-s3 s3://bucket/backups/latest.tar.gz
   ```
4. Restore all components: `./scripts/restore-full.sh --latest`
5. Run database migrations: `bun run db:migrate`
6. Deploy application: `bun run build && bun run start`
7. Verify all endpoints: `bun run test:api`
8. Update DNS if needed
9. Monitor for 1 hour

### Scenario 5: Ransomware / Security Breach

**RTO: ~4 hours**

1. Isolate affected systems immediately
2. Provision clean infrastructure
3. Restore from a backup pre-dating the breach
4. Rotate all secrets (API keys, database passwords, tokens)
5. Update environment variables
6. Deploy and verify
7. Enable enhanced monitoring
8. Conduct post-incident review

## Backup Verification

Backups are verified automatically with:

- **SHA-256 checksums** for every file within the backup
- **Archive extraction test** — the backup is extracted and re-verified
- **Postgres dump integrity** — gzip integrity check on the dump
- **Redis snapshot integrity** — gzip + JSON validation
- **Archive tar integrity** — tar listing verification
- **Manifest validation** — JSON structure check

Run manual verification:

```bash
./scripts/backup-full.sh --no-upload  # Creates and verifies locally
```

## Monitoring

Backup status response format:

```json
{
  "status": "healthy",
  "last_backup": {
    "timestamp": "20260301T030000Z",
    "status": "success",
    "components": ["postgres", "redis", "archive"],
    "age_hours": 12.5
  },
  "rto_rpo": {
    "rpo_target_hours": 24,
    "rto_target_hours": 4,
    "rpo_actual_hours": 12.5,
    "rpo_status": "met"
  }
}
```

**Alert thresholds:**

- `rpo_status: "warning"` — backup is 24–36 hours old
- `rpo_status: "exceeded"` — backup is >36 hours old (action required)
- `status: "error"` — last backup failed or RPO exceeded

Integrate with your monitoring system (Datadog, PagerDuty, etc.) by polling this endpoint.
