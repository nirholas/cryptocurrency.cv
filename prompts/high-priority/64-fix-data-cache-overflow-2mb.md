# 64 — Fix Next.js Data Cache Overflow (>2MB Responses)

## Goal

Fix the build-time warnings where multiple external API responses exceed Vercel's 2MB data cache limit, causing `Failed to set Next.js data cache` errors. This means these responses are re-fetched on every request instead of being cached, degrading performance and increasing external API load.

## Context

- **Framework:** Next.js 16 on Vercel
- **Cache limit:** Vercel's data cache has a 2MB per-entry limit
- **Impact:** Uncached responses hit external APIs on every request, increasing latency and risking rate limits

### Affected Endpoints (from build log)

| Source URL | Size | Frequency |
|---|---|---|
| `cryptodaily.co.uk/feed` | ~2.5 MB | 15+ occurrences |
| `api.llama.fi/protocols` | ~10 MB | 5+ occurrences |
| `yields.llama.fi/pools` | ~17.5 MB | 5+ occurrences |
| `api.llama.fi/raises` | ~3.8 MB | 2+ occurrences |
| `feeds.simplecast.com/JGE3yC0V` | ~11.9 MB | 3+ occurrences |
| `cryptocurrency.cv/api/derivatives` | ~9.5 MB | 10+ occurrences |

### Build Log Examples

```
Failed to set Next.js data cache for https://cryptodaily.co.uk/feed, items over 2MB can not be cached (2575015 bytes)
Failed to set Next.js data cache for https://api.llama.fi/protocols, items over 2MB can not be cached (10125732 bytes)
Failed to set Next.js data cache for https://yields.llama.fi/pools, items over 2MB can not be cached (17574551 bytes)
```

## Task

### Step 1: Reduce Response Size at Fetch Time

For each oversized API call, trim the response before caching:

1. **DeFiLlama protocols (`api.llama.fi/protocols`)** — Only extract fields needed (name, tvl, chain, symbol, category). Don't cache the full protocol objects.
2. **DeFiLlama pools (`yields.llama.fi/pools`)** — Filter to top pools by TVL or limit to active pools only.
3. **DeFiLlama raises** — Limit to recent raises (last 6 months).
4. **Crypto Daily RSS feed** — Parse the XML and extract only article metadata (title, link, date, description). Don't store full HTML content.
5. **Simplecast podcast feed** — Parse and extract episode metadata only (title, date, duration, link).
6. **Derivatives API** — Paginate or filter to major exchanges/pairs only.

### Step 2: Implement Response Trimming

Create a utility or use existing patterns to trim large API responses:

```typescript
// Example: trim DeFiLlama protocols to only needed fields
const protocols = fullResponse.map(({ name, tvl, chain, symbol, category, logo }) => ({
  name, tvl, chain, symbol, category, logo
}));
```

### Step 3: Use Redis Cache for Large Responses

For responses that genuinely need to be large, bypass Next.js data cache and use the existing Redis cache layer directly:

```typescript
// Instead of fetch() with next: { revalidate: 300 }
// Use the Redis cache wrapper
const data = await cache.getOrSet('defi:protocols', fetchProtocols, 300);
```

### Step 4: Deduplicate Fetch Calls

The build log shows the same URLs being fetched 5-15 times. Ensure React's built-in fetch deduplication is working, or use `cache()` from React to memoize identical requests within a single render pass.

## Files to Inspect

- Search for `llama.fi` in `src/` — find all DeFiLlama API calls
- Search for `cryptodaily.co.uk` — find RSS feed parsing
- Search for `simplecast.com` — find podcast feed parsing
- Search for `api/derivatives` — find derivatives data call
- `src/lib/cache.ts` or `src/lib/redis.ts` — existing cache layer

## Acceptance Criteria

- [ ] Build completes with zero "items over 2MB" warnings
- [ ] All affected data sources still return correct data
- [ ] Response sizes are under 2MB after trimming
- [ ] No regression in page load time or data freshness
- [ ] Duplicate fetch calls are eliminated during build
