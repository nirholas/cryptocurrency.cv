# 62 — Fix /more Route 404

## Goal

Fix the `/more` route that returns 404 in production. The mobile bottom navigation shows a "More" label that links somewhere, but `GET /more?_rsc=eqsiq` returns 404.

## Context

- **Framework:** Next.js 16 with App Router
- **Deployment:** Vercel
- **Bottom nav:** `src/components/BottomNav.tsx`
- **"More" item:** Routes to `/settings` (label is "More", href is `/settings`)

### Current Navigation Config

```typescript
// src/components/BottomNav.tsx line ~28
const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/markets', label: 'Markets', icon: BarChart3 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark, badge: 'bookmarks' },
  { href: '/settings', label: 'More', icon: MoreHorizontal, badge: 'alerts' },
];
```

### Error from Production Console

```
GET https://free-crypto-news-...vercel.app/more?_rsc=eqsiq 404 (Not Found)
```

### Possible Root Causes

1. **Old link reference:** A cached or stale link somewhere still points to `/more` instead of `/settings`
2. **Prefetch from old deployment:** A service worker or browser cache from a prior deployment when the route was `/more`
3. **External link or hardcoded reference:** Some component or page links to `/more` directly
4. **Same locale prefix issue as /archive:** If `/settings` is under `[locale]`, bare `/more` would 404

## Task

### Step 1: Search for `/more` References

Search the entire codebase for any remaining references to `href="/more"` or `href: '/more'` or `to="/more"` or any `Link` component pointing to `/more`.

### Step 2: Check Settings Page Existence

Verify `src/app/[locale]/settings/page.tsx` exists and works. If the link is `/settings` but the page is at `/[locale]/settings`, the same locale issue applies.

### Step 3: Check Service Worker Cache

Review `public/sw.js` for any cached route lists or precache manifest that includes `/more`. An old SW might be intercepting and trying to serve `/more`.

### Step 4: Add Redirect

If `/more` was a previous route that's been renamed to `/settings`, add a redirect:
- In `next.config.js` redirects array: `/more` → `/settings`
- Or in `vercel.json` redirects

## Files to Inspect

- `src/components/BottomNav.tsx`
- `src/app/[locale]/settings/page.tsx`
- `public/sw.js` (or generated SW)
- `next.config.js` (redirects)
- `vercel.json` (redirects)
- Search entire `src/` for `/more` references

## Acceptance Criteria

- [ ] `GET /more` no longer returns 404 (redirects to `/settings`)
- [ ] No console errors for `/more` navigation
- [ ] Bottom nav "More" button works correctly
- [ ] Old bookmarks/links to `/more` redirect properly
