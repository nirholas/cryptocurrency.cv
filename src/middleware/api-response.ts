/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * API Response Handler
 *
 * Assembles the final API response with forwarded metadata headers,
 * cache control, and response timing.
 *
 * @module middleware/api-response
 */

import { NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';
import { FREE_TIER_PATTERNS, FREE_TIER_MAX_RESULTS, matchesPattern } from './config';

export const apiResponse: MiddlewareHandler = (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  const { pathname } = ctx;

  // Determine if this is an anonymous free-tier request
  const isFreeTierRequest =
    !ctx.isSperaxOS &&
    !ctx.isTrustedOrigin &&
    matchesPattern(pathname, FREE_TIER_PATTERNS) &&
    !ctx.apiKeyId;

  // Forward tier metadata to route handlers via request headers
  const requestHeaders = new Headers(ctx.request.headers);
  if (isFreeTierRequest) requestHeaders.set('x-free-tier', '1');
  if (ctx.isApiClient) requestHeaders.set('x-api-client', '1');
  if (ctx.isSperaxOS || ctx.isTrustedOrigin) requestHeaders.set('x-speraxos', '1');

  if (ctx.apiKeyTier) {
    requestHeaders.set('x-key-tier', ctx.apiKeyTier);
    requestHeaders.set('x-key-id', ctx.apiKeyId || '');
    if (ctx.apiKeyTier === 'free') {
      requestHeaders.set('x-free-tier', '1');
      requestHeaders.set('x-tier-max-results', FREE_TIER_MAX_RESULTS.toString());
    }
    if (ctx.apiKeyTier === 'enterprise') {
      requestHeaders.set('x-priority', 'enterprise');
      ctx.headers['X-Priority'] = 'enterprise';
    }
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(ctx.headers).forEach(([k, v]) => res.headers.set(k, v));
  res.headers.set('X-Response-Time', `${Date.now() - ctx.startTime}ms`);

  if (!res.headers.has('Cache-Control')) {
    if (ctx.apiKeyTier === 'enterprise') {
      res.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=120');
      res.headers.set('X-Cache-Tier', 'enterprise');
    } else {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
  }

  res.headers.append('Vary', 'Accept');
  return res;
};
