# 65 — Fix Gaming Provider Chain Failures

## Goal

Fix the `AllProvidersFailedError` for the `gaming-data` provider chain that occurs during build and likely at runtime. All providers in the chain fail with `fetch failed`, meaning the gaming/NFT pages have no data source fallback.

## Context

- **Framework:** Next.js 16 with provider framework (`src/lib/providers/`)
- **Chain:** `gaming-data`
- **Pages affected:** `/nft`, `/api/gaming/top`, gaming-related components

### Build Log Errors

```
[Gaming/Top] Error: Dynamic server usage: Route /api/gaming/top couldn't be
rendered statically because it used `request.url`.

[Gaming/Chains] Error: AllProvidersFailedError: All providers failed for chain "gaming-data":
  playtoearn: fetch failed

[Gaming] Error: AllProvidersFailedError: All providers failed for chain "gaming-data":
  playtoearn: fetch failed
```

### Also Related: Reservoir API Failures

```
Reservoir API request failed: TypeError: fetch failed
```
(Appears 15+ times in the build log — the Reservoir/NFT floor price API is unreachable at build time)

## Task

### Step 1: Diagnose Provider Failures

Check the gaming-data adapter configuration:
- `src/lib/providers/adapters/gaming-data/` — what providers are configured?
- Is `playtoearn` the only adapter, or are there fallbacks?
- Is the PlayToEarn API endpoint still active and reachable?

### Step 2: Add Fallback Providers

If `playtoearn` is the only provider, add at least one alternative:
- CoinGecko gaming category API
- DappRadar API
- CryptoSlam API
- Static fallback data for build time

### Step 3: Fix Dynamic Server Error

The `/api/gaming/top` route uses `request.url` which prevents static generation. Either:
- Add `export const dynamic = 'force-dynamic'` to the route
- Refactor to avoid reading `request.url` directly (use searchParams instead)

### Step 4: Handle Build-Time Gracefully

Providers that depend on external APIs will fail at build time on Vercel. Add graceful fallbacks:
- Return empty data with a flag indicating stale/unavailable
- Use ISR (Incremental Static Regeneration) instead of SSG for these pages
- Cache last-known-good data in Redis

### Step 5: Fix Reservoir API Failures

Check if the Reservoir API (NFT floor prices) requires an API key or has changed endpoints. Update the adapter configuration.

## Files to Inspect

- `src/lib/providers/adapters/gaming-data/`
- `src/app/api/gaming/top/route.ts`
- `src/app/[locale]/nft/page.tsx`
- Search for `reservoir` in `src/` — Reservoir API adapter
- `src/lib/providers/registry.ts` — chain registration

## Acceptance Criteria

- [ ] Build completes without `AllProvidersFailedError` for gaming-data
- [ ] `/api/gaming/top` doesn't throw dynamic server error at build
- [ ] Gaming/NFT pages render with fallback data when APIs are unavailable
- [ ] Reservoir API calls either succeed or fail gracefully
- [ ] At least 2 providers configured for gaming-data chain
