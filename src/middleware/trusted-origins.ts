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
 * Trusted Origin Detection
 *
 * Determines whether a browser request originates from a trusted SperaxOS domain.
 *
 * SperaxOS API authentication is handled exclusively by speraxos-hmac.ts
 * (HMAC-SHA256 signatures). This module only checks the browser `Origin`
 * header for CORS and trusted-origin flags — the `Origin` header is NOT
 * used for API authorization (trivially spoofable by non-browser clients).
 *
 * @module middleware/trusted-origins
 */

import type { MiddlewareHandler } from './types';

// The app's own public URL — browser client components fetch same-origin APIs
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptocurrency.cv';

// Exact-match origins that bypass x402 and rate limiting entirely
const TRUSTED_EXACT_ORIGINS = new Set([
  'https://chat.sperax.io',
  APP_URL, // own-origin browser requests (PriceTickerStrip, TrendingCoins, etc.)
  ...(process.env.X402_BYPASS_ORIGINS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? []),
]);

// Apex domains whose subdomains are ALSO trusted
const TRUSTED_WILDCARD_DOMAINS = ['sperax.chat', 'sperax.io'];

export function isTrustedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (TRUSTED_EXACT_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return TRUSTED_WILDCARD_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

// =============================================================================
// COMPOSABLE HANDLER
// =============================================================================

/**
 * Middleware handler: checks browser origin trust and sets priority headers.
 *
 * `ctx.isSperaxOS` is set upstream by the speraxos-hmac handler (HMAC-only).
 * This handler only evaluates browser-origin trust for non-HMAC requests.
 *
 * Three signals are checked in order:
 *  1. `Origin` header — present on cross-origin requests and most POST requests.
 *  2. `Sec-Fetch-Site: same-origin` — set by Chrome and Firefox on all JS-initiated
 *     same-origin requests. Browsers prevent JS from forging `Sec-*` headers, making
 *     this a reliable browser indicator. Non-browser clients (curl, SDKs) omit it.
 *     NOTE: Safari does not implement `Sec-Fetch-*` headers at all.
 *  3. `Referer` header — fallback for Safari (no Sec-Fetch-Site) and CDN/proxy
 *     layers that strip Sec-* headers. All major browsers send Referer for same-origin
 *     requests unless the page sets `Referrer-Policy: no-referrer`.
 */
export const trustedOriginHandler: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  // isSperaxOS is already set by speraxosHmac earlier in the pipeline
  const reqOrigin = ctx.request.headers.get('origin') ?? '';
  const secFetchSite = ctx.request.headers.get('sec-fetch-site');
  const reqReferer = ctx.request.headers.get('referer') ?? '';

  // Same-origin browser fetch (GET/HEAD) — no Origin header, but Sec-Fetch-Site is present
  const isSameOriginBrowser = secFetchSite === 'same-origin' || secFetchSite === 'same-site';

  // Cross-origin or POST from a trusted domain — Origin header is present
  const isOriginTrusted = !!reqOrigin && isTrustedOrigin(reqOrigin);

  // Fallback: derive origin from Referer when Origin and Sec-Fetch-Site are absent.
  // Handles environments (some CDNs/proxies) that strip Sec-* headers.
  let isRefererTrusted = false;
  if (!isSameOriginBrowser && !isOriginTrusted && reqReferer) {
    try {
      isRefererTrusted = isTrustedOrigin(new URL(reqReferer).origin);
    } catch {
      // malformed Referer — ignore
    }
  }

  ctx.isTrustedOrigin = !ctx.isSperaxOS && (isSameOriginBrowser || isOriginTrusted || isRefererTrusted);

  if (ctx.isSperaxOS || ctx.isTrustedOrigin) {
    ctx.headers['X-Priority'] = 'speraxos';
    ctx.headers['X-SperaxOS'] = '1';
    ctx.headers['Vary'] = 'Origin';
    if (reqOrigin) {
      ctx.headers['Access-Control-Allow-Origin'] = reqOrigin;
    }
  }

  return ctx;
};
