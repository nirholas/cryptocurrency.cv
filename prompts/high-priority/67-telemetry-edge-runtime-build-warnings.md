# 67 — Fix Telemetry Edge Runtime Incompatibility (Build Warnings)

## Goal

Fix the two Turbopack build warnings caused by `process.on()` usage in `src/lib/telemetry.ts`:

```
./src/lib/telemetry.ts:247:5 — Ecmascript file had an error
A Node.js API is used (process.on at line: 247) which is not supported in the Edge Runtime.

./src/lib/telemetry.ts:248:5 — Ecmascript file had an error
A Node.js API is used (process.on at line: 248) which is not supported in the Edge Runtime.
```

These warnings affect **6 import chains** including Edge routes, Server Components, and instrumentation.

## Context

- **Framework:** Next.js 16.1.6 with Turbopack
- **File:** `src/lib/telemetry.ts` (lines 245-251)
- **Code:**
  ```typescript
  await sdk.shutdown();
  };
  process.on('SIGTERM', shutdown);  // ← line 247
  process.on('SIGINT', shutdown);   // ← line 248
  } catch (err) {
    // OTel packages not installed — degrade gracefully
    console.debug('[OTel] SDK not available...:', (err as Error).message);
  ```
- **Import chains affected:**
  1. `telemetry.ts` → `src/app/api/admin/backup-status/route.ts` (App Route)
  2. `telemetry.ts` → `instrumentation.ts` (Edge Instrumentation)
  3. `telemetry.ts` → `instrumentation.ts` (Node Instrumentation)
  4. `telemetry.ts` → `groq.ts` → `src/app/api/rag/stream/route.ts` (App Route)
  5. `telemetry.ts` → `groq.ts` → `src/app/api/ai/correlation/route.ts` (Edge App Route)
  6. `telemetry.ts` → `provider-chain.ts` → `gaming-data/index.ts` → `nft/page.tsx` (Server Component)

## Task

### 1. Guard process.on behind runtime check

```typescript
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
```

### 2. Guard instrumentation.ts for Node-only OTel init

In `instrumentation.ts`, ensure the OTel SDK only initializes in Node.js runtime:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTelemetry } = await import('./src/lib/telemetry');
    await initTelemetry();
  }
}
```

### 3. Consider splitting telemetry into edge-safe and node-only modules

If the telemetry module exports both edge-safe utilities (spans, metrics) and node-only setup (SDK init, signal handlers), split them:
- `src/lib/telemetry/index.ts` — edge-safe exports (span helpers, no-op stubs)
- `src/lib/telemetry/node.ts` — SDK init, process signal handlers (Node-only)

### 4. Verify build

```bash
bun run build
```
Confirm:
- Zero Turbopack warnings about Edge Runtime incompatibility
- OTel still initializes correctly in Node.js serverless functions
- Edge routes compile without errors

## Acceptance Criteria

- [ ] Zero Turbopack build warnings about `process.on` in Edge Runtime
- [ ] OTel SDK still initializes correctly for Node.js routes
- [ ] Edge routes and Edge Instrumentation compile cleanly
- [ ] No runtime errors from telemetry in Edge or Node contexts
