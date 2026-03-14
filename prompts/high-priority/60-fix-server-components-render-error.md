# 60 — Investigate and Fix Server Components Render Error

## Goal

Diagnose and fix the production Server Components render error that produces a deeply recursive call stack in the browser console. The error message is redacted in production builds, but the stack trace shows a tight `i2`/`ui` alternating loop (~60+ frames deep), indicating either a rendering error cascading through the React fiber tree or possibly a component throwing during hydration.

## Context

- **Framework:** Next.js 16 with App Router + Turbopack (production build)
- **Deployment:** Vercel
- **Error:** `Error: An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.`

### Error from Production Console

```
d5a3c4adc7092502.js:1 Error: An error occurred in the Server Components render.
The specific message is omitted in production builds to avoid leaking sensitive details.
A digest property is included on this error instance which may provide additional
details about the nature of the error.
    d @ d5a3c4adc7092502.js:1
    oI @ d5a3c4adc7092502.js:1
    e.callback @ d5a3c4adc7092502.js:1
    lG @ d5a3c4adc7092502.js:1
    lY @ d5a3c4adc7092502.js:1
    iv @ d5a3c4adc7092502.js:1
    i2 @ d5a3c4adc7092502.js:1
    ui @ d5a3c4adc7092502.js:1
    ... (repeats i2/ui ~60 times)
    sb @ d5a3c4adc7092502.js:1
    sh @ d5a3c4adc7092502.js:1
    u7 @ d5a3c4adc7092502.js:1
    u9 @ d5a3c4adc7092502.js:1
    sV @ d5a3c4adc7092502.js:1
    O @ d5a3c4adc7092502.js:1
```

### What the `i2`/`ui` Loop Means

In Next.js production bundles, `i2` and `ui` are minified names for React fiber tree traversal functions (likely `completeWork`/`performUnitOfWork`). The deep recursion means the error is **bubbling up through the entire component tree** as React unwinds. This is normal React error boundary behavior — the actual root cause is in the server-rendered RSC payload.

## Task

### Step 1: Reproduce in Development Mode

1. Run the dev server: `bun run dev`
2. Navigate to the page that shows the error (likely the homepage or a coin page like `/coin/ripple`)
3. In development mode, Next.js will show the **actual error message** instead of the redacted production one
4. Check the terminal output for server-side errors

### Step 2: Check the RSC Payload

1. In production, the error `digest` property contains a hash that correlates to server logs
2. Check Vercel deployment logs for the corresponding error
3. Look for errors in routes that render Server Components:
   - `src/app/[locale]/page.tsx` — homepage
   - `src/app/[locale]/coin/[slug]/page.tsx` — coin pages
   - `src/app/[locale]/layout.tsx` — layout (wraps everything)

### Step 3: Common RSC Error Causes

Check for these patterns:

1. **Async component throwing** — an `async` Server Component that fails to fetch data:
   ```bash
   grep -rn 'async function\|async (' src/app/
   ```
2. **Missing error boundaries** — pages without `error.tsx` fallbacks:
   ```bash
   find src/app -name 'error.tsx' -o -name 'error.ts'
   ```
3. **Provider initialization failure** — one of the many providers in the layout chain failing:
   - The layout nests: NextIntlClientProvider → ThemeProvider → ToastProvider → SettingsProvider → KeyboardShortcutsProvider → WatchlistProvider → AlertsProvider → PortfolioProvider → BookmarksProvider → PWAProvider
4. **External API timeout** — server-side `fetch()` calls timing out during SSR
5. **Environment variable missing** — a required env var not set in the Vercel deployment

### Step 4: Add Error Boundaries

If missing, add `error.tsx` files at key route segments:

```
src/app/[locale]/error.tsx         # Catches all locale page errors
src/app/[locale]/coin/error.tsx    # Catches coin page errors
src/app/error.tsx                  # Root error boundary
```

Each should:
- Log the error with the `digest` property
- Show a user-friendly fallback UI
- Include a "Try Again" button that calls `reset()`

### Step 5: Fix the Root Cause

Once the actual error message is identified in dev mode or Vercel logs:
1. Fix the underlying issue (data fetch, env var, type error, etc.)
2. Add defensive error handling where appropriate
3. Ensure the fix works in both dev and production builds

## Files to Examine

- `src/app/[locale]/page.tsx` — homepage Server Component
- `src/app/[locale]/layout.tsx` — layout with provider chain
- `src/app/[locale]/coin/[slug]/page.tsx` — coin detail page
- `src/app/error.tsx` — root error boundary (if exists)
- `src/app/[locale]/error.tsx` — locale error boundary (if exists)
- Any async Server Components that fetch external data

## Acceptance Criteria

- [ ] Root cause of the Server Components render error identified
- [ ] Error fixed — no more `Error: An error occurred in the Server Components render` in console
- [ ] Error boundaries (`error.tsx`) exist at key route segments
- [ ] Error boundaries log the `digest` property for debugging
- [ ] Development mode shows no server-side errors for common navigation paths
