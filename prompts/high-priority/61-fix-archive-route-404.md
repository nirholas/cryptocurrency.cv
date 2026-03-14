# 61 — Fix /archive Route 404

## Goal

Fix the `/archive` route that returns 404 in production. The browser console shows repeated `GET /archive?_rsc=... 404 (Not Found)` errors with many different RSC cache keys, indicating client-side navigation to `/archive` fails consistently.

## Context

- **Framework:** Next.js 16 with App Router, i18n via `next-intl`
- **Deployment:** Vercel
- **Page location:** `src/app/[locale]/archive/page.tsx`
- **API routes:** `src/app/api/archive/route.ts`, `src/app/api/archive/v2/route.ts`
- **Navigation link:** `src/components/Header.tsx` links to `/archive` under the "Tools" dropdown

### Root Cause

The archive page exists at `src/app/[locale]/archive/page.tsx`, which means it's rendered under a locale prefix (e.g., `/en/archive`). However, the navigation links point to `/archive` without a locale prefix. In production with i18n routing, direct navigation to `/archive` returns 404 because there's no page at the bare `/archive` path — only at `/[locale]/archive`.

### Error from Production Console

```
GET https://free-crypto-news-...vercel.app/archive?_rsc=eqsiq 404 (Not Found)
GET https://free-crypto-news-...vercel.app/archive?_rsc=3maeh 404 (Not Found)
GET https://free-crypto-news-...vercel.app/archive?_rsc=1idpd 404 (Not Found)
... (15+ different _rsc cache keys, all 404)
```

## Task

### Step 1: Verify Navigation Links

Check how `/archive` is linked in `src/components/Header.tsx` and other navigation components. Ensure all links use the i18n-aware `Link` component from `@/i18n/navigation` rather than `next/link` directly.

### Step 2: Check Middleware Routing

Review `src/middleware/intl.ts` to verify the i18n middleware correctly redirects bare paths like `/archive` to `/en/archive` (or the user's locale). The middleware should handle locale prefixing for all non-API routes.

### Step 3: Add Redirect or Rewrite

If the middleware doesn't auto-redirect, add one of:
- A rewrite in `next.config.js` or `vercel.json` from `/archive` → `/en/archive`
- An `src/app/archive/page.tsx` that redirects to the localized version
- Fix the middleware matcher to include `/archive` in locale detection

### Step 4: Verify the Fix

After fixing:
- `GET /archive` should return 200 (or 308 redirect)
- RSC navigations (`/archive?_rsc=...`) should succeed
- The archive page should render correctly with historical news data

## Files to Inspect

- `src/app/[locale]/archive/page.tsx`
- `src/components/Header.tsx` (line ~51, Tools dropdown)
- `src/middleware/intl.ts`
- `middleware.ts`
- `next.config.js` (redirects/rewrites)

## Acceptance Criteria

- [ ] `/archive` no longer returns 404
- [ ] Client-side navigation to archive works without console errors
- [ ] Deep links to `/archive` redirect properly to localized path
- [ ] Existing `/en/archive` continues to work
