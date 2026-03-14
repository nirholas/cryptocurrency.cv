# 69 — Fix Next.js Data Cache 2MB Limit Exceeded Warnings

## Goal

Address the 70+ warnings about Next.js data cache items exceeding the 2MB limit, which prevents caching of large API responses and RSS feeds.

## Context

- **Framework:** Next.js 16 (Turbopack)
- **Deployment:** Vercel
- **Warning count:** 73 warnings during a single build
- **Impact:** Large responses are re-fetched on every request instead of being cached, increasing latency and upstream API load

### Build Warnings

```
Failed to set Next.js data cache for https://cryptodaily.co.uk/feed, items over 2MB can not be cached (2575015 bytes)
Failed to set Next.js data cache for https://api.llama.fi/protocols, items over 2MB can not be cached (10125732 bytes)
Failed to set Next.js data cache for https://yields.llama.fi/pools, items over 2MB can not be cached (17574551 bytes)
Failed to set Next.js data cache for https://api.llama.fi/raises, items over 2MB can not be cached (3798036 bytes)
Failed to set Next.js data cache for https://feeds.simplecast.com/JGE3yC0V, items over 2MB can not be cached (11916729 bytes)
Failed to set Next.js data cache for https://dappradar.com/blog/feed, items over 2MB can not be cached (3031994 bytes)
Failed to set Next.js data cache for https://api.llama.fi/overview/dexs, items over 2MB can not be cached (20174352 bytes)
Failed to set Next.js data cache for https://cryptocurrency.cv/api/derivatives, items over 2MB can not be cached (9470274 bytes)
```

### Oversized Responses Summary

| URL | Size | Over By |
|-----|------|---------|
| `yields.llama.fi/pools` | 17.5 MB | 8.8× limit |
| `api.llama.fi/overview/dexs` | 20.2 MB | 10.1× limit |
| `feeds.simplecast.com/JGE3yC0V` | 11.9 MB | 6× limit |
| `api.llama.fi/protocols` | 10.1 MB | 5× limit |
| `cryptocurrency.cv/api/derivatives` | 9.5 MB | 4.7× limit |
| `api.llama.fi/raises` | 3.8 MB | 1.9× limit |
| `dappradar.com/blog/feed` | 3.0 MB | 1.5× limit |
| `cryptodaily.co.uk/feed` | 2.6 MB | 1.3× limit |

## Task

### Step 1: Implement Response Trimming Before Caching

For API responses, fetch the full payload but only cache the subset needed:

```typescript
// Instead of caching the full 10MB protocols list:
const allProtocols = await fetch('https://api.llama.fi/protocols').then(r => r.json());
// Extract only what we need (top 100 by TVL, key fields only)
const trimmed = allProtocols
  .sort((a, b) => b.tvl - a.tvl)
  .slice(0, 100)
  .map(({ name, slug, tvl, chainTvls, category }) => ({ name, slug, tvl, chainTvls, category }));
```

### Step 2: Use Redis Cache Instead of Next.js Data Cache

For oversized datasets, bypass Next.js cache and use Redis directly:

```typescript
import { getFromCache, setInCache } from '@/lib/cache';

const cacheKey = 'defillama:protocols';
let data = await getFromCache(cacheKey);
if (!data) {
  data = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' }).then(r => r.json());
  await setInCache(cacheKey, data, 300); // 5 min TTL
}
```

Use `cache: 'no-store'` on the fetch to prevent Next.js from trying to cache it.

### Step 3: Limit RSS Feed Fetches

For RSS feeds that exceed 2MB, fetch only recent items:

```typescript
const feed = await parseFeed(feedUrl);
// Only keep last 50 articles instead of entire feed
const recentArticles = feed.items.slice(0, 50);
```

### Step 4: Paginate or Limit API Requests

Some APIs support pagination — use it:

```
https://api.llama.fi/protocols → fetch only top 100 or add ?limit=100 if supported
https://yields.llama.fi/pools → filter by TVL > threshold
```

### Step 5: Add `cache: 'no-store'` for Known Oversized Responses

As an immediate fix, prevent Next.js from attempting to cache known large responses:

```typescript
const response = await fetch(url, {
  next: { revalidate: 300 },
  cache: 'no-store' // Bypass Next.js data cache, handle caching in Redis
});
```

## Files to Modify

- `src/lib/apis/defillama.ts` — DeFiLlama API calls
- `src/lib/market-data.ts` — protocol/TVL fetching
- `src/lib/crypto-news.ts` — RSS feed fetching
- Any fetch calls to the 8 oversized URLs listed above
- `src/app/api/derivatives/route.ts` — self-referential derivatives API

## Acceptance Criteria

- [ ] Build produces 0 "items over 2MB can not be cached" warnings
- [ ] Data still accessible via Redis cache or trimmed responses
- [ ] No increase in upstream API calls at runtime
- [ ] Page performance not degraded (cached data still served quickly)
