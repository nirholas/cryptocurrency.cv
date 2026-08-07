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
  /^\/api\/news/,    // news feeds — core product, free tier
  /^\/api\/prices/,  // market prices — free tier (coin count limited in route handler)
  /^\/api\/fear-greed$/, // fear & greed index
  /^\/api\/trending$/, // trending topics
  /^\/api\/unlocks$/, // token unlock schedule
  /^\/api\/sources/, // news sources
  /^\/api\/market/,  // market overview
  /^\/api\/coins/,   // coin list / metadata
  /^\/api\/feed/,    // RSS/Atom feed redirects
  /^\/api\/rss/,
  /^\/api\/atom/,
  /^\/api\/archive/, // historical news archive
  /^\/api\/article/, // individual article
  /^\/api\/categories/, // news categories
  /^\/api\/signals/, // market signals
  /^\/api\/status$/, // service status
  /^\/api\/exchanges/, // exchange data — used by UI components
];

/** Routes exempt from rate limiting and x402 payment. */
export const EXEMPT_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/\.well-known/,
  /^\/api\/openapi\.json$/, // OpenAPI spec — must be freely accessible for x402scan discovery
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

/** Site visitors: 10 req/hour (non-free-tier routes only, see FREE_TIER_RATE_LIMIT) */
export const PUBLIC_RATE_LIMIT = { requests: 10, windowMs: 3_600_000 };
/** Programmatic API consumers (no key): 20 req/hour (non-free-tier routes only) */
export const API_CLIENT_RATE_LIMIT = { requests: 20, windowMs: 3_600_000 };
/**
 * Anonymous requests to FREE_TIER_PATTERNS routes: 120 req/hour per IP.
 *
 * These are the advertised free product (news, prices, fear-greed, trending,
 * RSS) and they are CDN-cached, so the marginal cost of a hit is trivial.
 * Clamping them to the global 10/hour made the site 429 its own readers within
 * a minute of browsing and then escalate them to a 1-hour 403 via the
 * repeat-429 blocker; scrapers pulling faster than 2 req/min still get
 * limited, and expensive endpoints keep the tight PUBLIC/API limits above.
 */
export const FREE_TIER_RATE_LIMIT = { requests: 120, windowMs: 3_600_000 };

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
// SPERAXOS CONFIGURATION
// =============================================================================

/** Global rate limit for SperaxOS-authenticated requests. Per-key overrides take precedence. */
export const SPERAXOS_RATE_LIMIT = { daily: 100_000, perMinute: 1_000 };

/**
 * Default allowed route prefixes for SperaxOS keys.
 * Keys without explicit route scopes are restricted to these patterns.
 * Sensitive endpoints (admin, keys, register, cron) are excluded by default.
 */
export const SPERAXOS_DEFAULT_ALLOWED_ROUTES: RegExp[] = [
  /^\/api\/news/,
  /^\/api\/prices/,
  /^\/api\/market/,
  /^\/api\/trending/,
  /^\/api\/sources/,
  /^\/api\/search/,
  /^\/api\/archive/,
  /^\/api\/sentiment/,
  /^\/api\/categories/,
  /^\/api\/coins/,
  /^\/api\/feed/,
  /^\/api\/rss/,
  /^\/api\/atom/,
  /^\/api\/batch/,
  /^\/api\/sample/,
  /^\/api\/health/,
  /^\/api\/status/,
  /^\/api\/article/,
  /^\/api\/signals/,
  /^\/api\/v1\//,
  /^\/api\/summarize/,
  /^\/api\/translate/,
  /^\/api\/detect/,
  /^\/api\/classify/,
  /^\/api\/ask/,
  /^\/api\/forecast/,
  /^\/api\/factcheck/,
];

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
