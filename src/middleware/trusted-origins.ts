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
 */
export const trustedOriginHandler: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  // isSperaxOS is already set by speraxosHmac earlier in the pipeline
  const reqOrigin = ctx.request.headers.get('origin') ?? '';
  ctx.isTrustedOrigin = !ctx.isSperaxOS && !!reqOrigin && isTrustedOrigin(reqOrigin);

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
