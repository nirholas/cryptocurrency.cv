# 68 — Fix Build-Time Provider & Feed Failures

## Goal

Fix multiple build-time errors that occur during static page generation on Vercel:

### Error 1: Gaming provider chain failure
```
[Gaming/Chains] Error: AllProvidersFailedError: All providers failed for chain "gaming-data":
  dappradar: DAPPRADAR_API_KEY environment variable is required
  playtoearn: fetch failed
  footprint: FOOTPRINT_API_KEY not configured

[Gaming/Top] Error: Dynamic server usage: Route /api/gaming/top couldn't be
rendered statically because it used `request.url`.
```

### Error 2: DefiLlama API 404
```
DefiLlama API error: 404   (×4)
```

### Error 3: Forkast News fetch timeout
```
Error fetching Forkast News: TypeError: fetch failed
  [cause]: AggregateError, code: 'ETIMEDOUT'
```

### Error 4: Reservoir API DNS failure
```
Reservoir API request failed: TypeError: fetch failed
  [cause]: Error: getaddrinfo ENOTFOUND api.reservoir.tools   (×8)
```

### Error 5: CryptoDaily feed too large for cache
```
Failed to set Next.js data cache for https://cryptodaily.co.uk/feed,
items over 2MB can not be cached (2575015 bytes)   (×13)
```

## Context

- **When:** During `next build` → "Collecting page data" and "Generating static pages" phases
- **Impact:** Pages that depend on these data sources either fail to pre-render or render with empty/error states
- **Build environment:** Vercel build machines (may lack certain API keys, DNS resolution differs)

## Task

### 1. Gaming provider: add graceful fallback for missing API keys

The gaming-data provider chain requires `DAPPRADAR_API_KEY` and `FOOTPRINT_API_KEY`. During build, these may not be available. The providers should:
- Check for API keys before attempting requests
- Return empty/mock data during build instead of throwing `AllProvidersFailedError`
- The `playtoearn` adapter should handle `fetch failed` gracefully

**Files:** `src/lib/providers/adapters/gaming-data/` adapters

### 2. Gaming/Top: fix DYNAMIC_SERVER_USAGE

`/api/gaming/top` uses `request.url` which prevents static rendering. Either:
- Add `export const dynamic = 'force-dynamic'` to skip static generation
- Refactor to use `nextUrl.searchParams` instead of raw `request.url`

**File:** `src/app/api/gaming/top/route.ts`

### 3. DefiLlama: update API endpoint

The DefiLlama API is returning 404, suggesting the endpoint URL changed. Check:
- Current endpoint in code vs DefiLlama's latest API docs
- Whether `api.llama.fi` moved endpoints (they periodically restructure)

**Search:** `grep -rn 'llama.fi\|defillama' src/`

### 4. Forkast News: handle timeout gracefully

Add a timeout and fallback for the Forkast News RSS fetch:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
try {
  const response = await fetch(url, { signal: controller.signal });
  // ...
} catch (e) {
  console.warn('[Forkast] Fetch timed out, using cached data');
  return cachedData ?? [];
} finally {
  clearTimeout(timeout);
}
```

**Search:** `grep -rn 'forkast\|Forkast' src/`

### 5. Reservoir API: handle DNS failure

`api.reservoir.tools` is not resolving. Either:
- The service is down/renamed — verify the current domain
- Add DNS failure handling with graceful degradation
- Disable the adapter if the service no longer exists

**Search:** `grep -rn 'reservoir' src/`

### 6. CryptoDaily: limit feed response size

The CryptoDaily RSS feed returns 2.5MB which exceeds Next.js data cache limit (2MB). Options:
- Truncate/limit the number of items fetched from the feed
- Parse and extract only needed fields before caching
- Use `fetch` with custom cache handler that compresses data

**Search:** `grep -rn 'cryptodaily' src/`

## Acceptance Criteria

- [ ] `bun run build` completes without provider/feed errors
- [ ] Gaming pages render with empty state when API keys are missing
- [ ] DefiLlama data fetches successfully with updated endpoint
- [ ] Forkast News timeout doesn't block page generation
- [ ] Reservoir API failure handled gracefully
- [ ] CryptoDaily feed cached successfully (under 2MB)
- [ ] All static pages generate without blocking errors
