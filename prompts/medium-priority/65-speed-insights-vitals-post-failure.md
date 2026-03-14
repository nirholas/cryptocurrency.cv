# 65 — Fix Speed Insights Vitals POST Failure

## Goal

Fix the failed POST request to the Vercel Speed Insights endpoint:

```
Fetch failed loading: POST "https://.../\_vercel/speed-insights/vitals"
```

This means Core Web Vitals and performance metrics are not being reported to Vercel's dashboard.

## Context

- **Framework:** Next.js 16 on Vercel
- **Dependencies:** `@vercel/speed-insights@^1.3.1` and `@vercel/analytics@^1.6.1` in `package.json`
- **Integration:** `<SpeedInsights />` and `<Analytics />` components imported in `src/app/[locale]/layout.tsx`
- **CSP config:** `https://*.vercel-scripts.com` is allowed in `script-src` (via `src/middleware/security.ts`)
- **Possible causes:**
  1. **CSP blocks the POST** — `connect-src` may not allow the vitals endpoint. The Speed Insights script loads from `*.vercel-scripts.com` but POSTs to a different domain/path.
  2. **Nonce missing on the Speed Insights script** — If the `<SpeedInsights />` component injects an inline script without the CSP nonce, it gets blocked (related to issue #59).
  3. **Service worker intercepting the POST** — The custom service worker (`public/sw.js`) may be catching and failing the POST request.

## Files to Investigate

| File | Role |
|------|------|
| `src/middleware/security.ts` | CSP `connect-src` directive — must allow vitals endpoint |
| `src/app/[locale]/layout.tsx` | `<SpeedInsights />` and `<Analytics />` placement |
| `public/sw.js` | Service worker fetch handler — may need to passthrough `/_vercel/` requests |

## Task

### 1. Verify CSP `connect-src` allows the vitals endpoint

In `src/middleware/security.ts`, check the `connect-src` directive includes the Vercel insights endpoint:
```
connect-src 'self' https: wss: https://vitals.vercel-insights.com
```

The Speed Insights POST goes to `/_vercel/speed-insights/vitals` (same origin) or `https://vitals.vercel-insights.com`. Ensure `'self'` covers the same-origin path, or add the external domain explicitly.

### 2. Pass nonce to SpeedInsights component

If the `<SpeedInsights />` component supports a nonce prop, pass it:
```tsx
<SpeedInsights nonce={nonce} />
<Analytics nonce={nonce} />
```

### 3. Exclude `/_vercel/` from service worker

In `public/sw.js`, ensure the fetch handler doesn't intercept Vercel internal paths:
```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Skip Vercel internal endpoints
  if (url.pathname.startsWith('/_vercel/')) return;
  // ... rest of caching logic
});
```

### 4. Verify in production

After deploying, check:
- Vercel Dashboard → Analytics tab shows incoming vitals
- No POST failures in browser console
- Speed Insights script loads and executes without CSP blocks

## Acceptance Criteria

- [ ] POST to `/_vercel/speed-insights/vitals` succeeds (200/204)
- [ ] Core Web Vitals data visible in Vercel Analytics dashboard
- [ ] CSP `connect-src` correctly allows the vitals endpoint
- [ ] Service worker doesn't intercept `/_vercel/` requests
