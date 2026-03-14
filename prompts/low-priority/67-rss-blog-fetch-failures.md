# 67 — Fix RSS/Blog Feed Fetch Failures During Build

## Goal

Address the 5 external blog/RSS feeds that fail to fetch during Vercel builds due to DNS resolution failures or timeouts.

## Context

- **Framework:** Next.js 16 (static generation during build)
- **Fetch mechanism:** `src/lib/crypto-news.ts` RSS fetcher
- **Impact:** Missing news articles from these sources; errors pollute build logs

### Build Errors

```
Error fetching Forkast News: TypeError: fetch failed
  [cause]: AggregateError

Error fetching Artemis Blog: TypeError: fetch failed
  [cause]: Error { code: 'ETIMEDOUT' }

Error fetching Rhinestone Blog: TypeError: fetch failed (×2)

Error fetching MakerDAO Governance: TypeError: fetch failed (×2)

Error fetching Helium Blog: TypeError: fetch failed (×2)
```

### Root Causes

- **DNS failures:** Some blog domains may not resolve from Vercel's build environment
- **Timeouts:** Some blogs respond too slowly for the build timeout
- **Blocked IPs:** Some sites block cloud provider IP ranges

## Task

### Step 1: Verify Feed URLs Are Still Valid

Check each feed URL:

1. **Forkast News** — verify `forkast.news` RSS feed URL
2. **Artemis Blog** — verify `artemis.xyz/blog` or similar RSS feed URL
3. **Rhinestone Blog** — verify RSS feed URL
4. **MakerDAO Governance** — verify govenance forum or blog feed URL
5. **Helium Blog** — verify `helium.com/blog` or similar RSS feed URL

Run from a local machine:
```bash
curl -sI <feed-url> | head -5
```

### Step 2: Update or Remove Dead Feeds

- If a feed URL has changed → update it
- If a site has shut down or removed their feed → remove from the source list
- If a site blocks server-side fetches → add to a "runtime-only" list that skips build-time fetching

### Step 3: Add Fetch Timeout Handling

In the RSS fetch function, ensure there's a reasonable timeout:

```typescript
const response = await fetch(feedUrl, {
  signal: AbortSignal.timeout(10000), // 10s timeout
  headers: { 'User-Agent': 'FreeCryptoNews/1.0 (+https://cryptocurrency.cv)' }
});
```

### Step 4: Suppress Build-Time Errors for Non-Critical Sources

These are supplementary news sources. Their failure shouldn't pollute the build log:

```typescript
try {
  const articles = await fetchFeed(url);
  return articles;
} catch (error) {
  // Warn instead of error for non-critical feeds
  console.warn(`[RSS] Failed to fetch ${sourceName}: ${error.message}`);
  return [];
}
```

### Step 5: Consider Build-Time vs Runtime Fetching

Move RSS fetching to runtime-only with ISR instead of fetching during static generation:

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 300; // Fetch fresh every 5 minutes at runtime
```

## Files to Modify

- `src/lib/crypto-news.ts` — RSS fetch function
- RSS feed source configuration (wherever feed URLs are defined)
- Any pages that trigger feed fetching during static generation

## Acceptance Criteria

- [ ] Dead/broken feed URLs updated or removed
- [ ] Build completes without feed fetch errors
- [ ] Working feeds still return articles
- [ ] Non-critical feed failures logged as warnings, not errors
- [ ] Fetch timeout set to prevent build hang
