# 59 — Fix CSP Inline Script Violations

## Goal

Eliminate the `Content-Security-Policy` violations that block inline scripts on every page load. The browser logs repeated errors:

```
Executing inline script violates the following Content Security Policy directive
'script-src 'self' 'nonce-...' 'unsafe-inline' https://www.googletagmanager.com
https://www.google-analytics.com https://s3.tradingview.com https://www.tradingview.com
https://*.vercel-scripts.com'. Note that 'unsafe-inline' is ignored if either a hash
or nonce value is present in the source list. The action has been blocked.
```

## Context

- **Framework:** Next.js 16 with App Router, deployed on Vercel
- **CSP implementation:** Nonce-based, per-request, built in `src/middleware/security.ts` via `buildCspHeader(nonce)`
- **Nonce generation:** `crypto.randomUUID()` in `src/middleware/intl.ts`, exposed via `x-middleware-request-x-nonce` header
- **Root cause:** When a CSP `script-src` directive includes both a nonce (`'nonce-xxx'`) AND `'unsafe-inline'`, browsers **ignore** `'unsafe-inline'` per the CSP spec. Any `<script>` tag without the correct `nonce` attribute is blocked.
- **Affected scripts:** Third-party inline snippets (Google Analytics/GTM, TradingView widgets, potentially Vercel Analytics/Speed Insights init) that don't carry the per-request nonce

## Files to Investigate

| File | Role |
|------|------|
| `src/middleware/security.ts` | `buildCspHeader()` — constructs the CSP string |
| `src/middleware/intl.ts` | Generates nonce, applies CSP header to responses |
| `src/app/[locale]/layout.tsx` | Root layout — imports `<Analytics>` and `<SpeedInsights>` |
| `next.config.js` | Static headers config (comment says not to add CSP here) |

## Task

### 1. Audit all inline `<script>` tags

Search the codebase for any `<script>` tags rendered without the `nonce` attribute:
- Components that inject GTM/GA snippets
- TradingView widget embeds
- Any `dangerouslySetInnerHTML` script blocks
- JSON-LD structured data scripts (these need `nonce` too, or use `type="application/ld+json"` which doesn't require it)

### 2. Propagate the nonce to all script tags

Next.js 16 exposes the nonce through the middleware → layout chain. Ensure:
- The root layout reads the nonce from headers and passes it to `<script nonce={nonce}>` tags
- Third-party component wrappers (Analytics, SpeedInsights, GTM) receive the nonce prop
- Any custom `<Script>` (from `next/script`) components use `nonce={nonce}`

### 3. Consider removing `'unsafe-inline'` from script-src

Since a nonce is already in use, `'unsafe-inline'` is ignored anyway. Removing it makes the policy cleaner and accurately reflects browser behavior. Keep `'unsafe-inline'` only in `style-src` where it's commonly needed.

### 4. Verify fix

After changes, load any page in Chrome DevTools Console and confirm:
- No CSP violation errors in the console
- Google Analytics/GTM still loads and fires events
- TradingView widgets still render
- Vercel Analytics & Speed Insights still report

## Acceptance Criteria

- [ ] Zero CSP `script-src` violations in browser console on page load
- [ ] All third-party scripts (GA, GTM, TradingView) load correctly
- [ ] Nonce is correctly propagated to all inline `<script>` tags
- [ ] `'unsafe-inline'` removed from `script-src` (optional cleanup)
- [ ] No regressions in middleware behavior
