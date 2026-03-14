# 62 — Investigate Excessive RSC Fetch Requests

## Goal

Diagnose and fix the excessive number of `Fetch finished loading` entries in the production browser console. The console shows hundreds of sequential fetch requests, suggesting runaway RSC (React Server Components) prefetching, client-side navigation loops, or over-fetching patterns.

## Context

- **Framework:** Next.js 16 with App Router, RSC enabled
- **Deployment:** Vercel
- **Symptom:** Browser console flooded with `Fetch finished loading: GET "<URL>"` entries — hundreds of them in sequence

### Error from Production Console

```
Fetch finished loading: GET "<URL>".
Fetch finished loading: GET "<URL>".
... (repeats 300+ times)
```

Many of these fetches are RSC payload requests (URLs with `?_rsc=...` query parameters), indicating Next.js client-side navigation or prefetching is firing far more requests than expected.

## Potential Causes

### 1. Link Prefetching Amplification

Next.js App Router prefetches `<Link>` components that are visible in the viewport. If the page renders many links (e.g., news articles, coin lists, navigation menus), each triggers an RSC prefetch. With hundreds of links visible, this creates hundreds of prefetch requests.

### 2. Recursive Navigation or Router Events

A client-side `router.push()` or `router.replace()` in an effect that fires on route change could cause a loop. Also check for `useEffect` hooks that trigger navigation based on data that changes on every render.

### 3. RSC Streaming + Suspense Waterfalls

If Server Components use nested `Suspense` boundaries, each boundary may trigger a separate RSC fetch as it resolves, creating a waterfall of requests.

### 4. Service Worker Interference

The service worker (`public/sw.js`) intercepts fetch requests. If the caching strategy causes re-fetches on cache misses or the SW is refetching resources the browser already has, it could amplify request count.

## Task

### Step 1: Profile the Requests

1. Open browser DevTools → Network tab
2. Navigate to the homepage
3. Filter by `_rsc` to isolate RSC prefetch requests
4. Count the requests and categorize by URL pattern:
   - How many are RSC prefetches (contain `_rsc`)?
   - How many are API calls?
   - How many are duplicate URLs?

### Step 2: Audit Link Prefetching

1. **Search for `<Link>` usage** in pages that render many items:
   ```bash
   grep -rn '<Link' src/app/ src/components/ | head -50
   ```
2. **For pages with large lists** (news feed, coin list, etc.), add `prefetch={false}` to links below the fold:
   ```tsx
   <Link href={`/article/${slug}`} prefetch={false}>
   ```
3. **Check if `next/link`** default prefetching strategy is appropriate — with hundreds of visible links, it may need to be disabled globally or per-page

### Step 3: Check for Navigation Loops

1. Search for `router.push` or `router.replace` inside `useEffect`:
   ```bash
   grep -rn 'router\.\(push\|replace\)' src/ --include='*.tsx' --include='*.ts'
   ```
2. Verify none of these fire unconditionally or create dependency cycles
3. Check for redirect chains in middleware (`src/middleware/redirects.ts`)

### Step 4: Audit Service Worker Caching

1. Review `public/sw.js` caching strategies
2. Check if the SW is re-fetching resources that could be served from cache
3. Verify the SW doesn't intercept RSC requests unnecessarily

### Step 5: Implement Fixes

Based on findings:
- Add `prefetch={false}` to links in long lists
- Use `IntersectionObserver` to lazy-prefetch only truly visible links
- Batch or debounce any programmatic navigation
- Consider using `next.config.js` `experimental.optimizePackageImports` if not already set

## Files to Examine

- `src/app/[locale]/page.tsx` — homepage (likely renders many links)
- `src/components/NewsFeed.tsx` or similar — news list components
- `src/components/BottomNav.tsx` — navigation (each item prefetches)
- `src/components/Header.tsx` or `Navigation.tsx` — top nav links
- `public/sw.js` — service worker fetch interception (lines ~50-80)
- `src/middleware/redirects.ts` — redirect chains
- `next.config.js` — prefetch configuration

## Acceptance Criteria

- [ ] Root cause of excessive fetches identified and documented
- [ ] Number of initial page load fetch requests reduced by 50%+ (or to a reasonable count)
- [ ] No visible performance regression in page transitions
- [ ] RSC prefetching limited to above-the-fold or critical links
- [ ] Network tab shows a reasonable number of requests on initial load
