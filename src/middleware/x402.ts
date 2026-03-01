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
import { paymentProxyFromConfig } from '@x402/next';
import type { RouteConfig } from '@x402/next';

const RECEIVE_ADDRESS =
  (process.env.X402_RECEIVE_ADDRESS as `0x${string}`) ??
  '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

const NETWORK = (process.env.X402_NETWORK ?? 'eip155:8453') as never;

const apiRoutes: Record<string, RouteConfig> = {
  '/api/:path*': {
    accepts: [
      {
        scheme: 'exact',
        payTo: RECEIVE_ADDRESS,
        price: '$0.001',
        network: NETWORK,
      },
    ],
    description: 'Free Crypto News API — pay per request in USDC on Base',
  },
};

let _x402: ReturnType<typeof paymentProxyFromConfig> | null = null;

/**
 * Returns the x402 payment proxy middleware function.
 * Lazy-initialised so the "exact" EVM scheme only needs to be available at request time.
 */
export function getX402Proxy(): (req: NextRequest) => any {
  if (!_x402) {
    try {
      _x402 = paymentProxyFromConfig(
        apiRoutes,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
      );
    } catch (err) {
      console.warn('[x402] Proxy init deferred — scheme not yet available:', (err as Error).message);
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
