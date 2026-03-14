# 38 — Audit and Reduce force-dynamic Usage

## Goal

Audit all 35 routes using `export const dynamic = 'force-dynamic'` and convert as many as possible to static generation or ISR (`revalidate`). `force-dynamic` disables all Next.js static optimization, forcing every request to hit the server — increasing latency, server costs, and reducing cache effectiveness.

## Context

- **Framework:** Next.js 16 with App Router
- **Deployment:** Vercel (primary), Docker (secondary)
- **Caching:** Redis (Upstash) + Vercel Edge Cache + NGINX request coalescing
- **Current state:** 35 routes use `force-dynamic`, many of which could use ISR or static generation

## Routes Currently Using force-dynamic

### Pages (2)

| Route       | File                               |
| ----------- | ---------------------------------- |
| Status page | `src/app/[locale]/status/page.tsx` |
| Root layout | `src/app/[locale]/layout.tsx`      |

### API Routes — Streaming/SSE (KEEP force-dynamic)

These genuinely need force-dynamic because they use streaming responses:
| Route | Justification |
|-------|--------------|
| `/api/prices/stream` | SSE price stream |
| `/api/market/stream` | SSE market data stream |
| `/api/rag/stream` | SSE RAG response stream |
| `/api/alerts/stream` | SSE alert stream |
| `/api/news/stream` | SSE news stream |
| `/api/premium/streams/prices` | SSE premium price stream |

### API Routes — Candidates for ISR (convert to revalidate)

These return JSON data that changes periodically but not on every request:
| Route | Suggested `revalidate` |
|-------|----------------------|
| `/api/tags` | 300 (5 min) |
| `/api/social` | 60 (1 min) |
| `/api/social/trending-narratives` | 120 (2 min) |
| `/api/social/x/sentiment` | 60 (1 min) |
| `/api/influencers` | 300 (5 min) |
| `/api/gaming` | 300 (5 min) |
| `/api/gaming/chains` | 300 (5 min) |
| `/api/gaming/top` | 300 (5 min) |
| `/api/macro` | 300 (5 min) |
| `/api/macro/indicators` | 600 (10 min) |
| `/api/macro/risk-appetite` | 300 (5 min) |
| `/api/macro/fed` | 3600 (1 hour) |
| `/api/macro/dxy` | 300 (5 min) |
| `/api/macro/correlations` | 600 (10 min) |
| `/api/stablecoins/depeg` | 60 (1 min) |
| `/api/trading/options` | 60 (1 min) |
| `/api/trading/arbitrage` | 60 (1 min) |
| `/api/trading/orderbook` | 30 (30 sec) |
| `/api/v1/system/status` | 30 (30 sec) |
| `/api/v1/knowledge-graph` | 600 (10 min) |

### API Routes — Need Analysis

| Route                        | Notes                                          |
| ---------------------------- | ---------------------------------------------- |
| `/api/billing`               | May need force-dynamic (user-specific data)    |
| `/api/billing/usage`         | May need force-dynamic (user-specific data)    |
| `/api/admin/ai-costs`        | Admin only — force-dynamic is fine             |
| `/api/admin/pipeline-status` | Admin only — force-dynamic is fine             |
| `/api/.well-known/x402`      | Config route — could be static with revalidate |
| `/api/v1/x402`               | Payment route — may need force-dynamic         |

## Task

1. **Read** each route file listed above to understand what data it returns and how
2. **For ISR candidates:** Replace `export const dynamic = 'force-dynamic'` with `export const revalidate = N` where N is the suggested seconds (adjust based on actual data freshness needs)
3. **For streaming routes:** Keep `force-dynamic` — add a comment explaining why: `// force-dynamic required: SSE streaming response`
4. **For the root layout** (`src/app/[locale]/layout.tsx`): Investigate why it needs `force-dynamic`. Layouts that only need dynamic data for headers can use `headers()` or `cookies()` which automatically opt into dynamic rendering without the export.
5. **For the status page** (`src/app/[locale]/status/page.tsx`): Convert to ISR with `revalidate = 30`
6. **For admin routes:** Keep `force-dynamic` — add comment: `// force-dynamic: admin dashboard, always fresh`
7. **For billing routes:** If they read cookies/auth headers, remove `force-dynamic` (Next.js auto-detects dynamic from `headers()`/`cookies()` usage)

## How to Convert

**Before (force-dynamic):**

```typescript
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const data = await fetchSomeData();
  return NextResponse.json(data);
}
```

**After (ISR with revalidate):**

```typescript
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(request: NextRequest) {
  const data = await fetchSomeData();
  return NextResponse.json(data);
}
```

**Important:** If a route reads `request.headers`, `request.cookies`, or `request.nextUrl.searchParams` for personalization, it CANNOT use ISR and must stay dynamic. But if it only reads query params for filtering (like `?category=defi`), Next.js handles this via search param segmentation.

## Requirements

- Do NOT change any response format, headers, or business logic
- Only change the `dynamic`/`revalidate` export
- Add a brief comment on each remaining `force-dynamic` explaining the reason
- Run `bun run build` after changes to verify no build errors
- Routes that use `request` object for auth/cookies MUST stay dynamic

## Success Criteria

- At least 15 routes converted from `force-dynamic` to ISR
- All streaming routes retain `force-dynamic` with justification comments
- `bun run build` succeeds
- No 500 errors on converted routes (test with `bun run dev`)
