# Prompt 02: PostgreSQL Migration

## Context

The app currently stores everything in Redis (Vercel KV / Upstash) + flat JSON files in `archive/`. This works at 10K users but breaks at 1M:
- No complex queries (JOIN, aggregate, full-text search)
- No structured relationships (articles ↔ coins ↔ prices ↔ sentiment)
- Redis memory costs scale linearly with data
- Archive JSON files grow unbounded (already has years of data in `archive/`)
- No analytics queries without loading entire datasets

## Task

Add PostgreSQL (via Neon serverless or Supabase) as the primary data store, keeping Redis as a hot cache layer.

### Schema Design

Create `src/lib/database/schema.ts` using Drizzle ORM:

```typescript
// Core tables needed:

// 1. articles — the news archive (replace archive/*.json)
//    id, title, url, source, author, publishedAt, fetchedAt,
//    content, summary, sentiment, coins[], tags[], category,
//    imageUrl, language, sourceReliability

// 2. coins — coin metadata
//    id (coingecko_id), symbol, name, marketCapRank,
//    categories[], platforms (jsonb), lastUpdatedAt

// 3. prices — time-series price snapshots
//    coinId, timestamp, price, volume24h, marketCap,
//    priceChange24h, provider, confidence

// 4. market_snapshots — periodic full market state
//    timestamp, totalMarketCap, totalVolume, btcDominance,
//    fearGreedIndex, topMovers (jsonb)

// 5. provider_health — health monitor log
//    provider, timestamp, successRate, avgLatencyMs,
//    circuitState, totalRequests

// 6. alerts — user-defined alerts
//    id, userId, type, coinId, condition, threshold,
//    channel, active, lastTriggeredAt

// 7. predictions — AI predictions archive
//    id, coinId, predictedAt, targetDate, priceTarget,
//    confidence, model, outcome, actualPrice

// 8. social_metrics — social sentiment over time
//    coinId, timestamp, twitterVolume, redditPosts,
//    sentimentScore, source
```

### Migration Strategy

1. **Install dependencies:**
   ```bash
   npm install drizzle-orm @neondatabase/serverless
   npm install -D drizzle-kit
   ```

2. **Create database client** (`src/lib/database/client.ts`):
   - Use `@neondatabase/serverless` for Edge Runtime compatibility
   - Connection pooling via Neon's built-in pooler
   - Fallback to Redis/in-memory if `DATABASE_URL` not set

3. **Create migration files** in `drizzle/` directory

4. **Dual-write phase**: Write to both PostgreSQL and existing Redis/file storage
   - Read from PostgreSQL when available, fall back to Redis
   - This allows gradual migration without downtime

5. **Backfill script** (`scripts/backfill-postgres.ts`):
   - Read all JSON from `archive/` directories
   - Batch insert into `articles` table
   - Read price history and insert into `prices` table

6. **Update API routes** one by one to read from PostgreSQL:
   - `/api/news` → `SELECT * FROM articles ORDER BY publishedAt DESC`
   - `/api/search` → `SELECT * FROM articles WHERE to_tsvector(title || content) @@ to_tsquery($1)`
   - `/api/archive` → `SELECT * FROM articles WHERE publishedAt BETWEEN $1 AND $2`
   - `/api/market/*` → `SELECT * FROM prices WHERE coinId = $1 ORDER BY timestamp DESC`

### Environment Variables

```bash
# Neon serverless PostgreSQL
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/cryptonews?sslmode=require

# Connection pooling (Neon provides this automatically)
DATABASE_POOL_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/cryptonews?sslmode=require
```

### Full-Text Search

Replace the current in-memory search with PostgreSQL GIN indexes:

```sql
-- Create search index
CREATE INDEX idx_articles_search ON articles
  USING GIN (to_tsvector('english', title || ' ' || coalesce(content, '')));

-- Search query
SELECT *, ts_rank(
  to_tsvector('english', title || ' ' || coalesce(content, '')),
  plainto_tsquery('english', $1)
) AS rank
FROM articles
WHERE to_tsvector('english', title || ' ' || coalesce(content, ''))
  @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, publishedAt DESC
LIMIT 20;
```

## Success Criteria

- [ ] Drizzle ORM schema created with all 8 tables
- [ ] Database client works in Edge Runtime (Neon serverless driver)
- [ ] Backfill script migrates existing archive data
- [ ] At least 5 API routes read from PostgreSQL
- [ ] Full-text search via GIN index replaces in-memory search
- [ ] Redis remains as L1 cache (read-through to PostgreSQL)
- [ ] `DATABASE_URL` is optional — app still works without it
- [ ] Migration files in `drizzle/` for schema versioning
