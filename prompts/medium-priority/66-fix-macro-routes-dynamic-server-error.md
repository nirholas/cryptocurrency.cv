# 66 — Fix Macro Routes Dynamic Server Error

## Goal

Fix the `Dynamic server usage` error for macro economy API routes (`/api/macro/dxy` and `/api/macro/indicators`) that fail build-time static generation because they read `request.url`.

## Context

- **Framework:** Next.js 16 with App Router
- **Routes affected:** `/api/macro/dxy`, `/api/macro/indicators`

### Build Log Errors

```
[Macro/DXY] Error: Dynamic server usage: Route /api/macro/dxy couldn't be
rendered statically because it used `request.url`.
See more info here: https://nextjs.org/docs/messages/dynamic-server-error

[Macro/Indicators] Error: Dynamic server usage: Route /api/macro/indicators
couldn't be rendered statically because it used `request.url`.
```

### Root Cause

Next.js tries to statically render API routes during build. Routes that access `request.url`, `request.headers`, or other dynamic values trigger this error. The fix is either:
1. Mark the route as dynamic (opt out of static generation)
2. Refactor to use the `searchParams` argument instead of parsing `request.url`

## Task

### Step 1: Add Dynamic Export

Add the dynamic route segment config to each affected route:

```typescript
// src/app/api/macro/dxy/route.ts
export const dynamic = 'force-dynamic';
```

### Step 2: Alternatively, Refactor URL Parsing

If the route reads query params from `request.url`, use Next.js's built-in `searchParams`:

```typescript
// Before:
const url = new URL(request.url);
const period = url.searchParams.get('period');

// After:
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // ... or use NextRequest type with nextUrl
}
```

### Step 3: Review All Macro Routes

Check if other macro routes have the same issue:
- `src/app/api/macro/` — list all routes
- Ensure consistent handling across all macro endpoints

## Files to Modify

- `src/app/api/macro/dxy/route.ts`
- `src/app/api/macro/indicators/route.ts`
- Any other routes under `src/app/api/macro/`

## Acceptance Criteria

- [ ] Build completes without "Dynamic server usage" errors for macro routes
- [ ] Macro API routes return correct data at runtime
- [ ] No regression in response format or query parameter handling
