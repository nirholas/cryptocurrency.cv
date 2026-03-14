# 65 — Fix Gaming-Data Provider Chain AllProvidersFailedError

## Goal

Fix the `AllProvidersFailedError` for the "gaming-data" provider chain, which means all configured gaming data adapters (DappRadar, PlayToEarn, Footprint) are failing during builds.

## Context

- **Provider chain:** `gaming-data` (fallback strategy)
- **Adapters:** DappRadar (60% weight) → PlayToEarn (40%) → Footprint
- **Location:** `src/lib/providers/adapters/gaming-data/`

### Build Errors

```
[Gaming/Top] Error: Error: Dynamic server usage: Route /api/gaming/top couldn't be
rendered statically because it used `request.url`.

[Gaming/Chains] Error: Error [AllProvidersFailedError]: All providers failed for
chain "gaming-data":
  providerErrors: [Array]

[Gaming] Error: Error [AllProvidersFailedError]: All providers failed for chain
"gaming-data":
  providerErrors: [Array]
```

The `AllProvidersFailedError` indicates every adapter in the fallback chain returned an error.

## Task

### Step 1: Diagnose Individual Adapter Failures

Check each adapter's external API:

1. **DappRadar** (`dappradar.adapter.ts`):
   - Verify API endpoint is reachable
   - Check if API key is required and configured
   - Test: `curl -s https://api.dappradar.com/` (or whatever endpoint is used)

2. **PlayToEarn** (`playtoearn.adapter.ts`):
   - Verify API endpoint
   - Check for rate limiting or auth requirements

3. **Footprint** (`footprint.adapter.ts`):
   - Verify API endpoint
   - Check if service is still operational

### Step 2: Fix Failing Adapters

For each adapter:
- Update API URLs if they changed
- Add/fix API key configuration
- Handle rate limiting gracefully
- Add timeout handling

### Step 3: Add Fallback Data

When all providers fail, return cached/static fallback data instead of propagating the error:

```typescript
// In the gaming route handler
try {
  const data = await gamingDataChain.fetch(params);
  return NextResponse.json(data);
} catch (error) {
  if (error instanceof AllProvidersFailedError) {
    console.warn('[Gaming] All providers failed, returning fallback data');
    return NextResponse.json(getFallbackGamingData(), {
      headers: { 'X-Data-Source': 'fallback' }
    });
  }
  throw error;
}
```

### Step 4: Improve Error Visibility

The `providerErrors: [Array]` in logs isn't helpful. Ensure each adapter's error is logged with detail:

```typescript
console.error(`[Gaming/${adapterName}] Failed:`, error.message);
```

## Files to Modify

- `src/lib/providers/adapters/gaming-data/dappradar.adapter.ts`
- `src/lib/providers/adapters/gaming-data/playtoearn.adapter.ts`
- `src/lib/providers/adapters/gaming-data/footprint.adapter.ts`
- `src/lib/providers/adapters/gaming-data/index.ts`
- `src/app/api/gaming/top/route.ts`
- Any other gaming API routes

## Acceptance Criteria

- [ ] At least one gaming-data adapter works during builds
- [ ] `AllProvidersFailedError` no longer appears in build logs
- [ ] Gaming routes gracefully degrade when all providers fail
- [ ] Individual adapter errors are logged with full details
- [ ] Gaming pages render (with real or fallback data)
