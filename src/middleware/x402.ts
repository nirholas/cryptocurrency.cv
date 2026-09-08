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
import {
  API_PRICING,
  PREMIUM_PRICING,
  toX402Price,
  usdToUsdc,
} from '@/lib/x402/pricing';
import { FACILITATOR_URL, RECEIVE_ADDRESS, CURRENT_NETWORK } from '@/lib/x402/config';
import {
  ARBITRUM_USDC,
  resolveOrigin,
  buildBazaarExtensions,
  buildInputSchemaForAccepts,
  buildMppChallenge,
  buildPaymentRequiredBody,
  getEndpointMeta,
  getRoutePrice,
  GENERIC_OUTPUT_SCHEMA,
} from '@/lib/x402/payment-required';

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

/**
 * Build a standards-compliant x402 v2 402 response with accepts array,
 * extensions.bazaar schema, and MPP WWW-Authenticate challenge.
 *
 * Used as fallback when the SDK proxy cannot initialise, and as the
 * safety net when the proxy throws at request time.
 */
function buildFallback402(req: NextRequest): NextResponse {
  const pathname = req.nextUrl.pathname;
  const amountAtomic = usdToUsdc(getRoutePrice(pathname));
  const origin = resolveOrigin(req);

  return NextResponse.json(buildPaymentRequiredBody(pathname, req.method, origin), {
    status: 402,
    headers: {
      'WWW-Authenticate': buildMppChallenge(pathname, amountAtomic, origin),
      'X-Payment-Required': 'true',
    },
  });
}

/**
 * Augment a 402 response from the SDK proxy with MPP challenge headers
 * and extensions.bazaar schema that x402scan requires.
 *
 * Reads the proxy body, merges in the missing fields, and returns a new response.
 */
async function augment402Response(res: NextResponse, req: NextRequest): Promise<NextResponse> {
  const pathname = req.nextUrl.pathname;
  const price = getRoutePrice(pathname);
  const amountAtomic = usdToUsdc(price);
  const origin = resolveOrigin(req);

  let body: Record<string, unknown>;
  try {
    body = await res.json();
  } catch {
    // Can't parse body — return the fallback instead
    return buildFallback402(req);
  }

  // Add extensions.bazaar if missing
  if (!body.extensions) {
    body.extensions = buildBazaarExtensions(pathname, req.method, origin);
  }

  // Ensure resource block exists (v2)
  if (!body.resource) {
    body.resource = {
      url: `${origin}${pathname}`,
      description: getEndpointMeta(pathname, req.method).description,
      mimeType: 'application/json',
    };
  }

  // Ensure outputSchema exists in each accepts entry (required by x402scan)
  const meta = getEndpointMeta(pathname, req.method);
  const accepts = body.accepts as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(accepts)) {
    for (const accept of accepts) {
      if (!accept.outputSchema) {
        accept.outputSchema = {
          input: buildInputSchemaForAccepts(pathname, req.method, origin),
          output: meta.outputSchema ?? GENERIC_OUTPUT_SCHEMA,
        };
      }
    }
  }

  const augmented = NextResponse.json(body, {
    status: 402,
    headers: Object.fromEntries(res.headers.entries()),
  });

  // Set proper MPP challenge header
  augmented.headers.set('WWW-Authenticate', buildMppChallenge(pathname, amountAtomic, origin));

  return augmented;
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
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
let warnedNoReceiveAddress = false;

/**
 * True when the deployment has a real wallet to receive x402 payments.
 * Without one, a 402 challenge would direct USDC to the zero address (an
 * unrecoverable burn) for an endpoint nobody can ever unlock, so the gate
 * fails open and the ordinary anonymous rate limits apply instead.
 */
export function isX402Configured(): boolean {
  return RECEIVE_ADDRESS.toLowerCase() !== ZERO_ADDRESS;
}

export const x402Gate: MiddlewareHandler = async (ctx) => {
  if (!ctx.isApiRoute) return ctx;

  if (!isX402Configured()) {
    if (!warnedNoReceiveAddress) {
      warnedNoReceiveAddress = true;
      console.warn(
        '[x402] X402_PAYMENT_ADDRESS is not set: paid endpoints are served without a payment challenge (anonymous rate limits still apply). Set X402_PAYMENT_ADDRESS to enable micropayments.',
      );
    }
    return ctx;
  }

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
      // Augment 402 responses with MPP challenge and Bazaar schema
      if (paymentResponse.status === 402) {
        paymentResponse = await augment402Response(paymentResponse, ctx.request);
      }

      Object.entries(ctx.headers).forEach(([k, v]) => paymentResponse.headers.set(k, v));
      paymentResponse.headers.set('X-Response-Time', `${Date.now() - ctx.startTime}ms`);

      return paymentResponse;
    }

    // Safety net: if the proxy said "next" but no payment header was provided,
    // the proxy didn't actually match this route — build a fallback 402.
    const hasPayment = ctx.request.headers.has('x-payment');
    if (!hasPayment) {
      paymentResponse = buildFallback402(ctx.request);
      Object.entries(ctx.headers).forEach(([k, v]) => paymentResponse.headers.set(k, v));
      paymentResponse.headers.set('X-Response-Time', `${Date.now() - ctx.startTime}ms`);
      return paymentResponse;
    }
  }

  return ctx;
};
