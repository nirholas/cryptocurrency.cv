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
 * Determines whether an API request comes from this site's own pages or
 * server, or from an allow-listed partner origin.
 *
 * SperaxOS API authentication is handled exclusively by speraxos-hmac.ts
 * (HMAC-SHA256 signatures). Headers such as `Origin` and `Sec-Fetch-Site`
 * are trivially spoofable by non-browser clients, so first-party trust also
 * requires the signed cookie from ./first-party.
 *
 * @module middleware/trusted-origins
 */

import type { MiddlewareHandler } from './types';
import { firstPartyCookieRemaining, isInternalRequest } from './first-party';

// The app's own public URL — browser client components fetch same-origin APIs
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cryptocurrency.cv';

// Exact-match origins that bypass x402 and rate limiting entirely
const TRUSTED_EXACT_ORIGINS = new Set([
  'https://chat.sperax.io',
  'https://x402scan.com',
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
 * Middleware handler: decides whether an API request comes from this site or
 * from an allow-listed partner.
 *
 * `ctx.isSperaxOS` is set upstream by the speraxos-hmac handler (HMAC-only).
 * For everything else, in order:
 *  1. Internal: server code calling its own API with the signed
 *     `x-fcn-internal` header (lib/internal-fetch).
 *  2. First party: a same-origin signal (`Sec-Fetch-Site`, our own `Origin`,
 *     or a same-site `Referer` for Safari) AND a valid signed first-party
 *     cookie. The headers alone prove nothing, since any non-browser client
 *     can send them; the cookie is only issued on this site's pages.
 *  3. Partner: an allow-listed partner `Origin` (or `Referer`), unchanged.
 *
 * Each kind of trust is metered in its own bucket (see ctx.trustedBucket).
 */
export const trustedOriginHandler: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const reqOrigin = ctx.request.headers.get('origin') ?? '';
  const secFetchSite = ctx.request.headers.get('sec-fetch-site');
  const reqReferer = ctx.request.headers.get('referer') ?? '';
  const ownOrigin = ctx.request.nextUrl.origin;

  let refererOrigin = '';
  try {
    refererOrigin = reqReferer ? new URL(reqReferer).origin : '';
  } catch {
    // malformed Referer: ignore
  }

  const isOwn = (origin: string) => origin === ownOrigin || origin === APP_URL;

  if (ctx.isSperaxOS) {
    // HMAC-authenticated upstream; nothing to decide here.
  } else if (await isInternalRequest(ctx.request)) {
    ctx.isTrustedOrigin = true;
    ctx.trustedBucket = 'internal';
  } else {
    const claimsSameOrigin =
      secFetchSite === 'same-origin' ||
      secFetchSite === 'same-site' ||
      isOwn(reqOrigin) ||
      (!reqOrigin && isOwn(refererOrigin));

    if (claimsSameOrigin && (await firstPartyCookieRemaining(ctx.request)) > 0) {
      ctx.isTrustedOrigin = true;
      ctx.trustedBucket = `first-party:${ctx.clientIp}`;
    } else {
      const partner = [reqOrigin, refererOrigin].find(
        (o) => o && !isOwn(o) && isTrustedOrigin(o),
      );
      if (partner) {
        ctx.isTrustedOrigin = true;
        ctx.trustedBucket = `partner:${new URL(partner).host}`;
      }
    }
  }

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
