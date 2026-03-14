# 64 — Fix DefiLlama API 404 Errors During Build

## Goal

Diagnose and fix the repeated DefiLlama API 404 errors occurring during Vercel builds, which indicate broken or changed upstream endpoints.

## Context

- **Source:** `src/lib/apis/defillama.ts` (line ~166: `console.error('DefiLlama API error: ${response.status}')`)
- **Frequency:** 12+ occurrences during a single build
- **Impact:** DeFi data pages may render with missing/stale data

### Build Log Errors

```
14:54:23.498 DefiLlama API error: 404
14:54:23.509 DefiLlama API error: 404
14:54:23.531 DefiLlama API error: 404
14:54:23.532 DefiLlama API error: 404
14:54:24.688 DefiLlama API error: 404
14:54:24.689 DefiLlama API error: 404
14:54:24.703 DefiLlama API error: 404
... (12+ total)
```

## Task

### Step 1: Identify Which Endpoints Return 404

The log message doesn't include the URL. Add the URL to the error log in `src/lib/apis/defillama.ts`:

```typescript
console.error(`DefiLlama API error: ${response.status} for ${url}`);
```

### Step 2: Audit DefiLlama API Endpoints

Check that all endpoints used in the codebase are still valid against the current DeFiLlama API docs (https://defillama.com/docs/api):

Common endpoints to verify:
- `https://api.llama.fi/v2/protocols` → may have moved to `/protocols`
- `https://api.llama.fi/protocol/{name}` → check slug format
- `https://stablecoins.llama.fi/stablecoins` → verify availability
- `https://yields.llama.fi/pools` → verify availability
- `https://api.llama.fi/raises` → verify availability
- `https://api.llama.fi/overview/dexs` → verify availability

### Step 3: Fix Broken URLs

Update any URLs that have changed or been deprecated. DeFiLlama occasionally restructures their API.

### Step 4: Add Graceful Fallback

For 404 responses, return cached/fallback data instead of propagating errors:

```typescript
if (response.status === 404) {
  console.warn(`DefiLlama endpoint not found: ${url} — returning fallback data`);
  return getCachedFallback(url);
}
```

### Step 5: Improve Error Logging

Include the full URL and response body in error logs for faster debugging:

```typescript
if (!response.ok) {
  const body = await response.text().catch(() => '');
  console.error(`DefiLlama API error: ${response.status} for ${url}`, body.slice(0, 200));
}
```

## Files to Modify

- `src/lib/apis/defillama.ts` — main DeFi API client
- `src/lib/market-data.ts` — uses defillama.ts for protocol/chain TVL fetching
- Any routes that call DefiLlama during static generation

## Acceptance Criteria

- [ ] All DefiLlama API endpoints verified against current API docs
- [ ] Broken URLs updated to current endpoints
- [ ] Error log includes URL for each failed request
- [ ] Build completes with 0 DefiLlama 404 errors
- [ ] DeFi pages render with correct data
