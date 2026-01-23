/**
 * x402 Payment Protocol Configuration
 *
 * This module configures the x402 payment protocol for premium API access.
 * x402 enables micropayments for API endpoints using cryptocurrency.
 *
 * Uses official @x402/* packages from Coinbase
 * @see https://x402.org
 * @see https://github.com/coinbase/x402
 */

import { NextRequest, NextResponse } from 'next/server';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import type {
  PaymentRequirements,
  PaymentRequired,
  PaymentPayload,
  SettleResponse,
  VerifyResponse,
} from '@x402/core/types';
import { registerExactEvmScheme } from '@x402/evm/exact/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Payment receiving address - set in environment
 */
export const PAYMENT_ADDRESS = process.env.X402_PAYMENT_ADDRESS as `0x${string}` | undefined;

/**
 * Facilitator URL for payment verification and settlement
 * Default: x402.org hosted facilitator
 */
export const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

/**
 * Network configuration
 * - Production: Base mainnet (eip155:8453)
 * - Development: Base Sepolia testnet (eip155:84532)
 */
export const NETWORK =
  process.env.NODE_ENV === 'production'
    ? 'eip155:8453' // Base mainnet
    : 'eip155:84532'; // Base Sepolia testnet

/**
 * Network identifiers for x402
 */
export const NETWORKS = {
  BASE_MAINNET: 'eip155:8453',
  BASE_SEPOLIA: 'eip155:84532',
} as const;

export type NetworkId = (typeof NETWORKS)[keyof typeof NETWORKS];

/**
 * USDC contract addresses by network
 */
export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  'eip155:8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base mainnet USDC
  'eip155:84532': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
};

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

/**
 * Pricing tiers for premium endpoints (in USD)
 */
export const PRICING = {
  /** Per-request pricing for detailed coin data */
  coinDetails: '0.001',

  /** Per-request pricing for market analytics */
  analytics: '0.005',

  /** Per-request pricing for portfolio valuation */
  portfolioValuation: '0.002',

  /** Per-export pricing for data downloads */
  export: '0.10',

  /** Per-hour pricing for WebSocket access */
  websocket: '0.01',

  /** Per-request for historical data (per year of data) */
  historicalPerYear: '0.02',

  /** Per-request for advanced screener queries */
  screener: '0.05',
} as const;

// Legacy pricing export for backwards compatibility
export const API_PRICING = {
  '/api/premium/coins': parseFloat(PRICING.coinDetails),
  '/api/premium/coin': parseFloat(PRICING.coinDetails),
  '/api/premium/analytics': parseFloat(PRICING.analytics),
  '/api/premium/portfolio': parseFloat(PRICING.portfolioValuation),
  '/api/premium/export': parseFloat(PRICING.export),
  '/api/premium/historical': parseFloat(PRICING.historicalPerYear),
  '/api/premium/screener': parseFloat(PRICING.screener),
} as const;

// Subscription tiers
export const API_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    requestsPerDay: 100,
    features: ['Basic market data', 'Top 100 coins', 'Rate limited'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    requestsPerDay: 10000,
    features: ['All endpoints', 'Historical data', 'Webhooks', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    requestsPerDay: -1, // Unlimited
    features: ['Unlimited requests', 'Custom endpoints', 'SLA', 'Dedicated support'],
  },
} as const;

export type ApiTier = keyof typeof API_TIERS;

// =============================================================================
// SERVER SETUP
// =============================================================================

/**
 * Creates and configures the x402 Resource Server
 * This handles payment verification and settlement
 */
export function createX402Server(): x402ResourceServer {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  const server = new x402ResourceServer(facilitatorClient);

  // Register EVM payment scheme (supports Base, Ethereum, etc.)
  registerExactEvmScheme(server);

  return server;
}

// Singleton instance
let _x402Server: x402ResourceServer | null = null;

export function getX402Server(): x402ResourceServer {
  if (!_x402Server) {
    _x402Server = createX402Server();
  }
  return _x402Server;
}

// =============================================================================
// ROUTE HELPERS
// =============================================================================

