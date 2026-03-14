# 61 — Fix /archive and /more Routes Returning 404

## Goal

Fix the 404 errors when navigating to `/archive` and `/more`:

```
GET /archive 404 (Not Found)
GET /archive?_rsc=... 404 (Not Found)
GET /more?_rsc=eqsiq 404 (Not Found)
```

These routes are repeatedly hit (15+ different `_rsc` tokens for `/archive` alone), indicating client-side navigation links point to locale-less paths.

## Context

- **Framework:** Next.js 16 with App Router
- **Routing:** Locale-prefixed routes under `src/app/[locale]/`
- **Archive page exists:** `src/app/[locale]/archive/page.tsx` (renders `ArchiveExplorer` component)
- **More page exists:** `src/app/[locale]/more/page.tsx` (renders navigation menu)
- **Root cause:** Links somewhere in the app point to `/archive` and `/more` instead of `/{locale}/archive` and `/{locale}/more`. Since pages only exist under `[locale]/`, the bare paths return 404.
- **`_rsc` parameter:** Next.js React Server Components flight data — these are client-side navigations (not direct URL visits), meaning `<Link href="/archive">` is used somewhere without the locale prefix.

## Files to Investigate

| File | Role |
|------|------|
| `src/app/[locale]/archive/page.tsx` | Archive page (exists, works with locale) |
| `src/app/[locale]/more/page.tsx` | More page (exists, works with locale) |
| `src/middleware/intl.ts` | i18n middleware — may need to handle redirects |
| `middleware.ts` | Root middleware entry point |
| Search all `href="/archive"` and `href="/more"` | Find the broken link sources |

## Task

### 1. Find all links pointing to bare `/archive` and `/more`

```bash
grep -rn 'href="/archive\|href="/more\|"/archive"\|"/more"' src/
```

Fix each to use the locale-aware link pattern. If using `next-intl`, use:
```tsx
import { usePathname } from 'next-intl/client';
// or
import { Link } from '@/navigation'; // locale-aware Link
```

### 2. Add middleware redirects as a safety net

In the i18n middleware, add redirects so bare `/archive` → `/{defaultLocale}/archive` and `/more` → `/{defaultLocale}/more`:

This may already be handled by the i18n middleware's locale detection. Verify:
- Does the middleware match `/archive` and prepend the default locale?
- If not, add these paths to the matcher or add explicit redirect rules

### 3. Consider adding catch-all redirects

If other locale-less paths could also 404, consider a page at `src/app/archive/page.tsx` that redirects:
```tsx
import { redirect } from 'next/navigation';
export default function ArchiveRedirect() {
  redirect('/en/archive');
}
```

Or better, fix the middleware to handle all locale-less paths consistently.

### 4. Test client-side navigation

After fixing links, verify:
- Clicking navigation items that go to archive/more works
- The `_rsc` flight requests return 200
- Direct URL access to `/archive` either works or redirects properly

## Acceptance Criteria

- [ ] `GET /archive` returns 200 (or 3xx redirect to locale-prefixed path)
- [ ] `GET /more` returns 200 (or 3xx redirect)
- [ ] All `_rsc` client-side navigation requests for these routes succeed
- [ ] No 404 errors for `/archive` or `/more` in browser console
- [ ] Links in the app use locale-aware paths
