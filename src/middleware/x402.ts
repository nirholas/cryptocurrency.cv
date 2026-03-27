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
 * Wraps the @x402/next SDK for USDC micropayments on Arbitrum.
 * Lazy-initialised to avoid build-time errors.
 *
 * Uses a CAIP-2 bridging facilitator wrapper because Sperax returns
 * x402Version:1 with named networks ("arbitrum") while the SDK expects
 * x402Version:2 with CAIP-2 format ("eip155:42161"). The wrapper
 * translates the format gap so the SDK can build valid payment requirements.
 *
 * @module middleware/x402
 */

import { type NextRequest, NextResponse } from 'next/server';
import type { MiddlewareHandler } from './types';
import { EXEMPT_PATTERNS, FREE_TIER_PATTERNS, matchesPattern } from './config';
import { paymentProxyFromConfig } from '@x402/next';
import type { RouteConfig } from '@x402/next';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { API_PRICING, PREMIUM_PRICING, toX402Price, usdToUsdc } from '@/lib/x402/pricing';
import {
  FACILITATOR_URL,
  RECEIVE_ADDRESS,
  CURRENT_NETWORK,
  USDC_ADDRESSES,
} from '@/lib/x402/config';

const NETWORK = CURRENT_NETWORK as never;

// ---------------------------------------------------------------------------
// Named → CAIP-2 network bridging
// ---------------------------------------------------------------------------

/** Map named networks (from Sperax facilitator) to CAIP-2 identifiers (SDK format) */
const NAMED_TO_CAIP2: Record<string, string> = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
  arbitrum: 'eip155:42161',
  ethereum: 'eip155:1',
};

/**
 * Wraps a real facilitator client and normalises its `getSupported()` response
 * from v1/named-network format to v2/CAIP-2 format that the SDK expects.
 */
class Caip2FacilitatorBridge {
  private inner: HTTPFacilitatorClient;
  constructor(inner: HTTPFacilitatorClient) {
    this.inner = inner;
  }

  async getSupported() {
    const supported = await this.inner.getSupported();
    return {
      ...supported,
      kinds: supported.kinds.map((kind: Record<string, unknown>) => ({
        ...kind,
        x402Version: 2,
        network: NAMED_TO_CAIP2[kind.network as string] ?? kind.network,
      })),
    };
  }
  async verify(...args: Parameters<HTTPFacilitatorClient['verify']>) {
    return this.inner.verify(...args);
  }
  async settle(...args: Parameters<HTTPFacilitatorClient['settle']>) {
    return this.inner.settle(...args);
  }
  async createAuthHeaders(path: string) {
    return this.inner.createAuthHeaders(path);
  }
}

// ---------------------------------------------------------------------------
// ExactEvmScheme with Arbitrum USDC support
// ---------------------------------------------------------------------------

/** Arbitrum USDC (6 decimals, EIP-3009) */
const ARBITRUM_USDC = {
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  name: 'USD Coin',
  version: '2',
  decimals: 6,
};

/** Create an ExactEvmScheme with a custom money parser for Arbitrum USDC */
function createArbitrumScheme(): ExactEvmScheme {
  const scheme = new ExactEvmScheme();
  scheme.registerMoneyParser(async (amount: number, network: string) => {
    if (network === 'eip155:42161') {
      const tokenAmount = Math.round(amount * 10 ** ARBITRUM_USDC.decimals).toString();
      return {
        amount: tokenAmount,
        asset: ARBITRUM_USDC.address,
        extra: { name: ARBITRUM_USDC.name, version: ARBITRUM_USDC.version },
      };
    }
    return null; // fallback to default for other networks
  });
  return scheme;
}

// ---------------------------------------------------------------------------
// Route config builder
// ---------------------------------------------------------------------------

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
      accepts: [
        {
          scheme: 'exact',
          payTo: RECEIVE_ADDRESS,
          price: toX402Price(config.price),
          network: NETWORK,
        },
      ],
    };
  }

  // Catch-all fallback for routes not in explicit pricing
  routes['/api/:path*'] = {
    accepts: [{ scheme: 'exact', payTo: RECEIVE_ADDRESS, price: '$0.001', network: NETWORK }],
    description: 'Crypto Vision API — pay per request in USDC on Arbitrum',
  };

  return routes;
}

