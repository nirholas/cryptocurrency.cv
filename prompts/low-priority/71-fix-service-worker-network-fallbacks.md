# 71 — Fix Service Worker Network Fallback Failures

## Goal

Address the service worker (SW) network failures where the SW falls back to cache for various API endpoints. While cache-first fallback is correct behavior, the frequency of failures suggests the API endpoints are unreliable or misconfigured.

## Context

- **Service worker:** `public/sw.js` (custom, not Workbox)
- **PWA Provider:** `src/components/PWAProvider.tsx`

### Console Log Evidence

```
sw.js:179 [SW] Network failed, trying cache: https://cryptocurrency.cv/api/orderbook?symbol=BTC&view=aggregated
sw.js:179 [SW] Network failed, trying cache: https://cryptocurrency.cv/api/orderbook?symbol=BTC&view=aggregated
sw.js:179 [SW] Network failed, trying cache: https://cryptocurrency.cv/api/trending
sw.js:179 [SW] Network failed, trying cache: https://.../api/rss?_rsc=9tudu
sw.js:179 [SW] Network failed, trying cache: https://.../api/podcast
sw.js:179 [SW] Network failed, trying cache: https://.../api/videos?limit=21&offset=0
```

### Issues

1. **Orderbook API failures** — The `/api/orderbook` endpoint fails on network requests, falling back to stale cached data
2. **Trending API** — `/api/trending` also fails
3. **RSC requests cached by SW** — The SW intercepts RSC navigation requests (`?_rsc=...`) which may cause stale page data
4. **Podcast/Videos API** — Media endpoints fail, cached versions served

## Task

### Step 1: Review SW Caching Strategy

Check `public/sw.js` caching strategies:
- Which routes use network-first vs cache-first?
- Are RSC requests (`?_rsc=`) being intercepted? They shouldn't be.
- What's the cache TTL for API responses?

### Step 2: Exclude RSC Requests from SW

RSC navigation requests should not be cached by the service worker. Add an exclusion:

```javascript
// In sw.js fetch handler
if (url.searchParams.has('_rsc')) {
  return fetch(event.request);
}
```

### Step 3: Improve API Resilience

For the orderbook and trending API endpoints, investigate why they fail:
- Are they returning errors (500, 503)?
- Is there a rate limit being hit?
- Are the API routes timing out?

### Step 4: Add Stale-While-Revalidate

For API routes that are slow, use stale-while-revalidate:
- Return cached data immediately
- Fetch fresh data in the background
- Update cache for next request

## Files to Inspect

- `public/sw.js` — service worker implementation
- `src/app/api/orderbook/route.ts` — orderbook API route
- `src/app/api/trending/route.ts` — trending API route
- `src/components/PWAProvider.tsx` — SW registration and messaging

## Acceptance Criteria

- [ ] RSC requests (`?_rsc=`) bypass the service worker
- [ ] API endpoints return data reliably (or fail gracefully)
- [ ] SW cache fallback shows appropriate "stale data" indicators
- [ ] Network failure logs reduced to genuine offline scenarios
