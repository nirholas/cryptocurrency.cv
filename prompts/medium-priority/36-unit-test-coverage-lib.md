# 36 — Increase Unit Test Coverage for src/lib/

## Goal

Add comprehensive unit tests for the critical utility modules in `src/lib/`. The project currently has only 6 test files in `src/__tests__/` covering API, middleware, security, validation, i18n, and critical-fixes. The vast majority of the 100+ library modules in `src/lib/` have zero unit test coverage.

## Context

- **Test framework:** Vitest 4.x with jsdom environment
- **Setup file:** `vitest.setup.ts` (mocks next/navigation, next-intl, IntersectionObserver)
- **Config:** `vitest.config.ts` — includes `src/**/*.test.{ts,tsx}` and `src/**/*.spec.{ts,tsx}`
- **Path alias:** `@` → `./src`
- **Current thresholds:** 20% lines, 15% branches/functions (very low)
- **Run tests:** `bun run test:run` (single run) or `bun run test` (watch mode)
- **Coverage:** `bun run test:coverage`

## Existing Test Patterns

Tests live in `src/__tests__/` and follow this pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
// Import from src/lib/* using @ alias
import { functionUnderTest } from "@/lib/module-name";

describe("ModuleName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do expected behavior", () => {
    const result = functionUnderTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

External dependencies (fetch, Redis, database) are mocked with `vi.fn()` and `vi.mock()`.

## Task — Create Unit Tests for These Priority Modules

Create test files in `src/__tests__/` for each module below. Each test file should cover happy paths, edge cases, and error handling. Mock all external dependencies (fetch, Redis, DB, env vars).

### Batch 1 — Core Utilities (highest priority)

1. **`src/lib/cache/`** — Test cache get/set/invalidation, TTL behavior, key generation, LRU eviction logic. Mock Redis client.

2. **`src/lib/api-utils.ts`** — Test request parsing, response formatting, pagination helpers, query parameter extraction, error response generation.

3. **`src/lib/api-error.ts`** — Test error class instantiation, HTTP status code mapping, serialization, error chaining.

4. **`src/lib/ratelimit.ts`** and **`src/lib/distributed-rate-limit.ts`** — Test rate limit logic: token bucket/sliding window, key generation per IP/API key, limit exceeded detection, header generation (X-RateLimit-\*).

5. **`src/lib/resilient-fetch.ts`** — Test retry logic, timeout handling, circuit breaker integration, fallback behavior. Mock fetch.

6. **`src/lib/circuit-breaker.ts`** — Test state transitions (closed → open → half-open → closed), failure threshold, recovery timeout, success reset.

7. **`src/lib/sanitize.ts`** and **`src/lib/sanitize-dom.ts`** — Test XSS sanitization, HTML stripping, null byte removal, script tag injection, attribute injection.

### Batch 2 — Data Processing

8. **`src/lib/format.ts`** — Test date formatting, number formatting, relative time, currency formatting, truncation.

9. **`src/lib/dedupe.ts`** — Test article deduplication logic: title similarity, URL matching, content fingerprinting.

10. **`src/lib/tags.ts`** and **`src/lib/categories.ts`** — Test tag extraction, categorization rules, scoring.

11. **`src/lib/reading-time.ts`** — Test word count calculation, reading time estimation for various content lengths.

12. **`src/lib/source-tiers.ts`** and **`src/lib/source-credibility.ts`** — Test source ranking, credibility scoring, tier classification.

### Batch 3 — Security & Auth

13. **`src/lib/api-keys.ts`** — Test key validation, prefix detection (cda*ent*, cda*pro*, cda\_), key generation, expiration checks. Mock Redis.

14. **`src/lib/auth/`** — Test authentication flows, token validation, admin auth constant-time comparison.

15. **`src/lib/x402/`** — Test payment verification, USDC amount calculation, tier gating logic. Mock blockchain calls.

## Requirements

- Each test file should have at least 10 test cases
- Mock ALL external I/O (Redis, fetch, database, env vars)
- Test error paths and edge cases, not just happy paths
- Use descriptive test names: `it('should return 429 when rate limit exceeded')`
- Group related tests with nested `describe()` blocks
- Do NOT modify any source files — only create test files
- Run `bun run test:run` after creating tests to verify they pass
- Run `bun run test:coverage` to check the new coverage numbers

## Success Criteria

- All new tests pass with `bun run test:run`
- Coverage increases meaningfully (target: 35%+ lines, 25%+ branches)
- No flaky tests — all deterministic with proper mocking
