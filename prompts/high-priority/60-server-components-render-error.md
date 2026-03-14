# 60 — Fix Server Components Render Error

## Goal

Diagnose and fix the Server Components error that appears on page load:

```
Error: An error occurred in the Server Components render. The specific message is
omitted in production builds to avoid leaking sensitive details. A digest property
is included on this error instance which may provide additional details about the
nature of the error.
```

This triggers a cascade of React error recovery calls (`oI`, `lG`, `lY`, `iv`, `i2`, `ui` — repeated 50+ times in the stack trace), degrading performance and potentially showing broken UI to users.

## Context

- **Framework:** Next.js 16 with App Router + Turbopack
- **Deployment:** Vercel (production build)
- **Symptom:** The error fires on the homepage (`/`) and possibly other pages, triggering React's error boundary re-render loop
- **Build warnings:** Turbopack reports `process.on` usage in `src/lib/telemetry.ts` (lines 247-248) which is incompatible with Edge Runtime — this may be the cause since telemetry is imported by multiple routes and the Edge Instrumentation entrypoint

## Files to Investigate

| File | Role |
|------|------|
| `src/lib/telemetry.ts` | Uses `process.on('SIGTERM')` and `process.on('SIGINT')` — flagged by Turbopack |
| `instrumentation.ts` | Imports telemetry — runs in both Node and Edge instrumentation |
| `src/app/[locale]/layout.tsx` | Root layout (Server Component) |
| `src/app/[locale]/page.tsx` | Homepage (Server Component) |
| `src/lib/providers/provider-chain.ts` | Provider framework imported by many Server Components |

## Task

### 1. Guard `process.on` calls behind runtime check

In `src/lib/telemetry.ts`, the `process.on('SIGTERM', shutdown)` and `process.on('SIGINT', shutdown)` calls crash in Edge Runtime. Wrap them:

```typescript
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
```

### 2. Check instrumentation.ts edge compatibility

`instrumentation.ts` is loaded in both Node.js and Edge contexts. Ensure it only initializes OTel SDK in Node:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize OTel SDK
  }
}
```

### 3. Reproduce locally to get the full error

Run a production build locally to see the unredacted error:
```bash
bun run build && bun run start
```
Check server logs for the actual error message (production builds only redact in the client).

### 4. Check Server Component data fetching

Review homepage and layout Server Components for:
- Unhandled promise rejections in data fetching
- Missing error boundaries around async operations
- Provider chain calls that may throw in edge contexts

## Acceptance Criteria

- [ ] No "Server Components render error" in browser console
- [ ] No repeated `i2`/`ui` call cascade in stack traces
- [ ] Turbopack build warnings about `process.on` in Edge Runtime resolved
- [ ] `instrumentation.ts` correctly guards Node-only code
- [ ] Pages render without error recovery loops
