# 68 — Fix Excessive RSC Fetch Flood

## Goal

Diagnose and fix the excessive number of React Server Component (RSC) fetch requests observed in the browser console. Production logs show hundreds of `Fetch finished loading: GET "<URL>"` entries, indicating either runaway prefetching, recursive navigation, or an infinite re-render loop triggering RSC payloads.

## Context

- **Framework:** Next.js 16 with App Router (RSC)
- **Deployment:** Vercel
- **Symptom:** Browser console flooded with 300+ `Fetch finished loading` entries during normal page navigation

### Console Evidence

```
Fetch finished loading: GET "https://...vercel.app/coin/ripple?_rsc=eqsiq".
Fetch finished loading: GET "https://...vercel.app/coin/ripple?_rsc=r3ifd".
Fetch finished loading: GET "https://...vercel.app/coin/cardano?_rsc=eqsiq".
Fetch finished loading: GET "https://...vercel.app/coin/cardano?_rsc=8fz1d".
Fetch finished loading: GET "<URL>".
... (300+ more entries)
```

### Likely Causes

1. **Aggressive Link prefetching** — Next.js prefetches `<Link>` components in the viewport. If a page renders many `<Link>` components (e.g., a coin list with 100+ coins), each gets prefetched.
2. **Re-render causing re-prefetch** — A state change in a parent component causes child `<Link>` components to re-mount, triggering new prefetch requests.
3. **RSC payload refetching** — Client-side navigation with `router.push()` or `router.refresh()` in a loop.
4. **Polling or interval** — A component using `setInterval` or `router.refresh()` on a timer.

## Task

### Step 1: Audit High-Link-Count Pages

Check pages that render many links:
- Homepage with news cards (each links to `/coin/{id}`, `/source/{id}`)
- Markets page with coin listings
- Search results

### Step 2: Disable Prefetch for Dense Lists

For pages with 50+ links, disable automatic prefetching:

```tsx
<Link href={`/coin/${coin.id}`} prefetch={false}>
  {coin.name}
</Link>
```

### Step 3: Check for Client-Side Navigation Loops

Search for patterns that could cause infinite navigation:
- `router.push()` or `router.replace()` inside `useEffect` without proper deps
- `router.refresh()` on a timer or in a render cycle
- Redirect loops between pages

### Step 4: Implement Intersection Observer Prefetching

Instead of Next.js default viewport prefetching, implement manual prefetch with an IntersectionObserver that only prefetches visible links:

```tsx
// Custom hook for lazy prefetch
const prefetchedRef = useRef(new Set<string>());
// Only prefetch when link is in viewport for 500ms+
```

### Step 5: Profile with React DevTools

Use React DevTools Profiler to identify:
- Components that re-render excessively
- Render cascades that cause link re-mounting

## Files to Inspect

- `src/components/NewsCard.tsx` — renders links to coins/sources
- `src/components/Header.tsx` — navigation links
- `src/components/BottomNav.tsx` — bottom navigation
- `src/app/[locale]/page.tsx` — homepage (likely renders many cards)
- `src/app/[locale]/markets/page.tsx` — markets page
- Any component using `router.push()`, `router.refresh()`, or `useRouter()`

## Acceptance Criteria

- [ ] Normal page load triggers < 20 RSC fetch requests
- [ ] No visible performance degradation from disabling prefetch
- [ ] No infinite navigation loops
- [ ] Console noise reduced by 90%+
