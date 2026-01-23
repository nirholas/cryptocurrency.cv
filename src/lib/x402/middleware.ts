/**
 * x402 Payment Middleware for Next.js
 *
 * This middleware intercepts requests to premium API endpoints
 * and enforces payment requirements using the x402 protocol.
 *
 * Authentication flow:
 * 1. Check for valid API key → Use subscription tier rate limits
 * 2. Check for x402 payment signature → Verify and allow
 * 3. No auth → Return 402 Payment Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentProxy } from '@x402/next';
import { x402Server } from './server';
import { createRoutes, isPricedRoute, getRoutePrice } from './routes';
import { getTierFromApiKey, checkTierRateLimit } from './rate-limit';
import { API_TIERS, API_PRICING } from './pricing';
import { PAYMENT_ADDRESS, CURRENT_NETWORK } from './config';

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Get the x402 payment proxy middleware
 * Use this in your middleware.ts file
 */
export function getPaymentMiddleware() {
  // Cast routes to expected type - RouteConfig is compatible with x402 expectations
  return paymentProxy(createRoutes() as unknown as Parameters<typeof paymentProxy>[0], x402Server);
}

// =============================================================================
// HYBRID MIDDLEWARE (API Key + x402)
// =============================================================================

/**
 * Hybrid authentication middleware
 * Supports both API key authentication and x402 payments
 *
 * @example
 * ```ts
 * // In API route
 * import { hybridAuthMiddleware } from '@/lib/x402/middleware';
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await hybridAuthMiddleware(request, '/api/v1/coins');
 *   if (authResult) return authResult; // Returns 402 or 429 if auth fails
 *
 *   // Proceed with request...
 * }
 * ```
 */
export async function hybridAuthMiddleware(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  // 1. Check for API key
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('api_key');

  if (apiKey) {
    const tier = getTierFromApiKey(apiKey);

    if (tier) {
      // Valid API key - check rate limits
      const rateLimit = checkTierRateLimit(apiKey, tier);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate Limit Exceeded',
            message: `You have exceeded your ${API_TIERS[tier].name} tier limit`,
            tier: tier,
            limit: rateLimit.limit,
            resetAt: new Date(rateLimit.resetAt).toISOString(),
            upgrade: 'https://crypto-data-aggregator.vercel.app/pricing',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimit.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimit.resetAt.toString(),
              'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Rate limit OK - allow request
      // Add rate limit headers to response later
      return null;
    }

    // Invalid API key
    return NextResponse.json(
      {
        error: 'Invalid API Key',
        message: 'The provided API key is invalid or expired',
        docs: 'https://crypto-data-aggregator.vercel.app/docs/api',
      },
      { status: 401 }
    );
  }

  // 2. Check for x402 payment signature
  const paymentSignature =
    request.headers.get('X-Payment') || request.headers.get('PAYMENT-SIGNATURE');

  if (paymentSignature) {
    // Payment signature present - let x402 middleware handle verification
    // This will be handled by the paymentProxy middleware
    return null;
  }

  // 3. No authentication - return 402 Payment Required
  const price = getRoutePrice('GET', endpoint);

  if (!price) {
    // Not a priced endpoint - allow through
    return null;
  }

  return create402Response(endpoint, price);
}

// =============================================================================
// 402 RESPONSE GENERATION
// =============================================================================

/**
 * Create a 402 Payment Required response
 * Follows x402 protocol specification
 */
export function create402Response(endpoint: string, price: string): NextResponse {
  const requestId = crypto.randomUUID();
  const priceNum = parseFloat(price.replace('$', ''));
  const priceInUSDC = Math.round(priceNum * 1e6); // USDC has 6 decimals

  const paymentRequirements = {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact',
        network: CURRENT_NETWORK,
        maxAmountRequired: priceInUSDC.toString(),
        resource: endpoint,
        description: `API access: ${endpoint}`,
        mimeType: 'application/json',
        payTo: PAYMENT_ADDRESS,
        paymentNonce: requestId,
        // Token info (USDC on Base)
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    ],
  };

  return NextResponse.json(
    {
      error: 'Payment Required',
      message: `This endpoint requires payment of ${price} USD`,
      price: price,
      priceUSDC: priceInUSDC,
      endpoint: endpoint,
      paymentMethods: [
        {
          type: 'x402',
          description: 'Pay per request with USDC on Base',
          network: CURRENT_NETWORK,
          docs: 'https://docs.x402.org',
        },
        {
          type: 'subscription',
          description: 'Subscribe for monthly API access',
          tiers: Object.values(API_TIERS).map((t) => ({
            name: t.name,
            price: t.priceDisplay,
            requests: t.rateLimit,
          })),
          url: 'https://crypto-data-aggregator.vercel.app/pricing',
        },
      ],
      x402: paymentRequirements,
    },
    {
      status: 402,
      headers: {
        'X-Payment-Required': 'true',
        'X-Price-USD': price,
        'X-Network': CURRENT_NETWORK,
        'WWW-Authenticate': `X402 realm="${endpoint}"`,
      },
    }
  );
}

// =============================================================================
// ROUTE MATCHER
// =============================================================================

/**
 * Matcher config for Next.js middleware
 * Only run on premium API routes
 */
export const PROTECTED_ROUTES = Object.keys(API_PRICING).map((p) => p + '/:path*');

export const middlewareConfig = {
  matcher: [
    '/api/v1/coins/:path*',
    '/api/v1/coin/:path*',
    '/api/v1/market-data/:path*',
    '/api/v1/trending/:path*',
    '/api/v1/defi/:path*',
    '/api/v1/export/:path*',
    '/api/v1/historical/:path*',
    '/api/v1/correlation/:path*',
    '/api/v1/screener/:path*',
    '/api/v1/sentiment/:path*',
    '/api/v1/alerts/:path*',
    '/api/v1/webhooks/:path*',
    '/api/v1/portfolio/:path*',
  ],
};
