# 70 — Fix External API Fetch Failures at Build Time

## Goal

Fix the multiple external API fetch failures that occur during the Vercel build process. Forkast News and Reservoir API (NFT floor prices) consistently fail with `TypeError: fetch failed`, causing missing data on initial page renders.

## Context

- **Framework:** Next.js 16 on Vercel
- **Build environment:** Vercel build workers (may have network restrictions or DNS issues)

### Build Log Errors

**Forkast News:**
```
Error fetching Forkast News: TypeError: fetch failed
  [cause]: AggregateError:
```

**Reservoir API (15+ failures):**
```
Reservoir API request failed: TypeError: fetch failed
```
(Repeated 15+ times during build, one for each NFT collection/endpoint)

### Possible Causes

1. **DNS resolution failure** — Vercel build workers may not resolve certain domains
2. **Firewall/rate limiting** — External APIs may block Vercel's IP ranges
3. **API deprecation** — Endpoints may have moved or been shut down
4. **Missing API keys** — Reservoir may now require authentication
5. **Network timeout** — Build-time fetches may hit default timeout limits

## Task

### Step 1: Verify API Endpoints

Check if each API is still active:
- Forkast News feed URL — is the RSS/API endpoint still up?
- Reservoir API — does it require an API key now?

### Step 2: Add Build-Time Error Handling

Ensure all external fetch calls used during SSG/ISR have proper error handling:

```typescript
try {
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
} catch (error) {
  console.warn(`[Source] Fetch failed, using fallback:`, error);
  return getFallbackData();
}
```

### Step 3: Add Timeouts

Add explicit timeouts to prevent build hangs:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

### Step 4: Provide Build-Time Fallbacks

For pages that depend on these APIs during SSG, provide static fallback data:
- Empty arrays with appropriate "data unavailable" flags
- Last-known-good cached data from the archive
- ISR revalidation to fetch fresh data after deployment

## Files to Inspect

- Search for `forkast` in `src/` — find Forkast News fetching code
- Search for `reservoir` in `src/` — find Reservoir API calls
- `src/lib/news-sources.ts` or similar — source configuration
- `src/lib/providers/adapters/` — provider adapters that fetch external data

## Acceptance Criteria

- [ ] Build completes without `TypeError: fetch failed` errors
- [ ] Pages render with fallback data when APIs are unavailable
- [ ] All fetches have proper timeout and error handling
- [ ] Runtime fetches succeed when APIs are available post-deploy
