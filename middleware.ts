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
 * Main Middleware
 *
 * Thin orchestrator that delegates to sub-modules in src/middleware/:
 *  1. Internationalisation — locale detection and routing for page requests
 *  2. Trusted-origin check — Sperax domains bypass x402 and rate limiting
 *  3. Bot detection — blocks known scrapers/crawlers
 *  4. Admin route authentication — bearer-token guard
 *  5. Request size validation — rejects oversized bodies
 *  6. Rate limiting — 60 req/hour per IP for free-tier API routes
 *  7. x402 payment gate — USDC micropayments on Base
 *  8. Security + observability headers on all responses
 *
 * @see https://x402.org
 */

import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { Redis } from "@upstash/redis";
import { routing } from "./src/i18n/navigation";

import {
  FREE_TIER_PATTERNS,
  EXEMPT_PATTERNS,
  AI_ENDPOINT_PATTERNS,
  MAX_BODY_SIZE,
  TIER_LIMITS,
  FREE_TIER_MAX_RESULTS,
  REPEAT_429_BLOCK_MS,
  REGISTER_RATE_LIMIT,
  matchesPattern,
  findRouteRateLimit,
  generateRequestId,
  getClientIp,
  isBlockedBot,
  isApiClient,
  isSperaxOSRequest,
  isTrustedOrigin,
  SECURITY_HEADERS,
  isSuspiciousRequest,
  buildCspHeader,
  checkRateLimit,
  checkTierRateLimit,
  record429,
  isRepeat429Blocked,
  getX402Proxy,
} from "./src/middleware";

// =============================================================================
// INTERNATIONALISATION
// =============================================================================

const intlMiddleware = createMiddleware(routing);

