# 62 — Fix OTel Edge Runtime Warnings (process.on Not Supported)

## Goal

Eliminate the two Turbopack build warnings caused by `process.on('SIGTERM')` and `process.on('SIGINT')` in `src/lib/telemetry.ts`, which are not supported in the Edge Runtime.

## Context

- **Framework:** Next.js 16 with Turbopack
- **Deployment:** Vercel (Edge Runtime for some routes)
- **Warning count:** 2 warnings on every build

### Build Warnings

```
./src/lib/telemetry.ts:247:5
A Node.js API is used (process.on at line: 247) which is not supported in the Edge Runtime.

./src/lib/telemetry.ts:248:5
A Node.js API is used (process.on at line: 248) which is not supported in the Edge Runtime.
```

### Import Traces Affected

The telemetry module is imported by 6+ routes including Edge routes:

1. `src/app/api/admin/backup-status/route.ts` (App Route)
2. `instrumentation.ts` (Edge Instrumentation + Instrumentation)
3. `src/app/api/rag/stream/route.ts` → via `src/lib/groq.ts` (App Route)
4. `src/app/api/ai/correlation/route.ts` → via `src/lib/groq.ts` (Edge App Route)
5. `src/app/[locale]/nft/page.tsx` → via `src/lib/providers/provider-chain.ts` (Server Component)

### Current Code (src/lib/telemetry.ts lines 242-251)

```typescript
// Graceful shutdown (guarded for Edge Runtime compatibility)
if (typeof process.on === 'function') {
  const shutdown = async () => {
    await sdk.shutdown();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
```

The runtime guard (`typeof process.on === 'function'`) correctly prevents execution in Edge Runtime, but Turbopack's static analysis still flags the `process.on` calls as warnings because they exist in the code path.

## Task

### Option A: Conditional Import with `typeof` Guard (Recommended)

Move the `process.on` calls behind a dynamic check that Turbopack can statically analyze:

```typescript
// Only register shutdown hooks in Node.js runtime (not Edge)
if (typeof globalThis.process !== 'undefined' && typeof globalThis.process.on === 'function') {
  const shutdown = async () => {
    await sdk.shutdown();
  };
  // Use globalThis.process to avoid static analysis trigger
  globalThis.process.on('SIGTERM', shutdown);
  globalThis.process.on('SIGINT', shutdown);
}
```

### Option B: Extract to Separate Node-Only Module

Create `src/lib/telemetry-shutdown.ts` that is only imported in Node.js contexts (instrumentation.ts), keeping the Edge-compatible telemetry module clean:

```typescript
// src/lib/telemetry-shutdown.ts
import { getNodeSDK } from './telemetry';

export function registerShutdownHooks() {
  const sdk = getNodeSDK();
  if (!sdk) return;
  const shutdown = async () => { await sdk.shutdown(); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
```

Then call `registerShutdownHooks()` only from `instrumentation.ts` (which runs in Node.js context).

### Option C: Use `next/server` Edge Detection

```typescript
// Suppress warning by checking runtime before referencing process.on
const isEdge = typeof EdgeRuntime !== 'undefined';
if (!isEdge && typeof process?.on === 'function') {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
```

## Files to Modify

- `src/lib/telemetry.ts` — primary fix location
- `instrumentation.ts` — may need to import shutdown separately (Option B)

## Acceptance Criteria

- [ ] `bun run build` produces 0 Turbopack warnings about `process.on`
- [ ] OTel graceful shutdown still works in Node.js runtime (Cloud Run, Docker)
- [ ] Edge routes (`src/app/api/ai/correlation/route.ts`) build without errors
- [ ] No functional regression in telemetry instrumentation
