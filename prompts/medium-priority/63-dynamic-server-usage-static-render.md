# 63 — Fix Dynamic Server Usage Errors in Gaming and Macro Routes

## Goal

Fix the three API routes that fail static generation because they use `request.url`, and either make them properly dynamic or convert them to static-compatible patterns.

## Context

- **Framework:** Next.js 16 with Turbopack
- **Deployment:** Vercel (ISR/static generation during build)

### Build Errors

```
[Gaming/Top] Error: Dynamic server usage: Route /api/gaming/top couldn't be rendered
statically because it used `request.url`.

[Macro/DXY] Error: Dynamic server usage: Route /api/macro/dxy couldn't be rendered
statically because it used `request.url`.

[Macro/Indicators] Error: Dynamic server usage: Route /api/macro/indicators couldn't
be rendered statically because it used `request.url`.
```

These routes access `request.url` (likely to parse query parameters) which forces them into dynamic rendering, but they haven't been explicitly marked as dynamic.

## Affected Routes

| Route | File | Provider |
|-------|------|----------|
| `/api/gaming/top` | `src/app/api/gaming/top/route.ts` | `gamingDataChain` |
| `/api/macro/dxy` | `src/app/api/macro/dxy/route.ts` | `macroChain` |
| `/api/macro/indicators` | `src/app/api/macro/indicators/route.ts` | `macroChain` |

## Task

### Option A: Add `export const dynamic = 'force-dynamic'`

If these routes genuinely need query parameters at request time:

```typescript
export const dynamic = 'force-dynamic';
```

This suppresses the error by telling Next.js these routes are intentionally dynamic.

### Option B: Use `NextRequest` Properly (Preferred for ISR)

If the routes only use query params for optional filtering, refactor to use `searchParams` from the route handler's `request` parameter without accessing `request.url` directly:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl; // This is fine for dynamic routes
  const limit = searchParams.get('limit') ?? '20';
  // ...
}
```

And add ISR revalidation:

```typescript
export const revalidate = 300; // 5 minutes
```

### Option C: Move Optional Params to Route Segments

If possible, convert query params to route segments that support static generation:

```
/api/gaming/top       → static, returns default result
/api/macro/dxy        → static, returns latest DXY data
/api/macro/indicators → static, returns all indicators
```

## Files to Modify

- `src/app/api/gaming/top/route.ts`
- `src/app/api/macro/dxy/route.ts`
- `src/app/api/macro/indicators/route.ts`

## Acceptance Criteria

- [ ] Build completes without "Dynamic server usage" errors for these three routes
- [ ] Routes still return correct data with query parameters
- [ ] ISR caching works if applicable (check `revalidate` config)
- [ ] No functional regression in gaming or macro data APIs
