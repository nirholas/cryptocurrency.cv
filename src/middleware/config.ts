/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Middleware Configuration Constants
 *
 * Centralised constants and route patterns for the Edge middleware.
 * Kept in a separate file to improve readability and testability.
 *
 * @module middleware/config
 */

// =============================================================================
// ROUTE PATTERNS
// =============================================================================

/** Routes that are free and publicly accessible without any key or payment. */
export const FREE_TIER_PATTERNS = [
  /^\/api\/sample$/, // /api/sample — 2 headlines + 2 prices, heavily stripped
];

/** Routes exempt from rate limiting and x402 payment. */
export const EXEMPT_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/\.well-known/,
  /^\/api\/cron/,
  /^\/api\/sse/,
  /^\/api\/ws/,
  /^\/api\/register$/, // API key registration — must be free
  /^\/api\/keys\//, // Key management (usage, rotate, upgrade) — auth via key itself
];

/** Endpoints that require pro or enterprise tier (AI, premium). */
export const AI_ENDPOINT_PATTERNS = [
  /^\/api\/premium\/ai\//,
  /^\/api\/v1\/ai\//,
  /^\/api\/premium\/whales\//,
  /^\/api\/premium\/smart-money/,
  /^\/api\/premium\/stream\//,
  /^\/api\/premium\/ws\//,
  /^\/api\/premium\/export\//,
  /^\/api\/premium\/analytics\//,
];

// =============================================================================
// RATE LIMIT CONFIG
// =============================================================================

export const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB

/** Site visitors: 10 req/hour */
export const PUBLIC_RATE_LIMIT = { requests: 10, windowMs: 3_600_000 };
/** Programmatic API consumers (no key): 20 req/hour */
export const API_CLIENT_RATE_LIMIT = { requests: 20, windowMs: 3_600_000 };

/**
 * Tier rate limits applied when a valid API key is present.
 *
 *   pro:       50,000 req/day
 *   enterprise: 500,000 req/day
 *
 * Free keys are no longer issued. Existing free keys are rejected.
 */
export const TIER_LIMITS: Record<string, { daily: number; perMinute: number }> =
  {
    free: { daily: 100, perMinute: 10 },
    pro: { daily: 50_000, perMinute: 500 },
    enterprise: { daily: 500_000, perMinute: 2_000 },
  };

/** Max results a sample-tier / anonymous request may receive. */
export const FREE_TIER_MAX_RESULTS = 2;

// =============================================================================
// PER-ROUTE RATE LIMITS (expensive endpoints)
// =============================================================================

/**
 * Stricter per-route rate limits for expensive operations.
 * These are checked IN ADDITION to the global tier limit.
 */
export const ROUTE_RATE_LIMITS: {
  pattern: RegExp;
  requests: number;
  windowMs: number;
  label: string;
}[] = [
  { pattern: /^\/api\/ai/, requests: 10, windowMs: 60_000, label: "ai" },
  { pattern: /^\/api\/ask/, requests: 10, windowMs: 60_000, label: "ask" },
  {
    pattern: /^\/api\/summarize/,
    requests: 20,
    windowMs: 60_000,
    label: "summarize",
  },
  {
    pattern: /^\/api\/translate/,
    requests: 10,
    windowMs: 60_000,
    label: "translate",
  },
  {
    pattern: /^\/api\/forecast/,
    requests: 10,
    windowMs: 60_000,
    label: "forecast",
  },
  {
    pattern: /^\/api\/detect/,
    requests: 20,
    windowMs: 60_000,
    label: "detect",
  },
  {
    pattern: /^\/api\/classify/,
    requests: 20,
    windowMs: 60_000,
    label: "classify",
  },
  {
    pattern: /^\/api\/factcheck/,
    requests: 10,
    windowMs: 60_000,
    label: "factcheck",
  },
  { pattern: /^\/api\/rag/, requests: 10, windowMs: 60_000, label: "rag" },
  {
    pattern: /^\/api\/vector-search/,
    requests: 20,
    windowMs: 60_000,
    label: "vector-search",
  },
  { pattern: /^\/api\/export/, requests: 5, windowMs: 60_000, label: "export" },
  {
    pattern: /^\/api\/exports/,
    requests: 5,
    windowMs: 60_000,
    label: "exports",
  },
  {
    pattern: /^\/api\/search/,
    requests: 30,
    windowMs: 60_000,
    label: "search",
  },
  {
    pattern: /^\/api\/backtest/,
    requests: 5,
    windowMs: 60_000,
    label: "backtest",
  },
];

/** Rate limit for /api/register — prevent abuse / enumeration. */
export const REGISTER_RATE_LIMIT = { requests: 5, windowMs: 3_600_000 }; // 5 per hour per IP

// =============================================================================
// API KEY EXPIRATION
// =============================================================================

/** Default key expiry in days per tier. Free keys expire after 90 days, pro after 365, enterprise after 730. */
export const KEY_EXPIRY_DAYS: Record<string, number> = {
  free: 90,
  pro: 365,
  enterprise: 730,
};

// =============================================================================
// REPEAT-429 ESCALATION
// =============================================================================

export const REPEAT_429_THRESHOLD = 10; // 429 responses before escalation
export const REPEAT_429_WINDOW_MS = 600_000; // 10-minute rolling window
export const REPEAT_429_BLOCK_MS = 3_600_000; // 1-hour hard block after escalation

// =============================================================================
// HELPERS
// =============================================================================

export function findRouteRateLimit(
  pathname: string,
): (typeof ROUTE_RATE_LIMITS)[number] | null {
  return ROUTE_RATE_LIMITS.find((r) => r.pattern.test(pathname)) ?? null;
}

export function matchesPattern(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(pathname));
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

export function getClientIp(request: {
  headers: { get(name: string): string | null };
}): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
