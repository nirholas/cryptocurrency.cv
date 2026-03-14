# 67 — Fix CSP frame-src Violation for Widgets

## Goal

Fix the Content Security Policy `frame-src` violation that blocks the widget builder preview from loading `https://cryptocurrency.cv/` in an iframe. The widgets page generates embed code pointing to cryptocurrency.cv, but the CSP doesn't allow framing that domain.

## Context

- **Framework:** Next.js 16 with nonce-based CSP
- **CSP location:** `src/middleware/security.ts` — `buildCspHeader(nonce)` function
- **Widgets page:** `src/app/[locale]/widgets/page.tsx`
- **Widget builder:** `src/components/WidgetBuilder.tsx`
- **Production domain:** `cryptocurrency.cv`

### Current CSP frame-src Directive

```
frame-src 'self' https://www.youtube.com https://player.vimeo.com https://s.tradingview.com https://www.tradingview.com
```

### Error from Production Console

```
widgets:1 Framing 'https://cryptocurrency.cv/' violates the following Content Security Policy
directive: "frame-src 'self' https://www.youtube.com https://player.vimeo.com
https://s.tradingview.com https://www.tradingview.com". The request has been blocked.
```

### Root Cause

The widget builder UI creates an iframe preview of the embed. The iframe `src` points to `https://cryptocurrency.cv/embed/{type}` — which is the production domain. But `cryptocurrency.cv` is not listed in the `frame-src` CSP directive, so the browser blocks the iframe.

`'self'` only matches the exact origin of the page. If the widget builder runs on a preview deployment URL (e.g., `free-crypto-news-xxx.vercel.app`), then `'self'` won't match `cryptocurrency.cv`.

## Task

### Step 1: Add Production Domain to frame-src

Update `src/middleware/security.ts` to include the production domain:

```typescript
// In buildCspHeader():
`frame-src 'self' https://cryptocurrency.cv https://www.youtube.com https://player.vimeo.com https://s.tradingview.com https://www.tradingview.com`
```

### Step 2: Consider Dynamic Self-Framing

If the widget builder should preview embeds from the current deployment (not just production), consider using the request host dynamically:

```typescript
const host = request.headers.get('host') || 'cryptocurrency.cv';
`frame-src 'self' https://${host} https://cryptocurrency.cv ...`
```

### Step 3: Alternatively, Use Relative URLs for Preview

Instead of framing `https://cryptocurrency.cv/embed/...`, the widget builder preview could use a relative `/embed/...` URL, which would match `'self'`.

Check `src/components/WidgetBuilder.tsx` for the iframe src generation logic.

## Files to Modify

- `src/middleware/security.ts` — add `https://cryptocurrency.cv` to `frame-src`
- `src/components/WidgetBuilder.tsx` — optionally use relative preview URLs

## Acceptance Criteria

- [ ] Widget builder preview iframe loads without CSP errors
- [ ] Embed previews work on both production and preview deployments
- [ ] No overly permissive CSP changes (don't add `*` or `'unsafe-inline'`)
- [ ] YouTube, Vimeo, and TradingView iframes still work
