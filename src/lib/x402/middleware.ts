/**
 * x402 Hybrid Authentication Middleware for Next.js
 *
 * SINGLE SOURCE OF TRUTH for hybrid authentication supporting:
 * 1. API key authentication (subscription users with distributed rate limits via Vercel KV)
 * 2. x402 micropayment protocol (pay-per-request for anyone)
 *
 * Uses the official x402 `onProtectedRequest` hook pattern from @x402/core/server.
 *
 * @see https://github.com/coinbase/x402
 * @see https://docs.x402.org/advanced/hybrid-auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentProxy } from '@x402/next';
import { withX402 as withX402Next } from '@x402/next';
import type { HTTPRequestContext, RouteConfig as X402RouteConfig } from '@x402/core/server';
import { x402Server } from './server';
import { createRoutes, getRoutePrice } from './routes';
import { validateApiKey, checkRateLimit as checkKvRateLimit, type ApiKeyData } from '@/lib/api-keys';
import { API_TIERS, API_PRICING, PREMIUM_PRICING, type PremiumEndpoint } from './pricing';
import { PAYMENT_ADDRESS, CURRENT_NETWORK, getAcceptedAssets, IS_PRODUCTION } from './config';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Result type from onProtectedRequest hook
 * Following official x402 SDK signature
 */
export type ProtectedRequestResult =
  | void                                   // Continue to x402 payment verification
  | { grantAccess: true }                  // Bypass payment - API key authenticated
  | { abort: true; reason: string };       // Reject request with 403

/**
 * Context passed to the hybrid auth handler
 */
export interface HybridAuthContext {
  request: NextRequest;
  endpoint: string;
  apiKey: string | null;
  paymentHeader: string | null;
}

/**
 * Result from hybrid auth middleware
 */
export interface HybridAuthResult {
  authenticated: boolean;
  method: 'api-key' | 'x402-payment' | 'none';
  keyData?: ApiKeyData;
  rateLimitHeaders?: Record<string, string>;
  error?: {
    status: number;
    message: string;
    code: string;
  };
}

// =============================================================================
// CORE HYBRID AUTH HANDLER (for onProtectedRequest hook)
// =============================================================================

/**
 * Handle protected request using official x402 hook pattern
 *
 * This function implements the hybrid auth logic that can be used with
 * x402HTTPResourceServer.onProtectedRequest() hook.
 *
 * Flow:
 * 1. Extract API key from request headers/params
 * 2. If API key present:
 *    a. Validate against Vercel KV (real validation, not prefix-based)
 *    b. Check rate limits (distributed via Vercel KV)
 *    c. Return { grantAccess: true } if valid and within limits
 *    d. Return { abort: true, reason } if invalid or rate limited
 * 3. If no API key, return void to continue to x402 payment verification
 *
 * @example
 * ```typescript
 * // In http-server.ts
 * httpServer.onProtectedRequest(async (ctx, routeConfig) => {
 *   return handleProtectedRequest(ctx, routeConfig);
 * });
 * ```
 */
