# 62 — Fix API Routes Returning 503 Service Unavailable

## Goal

Fix the 503 errors on multiple API routes:

```
GET /api/compare?coins=bitcoin,ethereum,solana  503 (Service Unavailable)
GET /api/podcast                                 503 (Service Unavailable)
GET /api/rss?_rsc=9tudu                          503 (Service Unavailable)
GET /api/videos?limit=21&offset=0                503 (Service Unavailable)
```

The service worker also reports network failure for these:
```
[SW] Network failed, trying cache: .../api/rss?_rsc=9tudu
```

## Context

- **Framework:** Next.js 16 with App Router on Vercel
- **Common thread:** All four routes use `export const runtime = 'edge'`
- **Deployment:** Vercel Edge Functions
- **503 meaning on Vercel:** Edge Function crashed, timed out (default 25s), or exceeded memory limits
- **Build warning:** Turbopack flagged `process.on` in `src/lib/telemetry.ts` as incompatible with Edge Runtime — telemetry is imported (directly or transitively) by several of these routes

## Affected Routes

| Route | File | Runtime | Key Dependencies |
|-------|------|---------|-----------------|
| `/api/compare` | `src/app/api/compare/route.ts` | edge | Market data, revalidate=60 |
| `/api/podcast` | `src/app/api/podcast/route.ts` | edge | AI generation (flash/deep-dive/market-open/weekly-recap) |
| `/api/rss` | `src/app/api/rss/route.ts` | edge | News fetching, XML generation, revalidate=300 |
| `/api/videos` | `src/app/api/videos/route.ts` | edge | YouTube RSS parsing, revalidate=900 |

## Task

### 1. Check for Node.js API usage in edge routes

Edge Runtime has a restricted API surface. Audit each route and its transitive imports for:
- `process.on`, `process.env` patterns that assume Node
- `fs`, `path`, `crypto` (Node built-ins)
- Libraries that use Node APIs internally (e.g., some XML parsers)
- `src/lib/telemetry.ts` — already flagged for `process.on`

### 2. Evaluate if edge runtime is needed

For each route, determine if Edge is actually required:
- `/api/compare` — Returns JSON market data. **Can use Node.js runtime.**
- `/api/podcast` — AI generation is CPU-intensive. **Should use Node.js runtime** (higher time limit, more memory).
- `/api/rss` — XML generation. **Can use Node.js runtime** (XML parsing libraries often need Node).
- `/api/videos` — YouTube RSS parsing. **Can use Node.js runtime** (XML parsing).

If edge isn't required, change to Node.js runtime:
```typescript
// Remove: export const runtime = 'edge';
// The default is 'nodejs' — just delete the edge declaration
```

### 3. Add error handling and timeout protection

For routes that stay on edge:
```typescript
export async function GET(request: Request) {
  try {
    // ... route logic
  } catch (error) {
    console.error('[api/route-name]', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Check Vercel Edge Function limits

- **Execution time:** 25s (free), 300s (Pro) for Edge; Serverless has 60s/900s
- **Memory:** 128MB for Edge; 1024MB+ for Serverless
- **Bundle size:** 4MB for Edge
- If podcast AI generation or XML parsing exceeds these, switch to serverless

### 5. Verify revalidate + edge interaction

Some routes use both `runtime: 'edge'` and `revalidate: N`. Ensure ISR cache works correctly with Edge — on Vercel, ISR with Edge uses the Edge cache, but cold starts can 503 if the function crashes.

## Acceptance Criteria

- [ ] All four API routes return 200 with valid responses
- [ ] No 503 errors in browser console or service worker logs
- [ ] Routes that don't need Edge switched to Node.js runtime
- [ ] Error handling added to prevent unhandled crashes
- [ ] Service worker cache fallback works for temporary failures
