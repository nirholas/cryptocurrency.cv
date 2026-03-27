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
 * x402 Payment Gate
 *
 * Wraps the @x402/next SDK for USDC micropayments on Base.
 * Lazy-initialised to avoid build-time errors.
 *
 * @module middleware/x402
 */

import { type NextRequest, NextResponse } from 'next/server';
import type { MiddlewareContext, MiddlewareHandler } from './types';
import { EXEMPT_PATTERNS, FREE_TIER_PATTERNS, matchesPattern } from './config';
import { paymentProxyFromConfig } from '@x402/next';
import type { RouteConfig } from '@x402/next';
import { API_PRICING, PREMIUM_PRICING, toX402Price } from '@/lib/x402/pricing';

const RECEIVE_ADDRESS =
  (process.env.X402_RECEIVE_ADDRESS as `0x${string}`) ??
  '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

const NETWORK = (process.env.X402_NETWORK ?? 'eip155:42161') as never;

/** Build per-route pricing config from API_PRICING + PREMIUM_PRICING */
function buildApiRoutes(): Record<string, RouteConfig> {
  const routes: Record<string, RouteConfig> = {};

  // Add explicit routes with correct per-endpoint pricing
  for (const [path, price] of Object.entries(API_PRICING)) {
    routes[path] = {
      accepts: [{ scheme: 'exact', payTo: RECEIVE_ADDRESS, price, network: NETWORK }],
    };
  }
  for (const [path, config] of Object.entries(PREMIUM_PRICING)) {
    routes[path] = {
      accepts: [{ scheme: 'exact', payTo: RECEIVE_ADDRESS, price: toX402Price(config.price), network: NETWORK }],
    };
  }

  // Catch-all fallback for routes not in explicit pricing
  routes['/api/:path*'] = {
    accepts: [{ scheme: 'exact', payTo: RECEIVE_ADDRESS, price: '$0.001', network: NETWORK }],
    description: 'Crypto Vision API — pay per request in USDs on Arbitrum',
  };

  return routes;
}

let _x402: ReturnType<typeof paymentProxyFromConfig> | null = null;

/**
 * Returns the x402 payment proxy middleware function.
 * Lazy-initialised so the "exact" EVM scheme only needs to be available at request time.
 */
export function getX402Proxy(): (req: NextRequest) => any {
  if (!_x402) {
    try {
      _x402 = paymentProxyFromConfig(buildApiRoutes(), undefined, undefined, undefined, undefined, false);
    } catch (err) {
      console.warn(
        '[x402] Proxy init deferred — scheme not yet available:',
        (err as Error).message,
      );
      return (_req: NextRequest) =>
        NextResponse.json(
          {
            error: 'Service Unavailable',
            code: 'PAYMENT_GATE_UNAVAILABLE',
            message: 'Payment verification is temporarily unavailable. Please retry shortly.',
          },
          { status: 503, headers: { 'Retry-After': '30' } },
        );
    }
  }
  return _x402;
}

// =============================================================================
// COMPOSABLE HANDLER
// =============================================================================

/**
 * Middleware handler: applies x402 USDC micropayment gate to non-exempt,
 * non-free-tier API routes without a paid key or API key.
 *
 * Runs BEFORE rate limiting so that unauthenticated clients always receive
 * a 402 payment challenge instead of being rate-limited first.
 *
 * Ensures all 402 responses include a proper WWW-Authenticate header with
 * a Payment challenge for x402scan compatibility.
 */
export const x402Gate: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  // Skip x402 for authenticated API key users — they pay via subscription
  if (ctx.apiKeyTier) return ctx;

  const { pathname } = ctx;

  if (
    !ctx.isSperaxOS &&
    !ctx.isTrustedOrigin &&
    !matchesPattern(pathname, EXEMPT_PATTERNS) &&
    !matchesPattern(pathname, FREE_TIER_PATTERNS)
  ) {
    const paymentResponse = await getX402Proxy()(ctx.request);
    const verified = paymentResponse.headers.get('x-middleware-next') === '1';
    if (!verified) {
      Object.entries(ctx.headers).forEach(([k, v]) => paymentResponse.headers.set(k, v));
      paymentResponse.headers.set('X-Response-Time', `${Date.now() - ctx.startTime}ms`);

      // Ensure WWW-Authenticate includes a Payment challenge for x402scan
      if (paymentResponse.status === 402) {
        const existing = paymentResponse.headers.get('WWW-Authenticate') ?? '';
        if (!existing.includes('Payment')) {
          paymentResponse.headers.set(
            'WWW-Authenticate',
            existing ? `${existing}, Payment realm="${pathname}"` : `Payment realm="${pathname}"`,
          );
        }
      }

      return paymentResponse;
    }
  }

  return ctx;
};