export async function handleProtectedRequest(
  ctx: HTTPRequestContext,
  _routeConfig: X402RouteConfig
): Promise<ProtectedRequestResult> {
  // Extract API key from headers using the adapter
  const apiKey = extractApiKeyFromAdapter(ctx.adapter);

  // No API key - continue to x402 payment verification
  if (!apiKey) {
    if (!IS_PRODUCTION) {
      console.log('[x402] No API key provided, falling through to payment verification');
    }
    return; // void = continue to x402 payment
  }

  // Validate API key format
  if (!apiKey.startsWith('cda_')) {
    return {
      abort: true,
      reason: 'Invalid API key format. Keys must start with "cda_"',
    };
  }

  // Validate against Vercel KV (real validation)
  const keyData = await validateApiKey(apiKey);

  if (!keyData) {
    return {
      abort: true,
      reason: 'Invalid or inactive API key. Please check your key or get a new one at /api-keys',
    };
  }

  // Check rate limits using distributed Vercel KV
  const rateLimit = await checkKvRateLimit(keyData);

  if (!rateLimit.allowed) {
    const tierName = API_TIERS[keyData.tier]?.name || keyData.tier;
    const resetTime = new Date(rateLimit.resetAt).toISOString();

    return {
      abort: true,
      reason: `Rate limit exceeded for ${tierName} tier. Limit: ${rateLimit.limit}/day. Resets at ${resetTime}. Upgrade at /pricing or use x402 pay-per-request.`,
    };
  }

  // Valid API key with available rate limit - grant access
  if (!IS_PRODUCTION) {
    console.log('[x402] API key authenticated:', {
      tier: keyData.tier,
      remaining: rateLimit.remaining,
      keyPrefix: keyData.keyPrefix,
    });
  }

  return { grantAccess: true };
}

// =============================================================================
// HYBRID AUTH MIDDLEWARE (for API routes)
// =============================================================================

/**
 * Hybrid authentication middleware for Next.js API routes
 *
 * Supports both API key authentication and x402 payments.
 * Uses Vercel KV for distributed API key validation and rate limiting.
 *
 * @param request - Next.js request object
 * @param endpoint - API endpoint path (e.g., '/api/v1/coins')
 * @returns NextResponse if auth failed, null if auth succeeded
 *
 * @example
 * ```typescript
 * // In API route
 * import { hybridAuthMiddleware } from '@/lib/x402';
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await hybridAuthMiddleware(request, '/api/v1/coins');
 *   if (authResult) return authResult; // Returns 402, 401, or 429
 *
 *   // Auth succeeded - process request
 *   return NextResponse.json({ data: [...] });
 * }
 * ```
 */
export async function hybridAuthMiddleware(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  // Check if this is a priced endpoint
  const price = getRoutePrice('GET', endpoint);

  // 1. Extract API key from request
  const apiKey =
    request.headers.get('X-API-Key') ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    request.nextUrl.searchParams.get('api_key');

  if (apiKey) {
    // Validate API key format
    if (!apiKey.startsWith('cda_')) {
      return NextResponse.json(
        {
          error: 'Invalid API Key Format',
          message: 'API keys must start with "cda_"',
          code: 'INVALID_KEY_FORMAT',
          docs: '/docs/api#authentication',
        },
        { status: 401 }
      );
    }

    // Validate against Vercel KV (real validation, not prefix-based)
    const keyData = await validateApiKey(apiKey);

    if (!keyData) {
      return NextResponse.json(
        {
          error: 'Invalid API Key',
          message: 'The provided API key is invalid, inactive, or expired',
          code: 'INVALID_API_KEY',
          docs: '/docs/api#authentication',
          getKey: '/api-keys',
        },
        { status: 401 }
      );
    }

    // Check rate limits using distributed Vercel KV
    const rateLimit = await checkKvRateLimit(keyData);

    if (!rateLimit.allowed) {
      const tierConfig = API_TIERS[keyData.tier];

      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: `You have exceeded your ${tierConfig.name} tier limit of ${rateLimit.limit} requests/day`,
          code: 'RATE_LIMIT_EXCEEDED',
          tier: keyData.tier,
          limit: rateLimit.limit,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
          upgrade: '/pricing',
          alternative: 'Use x402 pay-per-request for unlimited access',
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

    // Valid API key with available rate limit - allow request
    // Return null to indicate success
    return null;
  }

  // 2. Check for x402 payment signature
  const paymentSignature =
    request.headers.get('X-Payment') ||
    request.headers.get('PAYMENT-SIGNATURE') ||
    request.headers.get('Payment');

  if (paymentSignature) {
    // Payment signature present - let x402 middleware handle verification
    // The paymentProxy middleware will verify the signature and process payment
    return null;
  }

  // 3. No authentication provided
  // For non-priced endpoints, allow through
  if (!price) {
    return null;
  }

  // For priced endpoints, return 402 Payment Required
  return create402Response(endpoint, price);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract API key from HTTPAdapter (for onProtectedRequest hook)
 * Uses the adapter's getHeader method which is the official SDK pattern
 */
function extractApiKeyFromAdapter(adapter: { getHeader(name: string): string | undefined }): string | null {
  // X-API-Key header (preferred)
  const xApiKey = adapter.getHeader('X-API-Key');
  if (xApiKey) return xApiKey;

  // Authorization: Bearer token (if it's an API key)
  const authHeader = adapter.getHeader('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token.startsWith('cda_')) return token;
  }

  return null;
}

/**
 * Extract API key from request headers (for hybridAuthMiddleware)
 * Supports multiple header formats for compatibility
 */
function extractApiKey(headers: Headers): string | null {
  // X-API-Key header (preferred)
  const xApiKey = headers.get('X-API-Key');
  if (xApiKey) return xApiKey;

  // Authorization: Bearer token (if it's an API key)
  const authHeader = headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token.startsWith('cda_')) return token;
  }

  return null;
}

