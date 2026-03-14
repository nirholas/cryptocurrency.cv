# 63 — Fix Telemetry Edge Runtime Incompatibility

## Goal

Fix the build warning where `process.on('SIGTERM')` and `process.on('SIGINT')` in `src/lib/telemetry.ts` are flagged as unsupported in the Edge Runtime. These Node.js APIs cause Turbopack build warnings and may cause runtime errors when the telemetry module is imported by Edge-compatible routes.

## Context

- **Framework:** Next.js 16 with Turbopack
- **File:** `src/lib/telemetry.ts` lines 247-248
- **Import chain:** `telemetry.ts` → `instrumentation.ts` (Edge + Node), and imported by various API routes and server components

### Build Warnings

```
./src/lib/telemetry.ts:247:5
  247 |     process.on('SIGTERM', shutdown);
A Node.js API is used (process.on at line: 247) which is not supported in the Edge Runtime.

./src/lib/telemetry.ts:248:5
  248 |     process.on('SIGINT', shutdown);
A Node.js API is used (process.on at line: 248) which is not supported in the Edge Runtime.
```

### Import Traces (from build log)

1. `telemetry.ts` → `src/app/api/admin/backup-status/route.ts` (App Route)
2. `telemetry.ts` → `instrumentation.ts` (Edge Instrumentation)
3. `telemetry.ts` → `instrumentation.ts` (Node Instrumentation)
4. `telemetry.ts` → `groq.ts` → `src/app/api/rag/stream/route.ts` (App Route)
5. `telemetry.ts` → `groq.ts` → `src/app/api/ai/correlation/route.ts` (Edge App Route)
6. `telemetry.ts` → `provider-chain.ts` → NFT page (Server Component)

## Task

### Step 1: Guard with Runtime Check

Wrap the `process.on` calls with a runtime check so they're only executed in Node.js:

```typescript
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
```

### Step 2: Consider Splitting Telemetry

If the telemetry module has both Edge-compatible and Node-only parts, consider splitting into:
- `src/lib/telemetry-edge.ts` — lightweight, Edge-safe exports
- `src/lib/telemetry.ts` — full Node.js OTel SDK with signal handlers

### Step 3: Update instrumentation.ts

The `instrumentation.ts` file is loaded for both Edge and Node runtimes. Ensure it conditionally imports the right telemetry module:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTelemetry } = await import('./src/lib/telemetry');
    initTelemetry();
  }
}
```

## Files to Modify

- `src/lib/telemetry.ts` (lines 245-250)
- `instrumentation.ts`

## Acceptance Criteria

- [ ] Build completes without Edge Runtime warnings for `process.on`
- [ ] OTel graceful shutdown still works in Node.js runtime
- [ ] Edge routes that import telemetry don't error
- [ ] `bun run build` shows 0 Turbopack warnings for telemetry
