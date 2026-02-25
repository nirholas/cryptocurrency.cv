# Prompt 03: Background Job Queue (Inngest / Trigger.dev)

## Context

The app currently uses 7 Vercel cron jobs for background work:

| Cron | Schedule | What it does |
|------|----------|-------------|
| `/api/cron/archive-kv` | Hourly | Archive articles to KV store |
| `/api/cron/digest` | Daily 8am | Generate daily news digest |
| `/api/cron/x-sentiment` | Daily midnight | Fetch X/Twitter sentiment |
| `/api/cron/coverage-gap` | Every 6h | Detect missing coverage |
| `/api/cron/predictions` | Daily | Generate AI predictions |
| `/api/cron/tag-scores` | Every 6h | Recalculate tag relevance scores |
| `/api/cron/enrich-articles` | Every 5 min | AI-enrich new articles |

**Problems at 1M+ users:**
- Vercel cron has 60-300s max execution time — not enough for large batch jobs
- No retry logic on failure (job just fails silently until next cron tick)
- No fan-out (can't enrich 100 articles in parallel)
- No dead-letter queue (failed jobs are lost)
- No observability (can't see job status, duration, failure rates)
- No priority queues (breaking news enrichment should preempt batch work)

## Task

Migrate from Vercel cron to **Inngest** (recommended — free tier: 25K events/month, generous for this use case).

### 1. Install & Configure

```bash
npm install inngest
```

Create `src/lib/inngest/client.ts`:
```typescript
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'free-crypto-news',
  // Event schemas for type safety
});
```

Create `src/app/api/inngest/route.ts` — the webhook endpoint Inngest calls.

### 2. Define Functions

Create `src/lib/inngest/functions/` with one file per job:

#### `archive-articles.ts`
- **Trigger:** `cron: "0 * * * *"` (hourly) OR `event: "article/published"` (real-time)
- **Logic:** Fetch recent articles, batch-write to archive/database
- **Retry:** 3 attempts with exponential backoff
- **Timeout:** 5 minutes

#### `daily-digest.ts`
- **Trigger:** `cron: "0 8 * * *"`
- **Logic:** Query last 24h articles, call AI to summarize, store digest
- **Fan-out:** Process each category in parallel (step.run for each)
- **Retry:** 2 attempts

#### `enrich-article.ts`
- **Trigger:** `event: "article/needs-enrichment"`
- **Logic:** AI summarize, extract entities, sentiment analysis, tag
- **Concurrency:** Max 5 concurrent (respect AI API rate limits)
- **Retry:** 3 attempts
- **Priority:** Breaking news articles get priority via event metadata

#### `sentiment-analysis.ts`
- **Trigger:** `cron: "0 0 * * *"` + `event: "sentiment/refresh"`
- **Logic:** Fetch social metrics, compute aggregate sentiment
- **Fan-out:** One step per data source (X, Reddit, LunarCrush)

#### `predictions.ts`
- **Trigger:** `cron: "0 0 * * *"`
- **Logic:** Generate AI price predictions, backtest against actuals
- **Timeout:** 10 minutes (AI inference heavy)

#### `coverage-gap-detection.ts`
- **Trigger:** `cron: "0 */6 * * *"`
- **Logic:** Compare trending topics vs published articles, flag gaps
- **Output:** Creates `article/needs-coverage` events for missing topics

#### `tag-score-recalculation.ts`
- **Trigger:** `cron: "0 */6 * * *"`
- **Logic:** Recalculate relevance scores for all tags based on recent data

### 3. Event-Driven Architecture

Instead of polling, emit events when things happen:

```typescript
// When a new article is fetched from RSS
await inngest.send({
  name: 'article/published',
  data: { articleId, title, source, coins: ['bitcoin'] },
});

// When a large price move happens
await inngest.send({
  name: 'market/price-alert',
  data: { coin: 'bitcoin', change: -8.5, timeframe: '1h' },
});

// Chain reaction: price alert → enrich related articles → update predictions
```

### 4. Remove Old Cron Routes

After migration, delete:
- `src/app/api/cron/archive-kv/route.ts`
- `src/app/api/cron/digest/route.ts`
- `src/app/api/cron/x-sentiment/route.ts`
- `src/app/api/cron/coverage-gap/route.ts`
- `src/app/api/cron/predictions/route.ts`
- `src/app/api/cron/tag-scores/route.ts`
- `src/app/api/cron/enrich-articles/route.ts`

Remove the `crons` section from `vercel.json`.

### Environment Variables

```bash
INNGEST_EVENT_KEY=xxx        # From Inngest dashboard
INNGEST_SIGNING_KEY=xxx      # Webhook verification
```

## Success Criteria

- [ ] Inngest client configured with typed events
- [ ] All 7 cron jobs migrated to Inngest functions
- [ ] Article enrichment uses fan-out (parallel step.run)
- [ ] Retry logic with exponential backoff on all functions
- [ ] Concurrency limits on AI-heavy functions
- [ ] Event-driven triggers supplement cron schedules
- [ ] Old cron routes removed, `vercel.json` crons removed
- [ ] Inngest dev server works locally (`npx inngest-cli dev`)