/**
 * Get rate limit headers for response (for API key authentication)
 * 
 * @deprecated Use getRateLimitHeaders from rate-limit.ts with RateLimitResult instead
 */
export function getApiKeyRateLimitHeaders(keyData: ApiKeyData, remaining: number, resetAt: number): Record<string, string> {
  const tierConfig = API_TIERS[keyData.tier];

  return {
    'X-RateLimit-Limit': tierConfig.requestsPerDay.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetAt.toString(),
    'X-API-Tier': keyData.tier,
    'X-Auth-Method': 'api-key',
  };
}

// =============================================================================
// 402 RESPONSE GENERATION
// =============================================================================

/**
 * Create a 402 Payment Required response
 *
 * Follows x402 protocol specification with multi-chain support.
 * Includes both x402 payment info and subscription alternatives.
 */
export function create402Response(endpoint: string, price: string): NextResponse {
  const requestId = crypto.randomUUID();
  const priceNum = parseFloat(price.replace('$', ''));
  const priceInUSDC = Math.round(priceNum * 1e6); // USDC has 6 decimals

  // Get accepted assets for current network
  const assets = getAcceptedAssets();
  const accepts = assets.map((asset) => ({
    scheme: 'exact' as const,
    network: asset.network,
    maxAmountRequired: priceInUSDC.toString(),
    asset: asset.address,
    payTo: PAYMENT_ADDRESS,
    resource: endpoint,
    description: `API access: ${endpoint}`,
    mimeType: 'application/json',
    paymentNonce: requestId,
  }));

  const paymentRequirements = {
    x402Version: 2,
    accepts,
    resource: {
      endpoint,
      mimeType: 'application/json',
      description: `Crypto news API: ${endpoint}`,
    },
  };

  return NextResponse.json(
    {
      error: 'Payment Required',
      code: 'PAYMENT_REQUIRED',
      message: `This endpoint requires payment of ${price} USD`,
      price: price,
      priceUSDC: priceInUSDC,
      endpoint: endpoint,
      supportedNetworks: accepts.map((a) => a.network),
      authentication: {
        methods: [
          {
            type: 'api-key',
            description: 'Use an API key for subscription-based access with rate limits',
            tiers: Object.values(API_TIERS).map((t) => ({
              name: t.name,
              price: t.priceDisplay,
              requests: t.requestsPerDay,
            })),
            getKey: '/api-keys',
          },
          {
            type: 'x402',
            description: 'Pay per request with USDC - no rate limits',
            networks: ['Base Mainnet', 'Base Sepolia'],
            price: price,
            docs: 'https://docs.x402.org',
          },
        ],
      },
      x402: paymentRequirements,
    },
    {
      status: 402,
      headers: {
        'X-Request-Id': requestId,
        'X-Payment-Required': 'true',
        'X-Price-USD': price,
        'X-Network': CURRENT_NETWORK,
        'WWW-Authenticate': `X402 realm="${endpoint}"`,
        'X-X402-Version': '2',
        'X-Accepts-Networks': 'eip155:8453,eip155:84532',
      },
    }
  );
}