/**
 * Converts dollar string to USDC smallest unit (6 decimals)
 * e.g., "0.001" -> "1000" (0.001 USDC = 1000 units)
 */
function dollarsToCents(dollars: string): string {
  const num = parseFloat(dollars);
  return Math.round(num * 1_000_000).toString();
}

/**
 * Creates payment requirements for an endpoint
 * Returns a single PaymentRequirements object for use in arrays
 */
export function createPaymentRequirement(
  priceUsd: string,
  description: string
): PaymentRequirements {
  if (!PAYMENT_ADDRESS) {
    throw new Error('X402_PAYMENT_ADDRESS environment variable is not set');
  }

  const usdcAddress = USDC_ADDRESSES[NETWORK];
  if (!usdcAddress) {
    throw new Error(`No USDC address configured for network ${NETWORK}`);
  }

  return {
    scheme: 'exact',
    network: NETWORK as `${string}:${string}`,
    asset: usdcAddress,
    amount: dollarsToCents(priceUsd),
    payTo: PAYMENT_ADDRESS,
    maxTimeoutSeconds: 300, // 5 minutes
    extra: {
      description,
    },
  };
}

/**
 * Creates a PaymentRequired response object
 */
export function createPaymentRequired(
  priceUsd: string,
  description: string,
  resource: string
): PaymentRequired {
  return {
    x402Version: 2,
    resource: {
      url: resource,
      description,
      mimeType: 'application/json',
    },
    accepts: [createPaymentRequirement(priceUsd, description)],
  };
}

// =============================================================================
// PREMIUM ROUTE CONFIGURATION
// =============================================================================

/**
 * Get payment required response for a premium route
 */
export function getRoutePaymentRequired(pathname: string, baseUrl: string): PaymentRequired | null {
  const resource = `${baseUrl}${pathname}`;

  // Match route patterns
  if (pathname.match(/^\/api\/premium\/coins\/[^/]+$/)) {
    return createPaymentRequired(
      PRICING.coinDetails,
      'Detailed coin data with developer and social metrics',
      resource
    );
  }
  if (pathname === '/api/premium/coins') {
    return createPaymentRequired(PRICING.coinDetails, 'Batch detailed coin data', resource);
  }
  if (pathname === '/api/premium/portfolio/value') {
    return createPaymentRequired(
      PRICING.portfolioValuation,
      'Portfolio valuation with performance analytics',
      resource
    );
  }
  if (pathname.match(/^\/api\/premium\/analytics/)) {
    return createPaymentRequired(
      PRICING.analytics,
      'Advanced market analytics and insights',
      resource
    );
  }
  if (pathname.match(/^\/api\/premium\/export/)) {
    return createPaymentRequired(
      PRICING.export,
      'Export historical price data (CSV/JSON)',
      resource
    );
  }
  if (pathname === '/api/premium/screener') {
    return createPaymentRequired(
      PRICING.screener,
      'Advanced coin screener with custom filters',
      resource
    );
  }
  if (pathname.match(/^\/api\/premium\/historical/)) {
    return createPaymentRequired(
      PRICING.historicalPerYear,
      'Historical price data access',
      resource
    );
  }

  // Default premium route pricing
  if (pathname.startsWith('/api/premium')) {
    return createPaymentRequired(PRICING.coinDetails, 'Premium API access', resource);
  }

  return null;
}

// =============================================================================
// PAYMENT VERIFICATION
// =============================================================================

/**
 * Parse payment header from request
 */
function parsePaymentHeader(request: NextRequest): PaymentPayload | null {
  const paymentHeader = request.headers.get('X-PAYMENT') || request.headers.get('Payment');
  if (!paymentHeader) return null;

  try {
    // Header is base64 encoded JSON
    const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
    return JSON.parse(decoded) as PaymentPayload;
  } catch {
    return null;
  }
}

/**
 * Verify x402 payment using the facilitator
 */
