# 66 — Fix Macro-Data Provider Chain AllProvidersFailedError

## Goal

Fix the `AllProvidersFailedError` for the "macro-data" provider chain, where all macro economic data adapters (FRED, Alpha Vantage, Yahoo Finance) fail during builds.

## Context

- **Provider chains affected:**
  - `macro-data` chain (fallback: FRED → Alpha Vantage → Yahoo Finance) in `src/lib/providers/adapters/macro-data/`
  - `macro` chain (broadcast: FRED + Alpha Vantage + Twelve Data) in `src/lib/providers/adapters/macro/`
- **Routes affected:** `/api/macro/dxy`, `/api/macro/fed`, `/api/macro/indicators`, `/api/macro/risk-appetite`

### Build Errors

```
[Macro] Fetch error: Error [AllProvidersFailedError]: All providers failed for
chain "macro-data":
  *: All providers failed during broadcast
  chainName: 'macro-data',
  providerErrors: [Array]

[Macro/Fed] Error: Error [AllProvidersFailedError]: All providers failed for
chain "macro-data"

[Macro/DXY] Error: Error: Dynamic server usage: Route /api/macro/dxy couldn't be
rendered statically because it used `request.url`.

[Macro/Indicators] Error: Error: Dynamic server usage: Route /api/macro/indicators
couldn't be rendered statically because it used `request.url`.

[Risk Appetite] Error: Error [AllProvidersFailedError]: All providers failed for
chain "macro-data"
```

## Task

### Step 1: Diagnose Individual Adapter Failures

1. **FRED adapter** (`fred.adapter.ts`):
   - Requires API key from `https://fred.stlouisfed.org/docs/api/api_key.html`
   - Check env var: `FRED_API_KEY`
   - Test: `curl "https://api.stlouisfed.org/fred/series/observations?series_id=DTWEXBGS&api_key=$FRED_API_KEY&file_type=json"`

2. **Alpha Vantage adapter** (`alpha-vantage.adapter.ts`):
   - Requires API key from `https://www.alphavantage.co/support/#api-key`
   - Check env var: `ALPHA_VANTAGE_API_KEY`
   - Free tier: 25 requests/day — may be exhausted during build

3. **Yahoo Finance adapter** (`yahoo-finance.adapter.ts`):
   - May use unofficial API that gets blocked
   - Check if endpoint is still accessible

4. **Twelve Data adapter** (`twelve-data.adapter.ts`):
   - Requires API key from `https://twelvedata.com/`
   - Check env var: `TWELVE_DATA_API_KEY`

### Step 2: Verify API Keys in Vercel Environment

Ensure all required API keys are set in Vercel's environment variables:
- `FRED_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `TWELVE_DATA_API_KEY`

### Step 3: Add Rate Limit Awareness

Alpha Vantage's free tier (25 req/day) and FRED's limits can easily be exhausted during a build with many static pages. Consider:
- Caching API responses between build runs
- Using `unstable_cache` or `fetch` cache to avoid redundant calls
- Setting longer `revalidate` periods

### Step 4: Add Graceful Fallback

```typescript
try {
  const data = await macroChain.fetch(params);
  return NextResponse.json(data);
} catch (error) {
  if (error instanceof AllProvidersFailedError) {
    console.warn('[Macro] All providers failed, returning fallback data');
    return NextResponse.json(getStaticMacroFallback(), {
      headers: { 'X-Data-Source': 'fallback', 'Cache-Control': 'public, max-age=3600' }
    });
  }
  throw error;
}
```

## Files to Modify

- `src/lib/providers/adapters/macro-data/fred.adapter.ts`
- `src/lib/providers/adapters/macro-data/alpha-vantage.adapter.ts`
- `src/lib/providers/adapters/macro-data/yahoo-finance.adapter.ts`
- `src/lib/providers/adapters/macro/fred.adapter.ts`
- `src/lib/providers/adapters/macro/alpha-vantage.adapter.ts`
- `src/lib/providers/adapters/macro/twelve-data.adapter.ts`
- `src/app/api/macro/dxy/route.ts`
- `src/app/api/macro/indicators/route.ts`
- `src/app/api/macro/fed/route.ts`

## Acceptance Criteria

- [ ] At least one macro-data adapter works during builds
- [ ] Required API keys documented and verified in Vercel env
- [ ] `AllProvidersFailedError` no longer appears in build logs for macro-data
- [ ] Macro routes gracefully degrade with fallback data
- [ ] Rate limiting handled properly (especially Alpha Vantage free tier)
