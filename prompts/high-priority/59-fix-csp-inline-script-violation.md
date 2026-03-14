# 59 — Fix CSP Inline Script Violation

## Goal

Fix the Content Security Policy (CSP) configuration that blocks inline scripts in production. The browser console shows: `Executing inline script violates the following Content Security Policy directive 'script-src ...'`. The `'unsafe-inline'` fallback is silently ignored by modern browsers when a nonce is present, causing scripts without the correct nonce to be blocked.

## Context

- **Framework:** Next.js with App Router, deployed on Vercel
- **CSP location:** `src/middleware/security.ts` — `buildCspHeader(nonce)` function
- **CSP injection:** `src/middleware/intl.ts` — sets CSP header on non-API responses
- **Config note:** `next.config.js` line ~50 explicitly says CSP is dynamic/nonce-based

### How It Works Now

The middleware generates a per-request nonce and builds a CSP like:

```
script-src 'self' 'nonce-<RANDOM>' 'unsafe-inline' https://www.googletagmanager.com ...
```

Per the CSP spec, when a nonce or hash is present, `'unsafe-inline'` is **ignored** by modern browsers. This is correct security behavior — but it means **any inline script that doesn't carry the nonce attribute will be blocked**.

### Error from Production Console

```
Executing inline script violates the following Content Security Policy directive
'script-src 'self' 'nonce-NGQwOWFjMmEtYjUzMi00NGUxLThhYzgtZmU2MjU5OTYxOGZl'
'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com
https://s3.tradingview.com https://www.tradingview.com https://*.vercel-scripts.com'.
Note that 'unsafe-inline' is ignored if either a hash or nonce value is present
in the source list.
```

## Root Cause

One or more inline `<script>` tags are rendered without the nonce attribute. Possible sources:

1. **Next.js framework scripts** — Turbopack/webpack may inject inline scripts that don't receive the nonce
2. **Third-party scripts** — Google Analytics, TradingView widget embed code may inject inline scripts
3. **Custom inline scripts** — Any `<script dangerouslySetInnerHTML>` in the app without `nonce`
4. **Vercel Analytics / Speed Insights** — May inject inline scripts

## Task

### Step 1: Identify Which Inline Scripts Are Blocked

1. **Run the dev server** and check the browser console for CSP violations
2. **Search the codebase** for inline script patterns:
   ```bash
   grep -rn 'dangerouslySetInnerHTML' src/
   grep -rn '<script' src/
   grep -rn '<Script' src/  # next/script
   ```
3. **Check third-party script loading** — look for `next/script` usage with `strategy="afterInteractive"` or `strategy="lazyOnload"` that may inject inline code

### Step 2: Propagate Nonce to All Inline Scripts

1. **Read** `src/middleware/intl.ts` to see how the nonce is currently set on responses
2. **Verify** the nonce is available in the root layout via `headers()` and passed to all `<Script>` components
3. **For each inline script found:**
   - If using `next/script` — add `nonce={nonce}` prop
   - If using raw `<script>` — add `nonce={nonce}` attribute
   - If it's a third-party embed (TradingView) — check if the embed API supports nonce, or load via external src instead

### Step 3: Verify Google Analytics / GTM

1. **Check** if `@next/third-parties` or a custom GA component is used
2. **Ensure** the GA/GTM script tag includes the nonce
3. If using Google Tag Manager's inline `dataLayer.push()` calls, those need nonces too

### Step 4: Test

1. Build and run in production mode: `bun run build && bun run start`
2. Open browser DevTools → Console — verify **zero** CSP violation warnings
3. Verify GA/Analytics still fires events
4. Verify TradingView widgets still render
5. Verify Vercel Analytics still collects data

## Files to Examine

- `src/middleware/security.ts` — CSP builder (lines 63–89)
- `src/middleware/intl.ts` — where nonce is injected into response headers
- `src/app/[locale]/layout.tsx` — root layout, check if nonce is read from headers
- `src/app/layout.tsx` — root-root layout
- `src/components/Analytics.tsx` or similar — GA/analytics script loading
- `next.config.js` — security headers section
- Any component using `<Script>` from `next/script`

## Acceptance Criteria

- [ ] Zero CSP violation warnings in browser console on production build
- [ ] All third-party scripts (GA, TradingView, Vercel Analytics) still function
- [ ] Nonce correctly propagated to all inline `<script>` elements
- [ ] `'unsafe-inline'` fallback comment preserved for older browser compat
- [ ] No regression in page load or functionality