export async function verifyX402Payment(
  request: NextRequest,
  paymentRequired: PaymentRequired
): Promise<{ valid: boolean; error?: string; settlementId?: string }> {
  const payment = parsePaymentHeader(request);

  if (!payment) {
    return { valid: false, error: 'No payment provided' };
  }

  // Find matching requirements from accepts array
  const matchingRequirements = paymentRequired.accepts.find(
    (req) => req.scheme === payment.accepted?.scheme && req.network === payment.accepted?.network
  );

  if (!matchingRequirements) {
    return { valid: false, error: 'No matching payment requirements' };
  }

  try {
    const server = getX402Server();
    const result = await server.verifyPayment(payment, matchingRequirements);

    if (result.isValid) {
      // Settle the payment
      const settlement = await server.settlePayment(payment, matchingRequirements);
      return {
        valid: true,
        settlementId: settlement.transaction,
      };
    }

    return { valid: false, error: result.invalidReason || 'Payment verification failed' };
  } catch (error) {
    console.error('[x402] Payment verification error:', error);
    return { valid: false, error: 'Payment verification failed' };
  }
}

// =============================================================================
// API KEY AUTHENTICATION
// =============================================================================

/**
 * Check API key and tier
 */
export async function checkApiKey(
  request: NextRequest
): Promise<{ tier: ApiTier; remaining: number } | null> {
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('api_key');

  if (!apiKey) {
    return null;
  }

  // In production, look up API key in database
  // For demo, use key prefixes to determine tier
  if (apiKey.startsWith('ent_')) {
    return { tier: 'enterprise', remaining: -1 };
  }
  if (apiKey.startsWith('pro_')) {
    return { tier: 'pro', remaining: 10000 };
  }
  if (apiKey.startsWith('free_')) {
    return { tier: 'free', remaining: 100 };
  }

  return null;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  const record = rateLimitStore.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

// =============================================================================
// 402 RESPONSE HELPERS
// =============================================================================

/**
 * Create 402 Payment Required response with x402 headers
 */
export function create402Response(paymentRequired: PaymentRequired): NextResponse {
  const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString('base64');

  return NextResponse.json(
    {
      error: 'Payment Required',
      message: 'This endpoint requires payment via x402 protocol',
      x402Version: paymentRequired.x402Version,
      resource: paymentRequired.resource,
      accepts: paymentRequired.accepts,
      docs: 'https://x402.org',
    },
    {
      status: 402,
      headers: {
        'X-PAYMENT-REQUIRED': encoded,
        'Access-Control-Expose-Headers': 'X-PAYMENT-REQUIRED, X-PAYMENT-RESPONSE',
      },
    }
  );
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Main x402 middleware for premium API routes
 */
export async function x402Middleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // Only apply to premium routes
  if (!pathname.startsWith('/api/premium')) {
    return null;
  }

  // Check if x402 is enabled
  if (!isX402Enabled()) {
    console.warn('[x402] Payment address not configured, allowing request');
    return null;
  }

  // Check for API key first (subscription model)
  const keyInfo = await checkApiKey(request);

  if (keyInfo) {
    const tierConfig = API_TIERS[keyInfo.tier];

    if (tierConfig.requestsPerDay === -1) {
      return null; // Unlimited (enterprise)
    }

    const clientId = request.headers.get('X-API-Key') || 'anonymous';
    const rateLimit = checkRateLimit(clientId, tierConfig.requestsPerDay);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded your ${tierConfig.name} tier limit`,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': tierConfig.requestsPerDay.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    return null; // Allow request with valid API key
  }

  // Get payment requirements for this route
  const paymentRequired = getRoutePaymentRequired(pathname, baseUrl);

  if (!paymentRequired) {
    return null; // No payment required for this route
  }

  // Check for x402 payment
  const paymentResult = await verifyX402Payment(request, paymentRequired);

  if (paymentResult.valid) {
    // Payment verified - add settlement info to response headers later
    return null;
  }

  // No valid payment - return 402
  return create402Response(paymentRequired);
}

// =============================================================================
// TYPES
// =============================================================================

export interface PremiumResponse<T> {
  data: T;
  meta: {
    premium: true;
    timestamp: string;
    paymentId?: string;
  };
}

/**
 * Wraps data in premium response format
 */
export function premiumResponse<T>(data: T, paymentId?: string): PremiumResponse<T> {
  return {
    data,
    meta: {
      premium: true,
      timestamp: new Date().toISOString(),
      paymentId,
    },
  };
}

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Check if x402 is enabled (payment address is configured)
 */
export function isX402Enabled(): boolean {
  return Boolean(PAYMENT_ADDRESS);
}

/**
 * Check if we're in development mode (testnet)
 */
export function isTestnet(): boolean {
  return process.env.NODE_ENV !== 'production';
}

// =============================================================================
// ENDPOINT METADATA
// =============================================================================

export interface EndpointMetadata {
  path: string;
  priceUsd: string;
  description: string;
  rateLimit?: number;
}

/**
 * Get metadata for a premium endpoint
 */
export function getEndpointMetadata(pathname: string): EndpointMetadata | null {
  if (pathname.match(/^\/api\/premium\/coins\/[^/]+$/)) {
    return {
      path: pathname,
      priceUsd: PRICING.coinDetails,
      description: 'Detailed coin data with developer and social metrics',
    };
  }
  if (pathname === '/api/premium/coins') {
    return {
      path: pathname,
      priceUsd: PRICING.coinDetails,
      description: 'Batch detailed coin data',
    };
  }
  if (pathname === '/api/premium/portfolio/value') {
    return {
      path: pathname,
      priceUsd: PRICING.portfolioValuation,
      description: 'Portfolio valuation with performance analytics',
    };
  }
  if (pathname.match(/^\/api\/premium\/analytics/)) {
    return {
      path: pathname,
      priceUsd: PRICING.analytics,
      description: 'Advanced market analytics and insights',
    };
  }
  if (pathname.match(/^\/api\/premium\/export/)) {
    return {
      path: pathname,
      priceUsd: PRICING.export,
      description: 'Export historical price data (CSV/JSON)',
    };
  }
  if (pathname === '/api/premium/screener') {
    return {
      path: pathname,
      priceUsd: PRICING.screener,
      description: 'Advanced coin screener with custom filters',
    };
  }
  if (pathname.match(/^\/api\/premium\/historical/)) {
    return {
      path: pathname,
      priceUsd: PRICING.historicalPerYear,
      description: 'Historical price data access',
    };
  }
  if (pathname.startsWith('/api/premium')) {
    return { path: pathname, priceUsd: PRICING.coinDetails, description: 'Premium API access' };
  }
  return null;
}

// =============================================================================
// HYBRID AUTH MIDDLEWARE
// =============================================================================

/**
 * Hybrid authentication middleware supporting both API keys and x402 payments
 * For use in v1 endpoints that accept either authentication method
 */
export async function hybridAuthMiddleware(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // Check for API key first (subscription model)
  const keyInfo = await checkApiKey(request);

  if (keyInfo) {
    const tierConfig = API_TIERS[keyInfo.tier];

    if (tierConfig.requestsPerDay === -1) {
      return null; // Unlimited (enterprise)
    }

    const clientId = request.headers.get('X-API-Key') || 'anonymous';
    const rateLimit = checkRateLimit(clientId, tierConfig.requestsPerDay);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded your ${tierConfig.name} tier limit`,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': tierConfig.requestsPerDay.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    return null; // Allow request with valid API key
  }

  // No API key - check if x402 is enabled and require payment
  if (!isX402Enabled()) {
    // x402 not configured, deny access without valid API key
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Valid API key required. Get one at /pricing',
      },
      { status: 401 }
    );
  }

  // Get payment requirements
  const paymentRequired = createPaymentRequired(
    PRICING.coinDetails,
    `API access: ${endpoint}`,
    `${baseUrl}${endpoint}`
  );

  // Check for x402 payment
  const paymentResult = await verifyX402Payment(request, paymentRequired);

  if (paymentResult.valid) {
    return null; // Payment verified
  }

  // No valid payment - return 402
  return create402Response(paymentRequired);
}