// ---------------------------------------------------------------------------
// Proxy initialisation
// ---------------------------------------------------------------------------

let _x402: ReturnType<typeof paymentProxyFromConfig> | null = null;

/**
 * Returns the x402 payment proxy middleware function.
 * Lazy-initialised so the "exact" EVM scheme only needs to be available at request time.
 */
export function getX402Proxy(): (req: NextRequest) => any {
  if (!_x402) {
    try {
      const realFacilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
      const bridgedFacilitator = new Caip2FacilitatorBridge(realFacilitator);
      const arbitrumScheme = createArbitrumScheme();

      _x402 = paymentProxyFromConfig(
        buildApiRoutes(),
        bridgedFacilitator as unknown as HTTPFacilitatorClient,
        [{ network: 'eip155:*' as never, server: arbitrumScheme }],
      );
    } catch (err) {
      console.warn(
        '[x402] Proxy init deferred — scheme not yet available:',
        (err as Error).message,
      );
      // Return a proper 402 handler that builds payment requirements from local pricing.
      // This ensures x402scan (and clients) always see valid 402 responses with accepts,
      // even when the facilitator or EVM scheme is temporarily unavailable.
      return (req: NextRequest) => buildFallback402(req);
    }
  }
  return _x402;
}

// ---------------------------------------------------------------------------
// Fallback 402 builder — used when the proxy cannot initialise
// ---------------------------------------------------------------------------

const USDC_ASSET =
  USDC_ADDRESSES[NETWORK as keyof typeof USDC_ADDRESSES] ?? USDC_ADDRESSES['eip155:42161'];

/** Get the USD price string for a route path */
function getRoutePrice(path: string): string {
  const v1Price = (API_PRICING as Record<string, string>)[path];
  if (v1Price) return v1Price;
  const premiumConfig = (PREMIUM_PRICING as Record<string, { price: number }>)[path];
  if (premiumConfig) return `$${premiumConfig.price}`;
  return '$0.001';
}

/**
 * Build a standards-compliant x402 v1 402 response with accepts array.
 * Used as fallback when the SDK proxy cannot initialise, and as the
 * safety net when the proxy throws at request time.
 *
 * @see https://github.com/Merit-Systems/x402scan — validation schema
 */
function buildFallback402(req: NextRequest): NextResponse {
  const pathname = req.nextUrl.pathname;
  const price = getRoutePrice(pathname);
  const maxAmountRequired = usdToUsdc(price);

  return NextResponse.json(
    {
      x402Version: 1,
      error: 'Payment Required',
      accepts: [
        {
          scheme: 'exact',
          network: CURRENT_NETWORK,
          maxAmountRequired,
          asset: USDC_ASSET,
          payTo: RECEIVE_ADDRESS,
          resource: `https://cryptocurrency.cv${pathname}`,
          description: `Pay ${price.replace('$', '')} USDC to access this endpoint`,
          mimeType: 'application/json',
          maxTimeoutSeconds: 60,
          extra: {
            name: ARBITRUM_USDC.name,
            version: ARBITRUM_USDC.version,
          },
          outputSchema: {
            input: { method: req.method, type: 'http' },
            output: null,
          },
        },
      ],
    },
    {
      status: 402,
      headers: {
        'WWW-Authenticate': `Payment realm="${pathname}"`,
        'X-Payment-Required': 'true',
      },
    },
  );
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
    let paymentResponse: NextResponse;
    try {
      paymentResponse = await getX402Proxy()(ctx.request);
    } catch (err) {
      // Proxy threw at request time (facilitator unreachable, SDK error, etc.)
      // Fall back to locally-built 402 so the client always sees payment requirements.
      console.warn('[x402] Proxy error, using fallback 402:', (err as Error).message);
      paymentResponse = buildFallback402(ctx.request);
    }

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
