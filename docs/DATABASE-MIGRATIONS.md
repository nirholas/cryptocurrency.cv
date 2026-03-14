# Database Migrations

> Drizzle ORM migration workflow for free-crypto-news (PostgreSQL / Neon Serverless)

## Overview

| Component | Detail |
|---|---|
| ORM | Drizzle ORM v0.45.x |
| Toolkit | drizzle-kit v0.31.x |
| Database | PostgreSQL via Neon Serverless |
| Schema | `src/lib/db/schema.ts` |
| Migrations | `src/lib/db/migrations/` |
| Config | `drizzle.config.ts` |

## Quick Reference

| Command | Purpose |
|---|---|
| `bun run db:generate` | Generate SQL migration from schema diff |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:push` | Push schema directly (dev only — **never production**) |
| `bun run db:studio` | Open Drizzle Studio GUI |
| `bun run db:migrate:safe` | Run safe migration script |
| `bun run db:migrate:dry-run` | Preview SQL without executing |
| `bun run db:migrate:production` | Migrate production with confirmation |

## Development Workflow

```bash
# 1. Edit the schema
#    Modify src/lib/db/schema.ts

# 2. Generate a migration
bun run db:generate

# 3. Review the generated SQL
cat src/lib/db/migrations/<timestamp>_*.sql

# 4. Apply to your dev database
bun run db:migrate

# 5. Verify with Drizzle Studio
bun run db:studio
```

### Using `db:push` (Dev Only)

`db:push` applies schema changes directly without creating migration files. It may **drop columns or tables** to reconcile differences. Use it only against throwaway dev databases:

```bash
bun run db:push
```

## Production Workflow

Production migrations must follow a checklist to avoid data loss:

```bash
# 1. Generate migration locally
bun run db:generate

# 2. Review the SQL carefully — look for DROP, ALTER, TRUNCATE
cat src/lib/db/migrations/<latest>.sql

# 3. Dry run against production (shows SQL, applies nothing)
DATABASE_URL=$PROD_DATABASE_URL ./scripts/db/safe-migrate.sh --dry-run --production

# 4. Create Neon branch backup
neon branches create --name pre-migration-$(date +%Y%m%d%H%M%S)

# 5. Apply migration with production confirmation prompt
DATABASE_URL=$PROD_DATABASE_URL ./scripts/db/safe-migrate.sh --production

# 6. Verify application health
curl -s https://cryptocurrency.cv/api/health | jq .
```

### Safe Migration Script

`scripts/db/safe-migrate.sh` adds safety rails around `drizzle-kit`:

| Flag | Behaviour |
|---|---|
| *(none)* | Generate + apply migration |
| `--dry-run` | Show SQL that would run, apply nothing |
| `--production` | Require typing `yes-migrate` to confirm |
| `--dry-run --production` | Preview production SQL without executing |

## Rollback Strategy

### 1. Neon Branch Restore (Recommended)

Neon supports point-in-time branching. Before every production migration, create a branch:

```bash
neon branches create --name pre-migration-$(date +%Y%m%d%H%M%S)
```

To restore: create a new branch from the pre-migration point and update `DATABASE_URL`.

### 2. Manual SQL Rollback

Keep a `down.sql` next to each migration when the change is complex:

```
src/lib/db/migrations/
  0002_add_users_apikeys_authtokens.sql      # up
  0002_add_users_apikeys_authtokens.down.sql  # manual rollback
```

### 3. Schema Revert + `db:push`

Revert the schema change in git and run `db:push`. **Warning:** this is destructive — `db:push` may drop columns/tables and cause data loss. Only use as a last resort on non-critical data.

## Existing Migrations

| File | Description |
|---|---|
| `0000_initial.sql` | Initial schema (articles, prices_history, market_snapshots, etc.) |
| `0001_add_derivatives_stablecoins_gas_news.sql` | Derivatives, stablecoin, gas fee tables |
| `0002_add_users_apikeys_authtokens.sql` | User auth, API keys, auth tokens |

## Current Schema Tables

| Table | Purpose |
|---|---|
| `articles` | 662K+ enriched news articles |
| `prices_history` | BTC/ETH/SOL price snapshots |
| `market_snapshots` | Hourly market context |
| `predictions` | On-chain / social predictions |
| `tag_scores` | Computed tag relevance scores |
| `user_watchlists` | Per-user ticker watchlists |
| `coins` | Coin metadata and CoinGecko IDs |
| `provider_health` | Health monitor log |
| `alerts` | User-defined price/sentiment/event alerts |
| `social_metrics` | Social sentiment over time |
| `derivatives_snapshots` | Open interest & liquidation snapshots |
| `stablecoin_snapshots` | Stablecoin supply & flow snapshots |
| `gas_fees_history` | Ethereum gas price history |
| `news_articles` | Provider-sourced news articles |

## Common Pitfalls

1. **Never use `db:push` in production** — it can drop columns and tables to reconcile diffs
2. **Always review generated SQL before applying** — look for `DROP`, `ALTER COLUMN ... TYPE`, `TRUNCATE`
3. **Use direct connection strings for large migrations** — Neon serverless connections may timeout on long-running DDL
4. **Make migrations idempotent where possible** — use `IF NOT EXISTS`, `IF EXISTS` guards
5. **Commit migration files** — they are part of the source of truth; never `.gitignore` them
6. **Don't edit existing migration files** — Drizzle tracks applied migrations by filename; altering them causes drift
7. **Test locally first** — run `bun run db:migrate` against a dev database before touching production

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) |

Set in `.env.local` for dev, in Vercel environment settings for production.