// =============================================================================
// MAIN MIDDLEWARE
// =============================================================================

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Redirect /docs to external docs site ──────────────────────────────
  const docsMatch = pathname.match(
    /^(?:\/[a-z]{2}(?:-[A-Z]{2})?)?\/docs(\/.*)?$/,
  );
  if (docsMatch) {
    const sub = (docsMatch[1] || "").replace(/^\//, "");
    const dest = sub
      ? `https://docs.cryptocurrency.cv/${sub}`
      : "https://docs.cryptocurrency.cv";
    return NextResponse.redirect(dest, { status: 301 });
  }

  // ── Fix double-dashboard paths (/dashboard/dashboard/… → /dashboard/…) ──
  const dblDash = pathname.match(
    /^(\/[a-z]{2}(?:-[A-Z]{2})?)?\/dashboard\/dashboard(\/.*)?$/,
  );
  if (dblDash) {
    const url = request.nextUrl.clone();
    url.pathname = `${dblDash[1] || ""}/dashboard${dblDash[2] || ""}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── Embed routes: skip intl, allow cross-origin iframing ────────────────
  if (pathname.startsWith("/embed/") || pathname === "/embed") {
    const response = NextResponse.next();
    // Allow embedding in iframes on any origin
    response.headers.delete("X-Frame-Options");
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
    return response;
  }

  // ── Non-API routes: internationalisation + nonce-based CSP ───────────────
  if (!pathname.startsWith("/api/")) {
    // Bot detection on page routes — block scrapers before rendering
    const pageUa = request.headers.get("user-agent") || "";
    if (isBlockedBot(pageUa)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = buildCspHeader(nonce);

    const response = intlMiddleware(request);

    // Expose nonce to server components via headers()
    response.headers.set("x-middleware-request-x-nonce", nonce);
    // Let the Next.js renderer read the CSP to auto-add nonces to framework scripts
    response.headers.set("x-middleware-request-content-security-policy", csp);
    // Send the CSP to the browser
    response.headers.set("Content-Security-Policy", csp);

    // Prevent search engines from indexing the sources page (anti-scrape)
    const normalised = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");
    if (normalised === "/sources" || normalised.startsWith("/sources/")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }

    return response;
  }

  // ── API routes ────────────────────────────────────────────────────────────
  const start = Date.now();
  const requestId = generateRequestId();
  const speraxos = await isSperaxOSRequest(request);

  const headers: Record<string, string> = {
    "X-Request-ID": requestId,
    "X-RateLimit-Policy": "fair-use",
    ...SECURITY_HEADERS,
  };

  if (speraxos) {
    headers["X-Priority"] = "speraxos";
    headers["X-SperaxOS"] = "1";
    headers["Vary"] = "Origin";
  }

  // Suspicious payload detection — reject likely injection attempts early
  const suspiciousLocation = isSuspiciousRequest(request);
  if (suspiciousLocation) {
    return NextResponse.json(
      {
        error: "Bad Request",
        code: "SUSPICIOUS_INPUT",
        message: "Request contains potentially malicious content",
        requestId,
      },
      { status: 400, headers },
    );
  }

  // Bot check
  const ua = request.headers.get("user-agent") || "";
  if (isBlockedBot(ua)) {
    return NextResponse.json(
      { error: "Forbidden", code: "BOT_BLOCKED", requestId },
      { status: 403, headers },
    );
  }

  // Repeat-429 escalation — hard-block IPs that ignore rate limits
  const clientIpForEscalation = getClientIp(request);
  const blockedUntil = isRepeat429Blocked(clientIpForEscalation);
  if (blockedUntil) {
    const retryEsc = Math.ceil((blockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Forbidden",
        code: "REPEAT_RATE_LIMIT_ABUSE",
        message: "Too many rate-limited requests. You are temporarily blocked.",
        retryAfter: retryEsc,
        requestId,
      },
      {
        status: 403,
        headers: { ...headers, "Retry-After": retryEsc.toString() },
      },
    );
  }

  // Admin auth — constant-time comparison to prevent timing attacks
  if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) {
    const adminToken = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    const expected = process.env.ADMIN_TOKEN;
    let adminAuthed = false;
    if (expected && adminToken) {
      const enc = new TextEncoder();
      const a = enc.encode(adminToken);
      const b = enc.encode(expected);
      if (a.byteLength === b.byteLength) {
        let diff = 0;
        for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
        adminAuthed = diff === 0;
      }
    }
    if (!adminAuthed) {
      return NextResponse.json(
        { error: "Unauthorized", code: "ADMIN_AUTH_REQUIRED", requestId },
        { status: 401, headers },
      );
    }
  }

  // ── CORS restriction on sensitive routes ──────────────────────────────────
  // Admin, internal, and key-management routes must NOT be open to all origins.
  // Only trusted origins (Sperax) and same-origin requests are allowed.
  const isSensitiveRoute =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/internal") ||
    pathname.startsWith("/api/keys/");

  if (isSensitiveRoute) {
    const origin = request.headers.get("origin") ?? "";
    if (origin && !isTrustedOrigin(origin)) {
      headers["Access-Control-Allow-Origin"] = "null";
    } else if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Vary"] = "Origin";
    }
  }

  const apiClient = isApiClient(request);

  // ── API Key tier detection ────────────────────────────────────────────────
  const apiKeyRaw =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null;

  let resolvedTier: "free" | "pro" | "enterprise" | null = null;
  let resolvedKeyId: string | null = null;

  if (apiKeyRaw && apiKeyRaw.startsWith("cda_")) {
    if (apiKeyRaw.startsWith("cda_ent_")) resolvedTier = "enterprise";
    else if (apiKeyRaw.startsWith("cda_pro_")) resolvedTier = "pro";
    else resolvedTier = "free";

    try {
      const msgBuffer = new TextEncoder().encode(apiKeyRaw);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const url =
        process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
      const token =
        process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

      if (url && token) {
        const redis = new Redis({ url, token });
        const keyData = await redis.get<{
          id: string;
          tier: "free" | "pro" | "enterprise";
          active: boolean;
          email: string;
          expiresAt?: string;
        }>(`apikey:${hashHex}`);

        if (keyData && keyData.active) {
          // Check key expiration
          if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
            return NextResponse.json(
              {
                error: "API key expired",
                code: "KEY_EXPIRED",
                message:
                  "Your API key has expired. Please register a new key or contact support.",
                expiredAt: keyData.expiresAt,
                register: "/api/register",
                requestId,
              },
              { status: 401, headers },
            );
          }
          resolvedTier = keyData.tier;
          resolvedKeyId = keyData.id;
        } else if (keyData && !keyData.active) {
          return NextResponse.json(
            { error: "API key revoked", code: "KEY_REVOKED", requestId },
            { status: 401, headers },
          );
        }
        if (!keyData) {
          resolvedTier = null;
        }
      }
    } catch {
      resolvedTier = "free";
      resolvedKeyId = null;
    }
  }

  // ── AI endpoint gating ─────────────────────────────────────────────────
  // Free keys are no longer issued. Reject any existing free keys.
  if (resolvedTier === "free" && !speraxos) {
    return NextResponse.json(
      {
        error: "Free tier discontinued",
        code: "FREE_TIER_DISCONTINUED",
        message:
          "Free API keys are no longer supported. Use x402 micropayment ($0.001/req) or upgrade to Pro ($29/mo).",
        upgrade: "/api/keys/upgrade",
        sample: "/api/sample",
        requestId,
      },
      { status: 403, headers },
    );
  }

  // ── /api/register rate limit — prevent abuse / key enumeration ──────────
  // This route is exempt from regular rate limiting, so we apply a separate limit.
  if (pathname === "/api/register" && !speraxos) {
    const regIp = getClientIp(request);
    const regRl = await checkRateLimit(`register:${regIp}`, "public");
    // Override with the register-specific limits
    if (regRl.remaining <= 0 || !regRl.allowed) {
      const retry = Math.ceil((regRl.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "Rate Limit Exceeded",
          code: "REGISTER_RATE_LIMIT",
          message: `API key registration is limited to ${REGISTER_RATE_LIMIT.requests} requests per hour per IP`,
          retryAfter: retry,
          requestId,
        },
        {
          status: 429,
          headers: { ...headers, "Retry-After": retry.toString() },
        },
      );
    }
  }

  // Exempt patterns — skip rate limiting / size check
  if (!matchesPattern(pathname, EXEMPT_PATTERNS)) {
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const len = request.headers.get("content-length");
      if (len && parseInt(len, 10) > MAX_BODY_SIZE) {
        return NextResponse.json(
          {
            error: "Request Entity Too Large",
            code: "REQUEST_TOO_LARGE",
            requestId,
          },
          { status: 413, headers },
        );
      }
    }

    // ── Tier-aware rate limiting ──────────────────────────────────────────
    if (speraxos) {
      headers["X-RateLimit-Limit"] = "unlimited";
      headers["X-RateLimit-Remaining"] = "unlimited";
    } else if (resolvedTier && resolvedKeyId) {
      const tierLimit = TIER_LIMITS[resolvedTier] ?? TIER_LIMITS.free;
      const rl = await checkTierRateLimit(resolvedKeyId, tierLimit.daily);
      headers["X-RateLimit-Limit"] = tierLimit.daily.toString();
      headers["X-RateLimit-Remaining"] = rl.remaining.toString();
      headers["X-RateLimit-Reset"] = new Date(rl.resetAt).toISOString();
      headers["X-RateLimit-Tier"] = resolvedTier;
      headers["X-Key-Tier"] = resolvedTier;

      if (!rl.allowed) {
        const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
        if (record429(clientIpForEscalation)) {
          return NextResponse.json(
            {
              error: "Forbidden",
              code: "REPEAT_RATE_LIMIT_ABUSE",
              message:
                "Too many rate-limited requests. You are temporarily blocked.",
              retryAfter: Math.ceil(REPEAT_429_BLOCK_MS / 1000),
              requestId,
            },
            {
              status: 403,
              headers: {
                ...headers,
                "Retry-After": Math.ceil(REPEAT_429_BLOCK_MS / 1000).toString(),
              },
            },
          );
        }
        return NextResponse.json(
          {
            error: "Rate Limit Exceeded",
            code: "RATE_LIMIT_EXCEEDED",
            tier: resolvedTier,
            limit: tierLimit.daily,
            retryAfter: retry,
            upgrade:
              resolvedTier === "free"
                ? "Upgrade to Pro for 50,000 req/day at /api/keys/upgrade"
                : resolvedTier === "pro"
                  ? "Upgrade to Enterprise for 500,000 req/day"
                  : undefined,
            requestId,
          },
          {
            status: 429,
            headers: { ...headers, "Retry-After": retry.toString() },
          },
        );
      }

      // ── Usage tracking (fire-and-forget) ────────────────────────────────
      try {
        const url =
          process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
        const token =
          process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
        if (url && token) {
          const redis = new Redis({ url, token });
          const today = new Date().toISOString().split("T")[0];
          const month = today.substring(0, 7);
          const pipe = redis.pipeline();
          pipe.incr(`usage:${resolvedKeyId}:${today}`);
          pipe.expire(`usage:${resolvedKeyId}:${today}`, 172800);
          pipe.incr(`usage:${resolvedKeyId}:${month}`);
          pipe.expire(`usage:${resolvedKeyId}:${month}`, 3024000);
          pipe.incr(`usage:${resolvedKeyId}:total`);
          pipe.incr(`stats:requests:${today}`);
          pipe.incr(`stats:requests:${month}`);
          pipe.exec().catch(() => {});
        }
      } catch {
        // Usage tracking failure is non-fatal
      }
    } else if (matchesPattern(pathname, FREE_TIER_PATTERNS)) {
      const tier = apiClient ? "api" : "public";
      const rl = await checkRateLimit(
        `${getClientIp(request)}:${pathname}`,
        tier,
      );
      headers["X-RateLimit-Limit"] = rl.limit.toString();
      headers["X-RateLimit-Remaining"] = rl.remaining.toString();
      headers["X-RateLimit-Reset"] = new Date(rl.resetAt).toISOString();
      headers["X-RateLimit-Tier"] = tier;

      if (!rl.allowed) {
        const retry = Math.ceil((rl.resetAt - Date.now()) / 1000);
        if (record429(clientIpForEscalation)) {
          return NextResponse.json(
            {
              error: "Forbidden",
              code: "REPEAT_RATE_LIMIT_ABUSE",
              message:
                "Too many rate-limited requests. You are temporarily blocked.",
              retryAfter: Math.ceil(REPEAT_429_BLOCK_MS / 1000),
              requestId,
            },
            {
              status: 403,
              headers: {
                ...headers,
                "Retry-After": Math.ceil(REPEAT_429_BLOCK_MS / 1000).toString(),
              },
            },
          );
        }
        return NextResponse.json(
          {
            error: "Rate Limit Exceeded",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: retry,
            tier,
            requestId,
          },
          {
            status: 429,
            headers: { ...headers, "Retry-After": retry.toString() },
          },
        );
      }
    }

    // ── Per-route rate limits for expensive endpoints ──────────────────────
    if (!speraxos) {
      const routeLimit = findRouteRateLimit(pathname);
      if (routeLimit) {
        const routeKey = resolvedKeyId
          ? `route:${routeLimit.label}:${resolvedKeyId}`
          : `route:${routeLimit.label}:${getClientIp(request)}`;
        const routeRl = await checkRateLimit(routeKey, "public");
        if (!routeRl.allowed) {
          const retry = Math.ceil((routeRl.resetAt - Date.now()) / 1000);
          return NextResponse.json(
            {
              error: "Rate Limit Exceeded",
              code: "ROUTE_RATE_LIMIT",
              message: `This endpoint is limited to ${routeLimit.requests} requests per minute`,
              endpoint: routeLimit.label,
              retryAfter: retry,
              requestId,
            },
            {
              status: 429,
              headers: { ...headers, "Retry-After": retry.toString() },
            },
          );
        }
      }
    }
  }

  // x402 payment gate — applies to all non-exempt, non-sample routes without a paid key
  if (
    pathname.startsWith("/api/") &&
    !speraxos &&
    !resolvedKeyId &&
    !matchesPattern(pathname, EXEMPT_PATTERNS) &&
    !matchesPattern(pathname, FREE_TIER_PATTERNS)
  ) {
    const paymentResponse = await getX402Proxy()(request);
    const verified = paymentResponse.headers.get("x-middleware-next") === "1";
    if (!verified) {
      Object.entries(headers).forEach(([k, v]) =>
        paymentResponse.headers.set(k, v),
      );
      paymentResponse.headers.set("X-Response-Time", `${Date.now() - start}ms`);
      return paymentResponse;
    }
  }

  // Forward tier metadata to route handlers
  const isFreeTierRequest =
    !speraxos && matchesPattern(pathname, FREE_TIER_PATTERNS) && !resolvedKeyId;
  const requestHeaders = new Headers(request.headers);
  if (isFreeTierRequest) requestHeaders.set("x-free-tier", "1");
  if (apiClient) requestHeaders.set("x-api-client", "1");

  if (resolvedTier) {
    requestHeaders.set("x-key-tier", resolvedTier);
    requestHeaders.set("x-key-id", resolvedKeyId || "");
    if (resolvedTier === "free") {
      requestHeaders.set("x-free-tier", "1");
      requestHeaders.set(
        "x-tier-max-results",
        FREE_TIER_MAX_RESULTS.toString(),
      );
    }
    if (resolvedTier === "enterprise") {
      requestHeaders.set("x-priority", "enterprise");
      headers["X-Priority"] = "enterprise";
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set("X-Response-Time", `${Date.now() - start}ms`);

  if (pathname.startsWith("/api/") && !res.headers.has("Cache-Control")) {
    if (resolvedTier === "enterprise") {
      res.headers.set(
        "Cache-Control",
        "private, s-maxage=30, stale-while-revalidate=120",
      );
      res.headers.set("X-Cache-Tier", "enterprise");
    } else {
      res.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300",
      );
    }
  }

  res.headers.append("Vary", "Accept");
  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/",
    "/((?!_next|_vercel|feed\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|xml|json|txt|js|css|woff|woff2|webp|avif)).*)",
  ],
};
