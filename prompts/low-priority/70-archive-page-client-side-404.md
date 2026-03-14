# 70 — Fix /archive Page 404 on Client-Side Navigation

## Goal

Fix the 404 error when navigating to `/archive` on the client side, while the page exists at `src/app/[locale]/archive/page.tsx`.

## Context

- **Page exists:** `src/app/[locale]/archive/page.tsx`
- **Expected URL:** `/en/archive` (with locale prefix)
- **Failing URL:** `/archive` (without locale prefix)
- **Deployment:** Vercel

### Browser Console Error

```
GET https://free-crypto-news-2njb69xxy-aryllyraaryl-6220s-projects.vercel.app/archive?_rsc=1si4f 404 (Not Found)
GET https://free-crypto-news-2njb69xxy-aryllyraaryl-6220s-projects.vercel.app/archive?_rsc=g9epf 404 (Not Found)
```

The RSC fetch goes to `/archive` but the actual route is `/[locale]/archive`. This means:

1. There's a link somewhere pointing to `/archive` instead of `/${locale}/archive`
2. The middleware locale redirect isn't handling this path, OR
3. The RSC prefetch hits `/archive` before middleware can redirect

## Task

### Step 1: Find Links to `/archive`

Search for any components or pages linking to `/archive` without the locale prefix:

```bash
grep -rn '"/archive"' src/
grep -rn "'/archive'" src/
grep -rn 'href.*archive' src/components/
```

### Step 2: Fix Links to Include Locale

All internal links should use the locale-aware pattern:

```typescript
// Wrong
<Link href="/archive">Archive</Link>

// Correct
<Link href={`/${locale}/archive`}>Archive</Link>
// Or use the app's navigation helper
```

### Step 3: Verify Middleware Handles /archive

Check `middleware.ts` to ensure bare `/archive` redirects to `/en/archive`:

```typescript
// middleware.ts should redirect /archive → /en/archive
```

### Step 4: Check Navigation Components

The archive link is likely in a navigation component (bottom nav, sidebar, or header). Check:
- `src/components/BottomNav.tsx` or similar
- `src/components/Header.tsx` or similar
- `src/components/Sidebar.tsx` or similar

## Files to Modify

- Component(s) containing the `/archive` link → add locale prefix
- `middleware.ts` — ensure locale redirect covers `/archive`

## Acceptance Criteria

- [ ] Client-side navigation to archive page works without 404
- [ ] No hardcoded `/archive` links remain (all use locale prefix)
- [ ] Middleware properly redirects `/archive` → `/en/archive`
- [ ] SEO: no 404s in search console for archive URLs