/**
 * Alias for create402Response for backwards compatibility
 */
export const createPaymentRequiredResponse = create402Response;

// =============================================================================
// PAYMENT PROXY MIDDLEWARE
// =============================================================================

/**
 * Get the x402 payment proxy middleware for Next.js
 *
 * Use this in your middleware.ts file to handle x402 payments globally.
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { getPaymentMiddleware } from '@/lib/x402';
 *
 * export default getPaymentMiddleware();
 * ```
 */
export function getPaymentMiddleware() {
  return paymentProxy(createRoutes() as unknown as Parameters<typeof paymentProxy>[0], x402Server);
}

// =============================================================================
// ROUTE WRAPPERS
// =============================================================================

/**
 * Wrap a route handler with x402 payment protection
 *
 * Uses the official @x402/next withX402 wrapper for full protocol support.
 *
 * @example
 * ```typescript
 * import { withX402 } from '@/lib/x402';
 *
 * export const GET = withX402('/api/premium/ai/analyze', async (request) => {
 *   // Handle the premium request
 *   return NextResponse.json({ result: '...' });
 * });
 * ```
 */
export function withX402<
  T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
>(endpoint: PremiumEndpoint, handler: T): T {
  const config = PREMIUM_PRICING[endpoint];
  if (!config) {
    // Not a premium endpoint, return handler as-is
    return handler;
  }

  // Create route config for @x402/next (v2 SDK format)
  const routeConfig = {
    accepts: {
      scheme: 'exact' as const,
      payTo: PAYMENT_ADDRESS,
      price: `$${config.price}`,
      network: CURRENT_NETWORK,
    },
    description: config.description,
  };

  // withX402Next requires: (handler, routeConfig, server)
  return withX402Next(handler, routeConfig, x402Server) as unknown as T;
}

// =============================================================================
// PREMIUM MIDDLEWARE (for /api/premium routes)
// =============================================================================

/**
 * Premium endpoint middleware with hybrid auth
 *
 * @param request - Next.js request
 * @param endpoint - Premium endpoint path
 * @returns NextResponse if auth fails, null if auth succeeds
 */
export async function x402PremiumMiddleware(
  request: NextRequest,
  endpoint: PremiumEndpoint
): Promise<NextResponse | null> {
  const config = PREMIUM_PRICING[endpoint];
  if (!config) {
    // Not a configured premium endpoint
    return null;
  }

  // Use the hybrid auth middleware
  const authResult = await hybridAuthMiddleware(request, endpoint);
  if (authResult) return authResult;

  // Auth succeeded
  return null;
}

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

/**
 * Get route configuration for @x402/next
 */
export function getRouteConfigForEndpoint(endpoint: string) {
  const apiPrice = API_PRICING[endpoint as keyof typeof API_PRICING];
  const premiumConfig = PREMIUM_PRICING[endpoint];

  const price = premiumConfig?.price
    ? `$${premiumConfig.price}`
    : apiPrice || null;

  if (!price) return null;

  return {
    payTo: PAYMENT_ADDRESS,
    price,
    network: CURRENT_NETWORK,
    description: premiumConfig?.description || `API access: ${endpoint}`,
    accepts: {
      scheme: 'exact' as const,
      price,
      network: CURRENT_NETWORK,
      payTo: PAYMENT_ADDRESS,
    },
  };
}

// =============================================================================
// ROUTE MATCHER
// =============================================================================

/**
 * Protected routes matcher for Next.js middleware config
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
