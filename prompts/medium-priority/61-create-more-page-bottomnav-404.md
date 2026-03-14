# 61 — Create Missing `/more` Page (BottomNav 404)

## Goal

Create the missing `/more` page that the mobile bottom navigation links to. The `BottomNav` component links to `/more` but no such route exists, causing a 404 in production. The console shows: `GET /more?_rsc=eqsiq 404 (Not Found)`.

## Context

- **Framework:** Next.js 16 with App Router, internationalized routes (`[locale]`)
- **Broken link:** `src/components/BottomNav.tsx` line 33: `{ href: "/more", label: "More", icon: MoreHorizontal, badge: "alerts" }`
- **Navigation pattern:** The BottomNav has 5 items: Home, Markets, Search, Bookmarks, More
- **Related component:** `src/components/ExploreMore.tsx` — an "Explore More" component that links to various sections (markets, defi, portfolio, gas, calculator, developers, learn, sources, fear-greed)

### Error from Production Console

```
GET https://free-crypto-news-xxx.vercel.app/more?_rsc=eqsiq 404 (Not Found)
```

The `_rsc` query parameter indicates this is a React Server Components client-side navigation request, meaning Next.js prefetches the RSC payload when the BottomNav is visible.

## Task

### Option A: Create the `/more` Page (Recommended)

Create `src/app/[locale]/more/page.tsx` as a hub page that organizes all the secondary sections. This makes "More" a real destination with useful navigation.

**Page should include links to:**
- `/portfolio` — Portfolio tracker
- `/alerts` — Price alerts (with badge count)
- `/gas` — Gas tracker
- `/calculator` — Crypto calculator
- `/defi` — DeFi overview
- `/nft` — NFT section
- `/developers` — Developer tools / API docs
- `/learn` — Educational content
- `/sources` — News sources
- `/fear-greed` — Fear & Greed Index
- `/settings` — User settings
- `/about` — About page

**Design:**
- Grid layout with icon + label for each section
- Responsive: 2 columns on mobile, 3-4 on tablet/desktop
- Match existing design system (Tailwind, shadcn/ui patterns)
- Include the alerts badge count if alerts are pending
- Add proper metadata (`generateMetadata`)

### Option B: Convert to Dropdown/Sheet

If a dedicated page feels heavy, convert the "More" nav item to open a bottom sheet or dropdown menu instead of navigating. This avoids creating a new page but requires changing the BottomNav behavior.

### Step 1: Create the Page

Create `src/app/[locale]/more/page.tsx` with:
1. A grid of navigation cards/links to secondary sections
2. Proper i18n support via `next-intl`
3. Metadata for SEO

### Step 2: Verify Navigation

1. The `BottomNav` already links to `/more` via the `Link` component from `@/i18n/navigation`, which handles locale prefixing
2. Verify the page renders correctly at `/en/more`, `/es/more`, etc.
3. Verify the RSC prefetch no longer 404s

### Step 3: Add to Sitemap (if applicable)

If the project has a sitemap generator, include `/more` in it.

## Files to Create

- `src/app/[locale]/more/page.tsx` — the More hub page

## Files to Examine

- `src/components/BottomNav.tsx` — the broken link source (line 33)
- `src/components/ExploreMore.tsx` — existing "explore more" section for reference
- `src/app/[locale]/layout.tsx` — layout structure
- `src/i18n/navigation.ts` — i18n Link component

## Acceptance Criteria

- [ ] Navigating to `/more` no longer returns 404
- [ ] The page displays a grid of links to secondary sections
- [ ] RSC prefetch from BottomNav succeeds (no console errors)
- [ ] Page works with all locale prefixes
- [ ] Responsive layout: mobile-friendly grid
- [ ] Proper `<title>` and `<meta>` tags via `generateMetadata`
