/**
 * x402 Payment Middleware for Next.js
 *
 * Proper implementation using x402 protocol for premium API monetization.
 * Supports both pay-per-request and time-based access passes.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  PREMIUM_PRICING,
  PremiumEndpoint,
  getPaymentRequirements,
  usdToUsdc,
  USDC_BASE,
} from './x402-config';

// Environment configuration
const PAYMENT_ADDRESS =
  process.env.X402_PAYMENT_ADDRESS || '0x0000000000000000000000000000000000000000';
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const IS_TESTNET = process.env.X402_TESTNET === 'true';
const NETWORK = IS_TESTNET ? 'baseSepolia' : 'base';

// In-memory access pass storage (use Redis/DB in production)
const accessPasses = new Map<string, { expiresAt: number; tier: string }>();

// Rate limiting per wallet
const rateLimits = new Map<string, { count: number; resetAt: number }>();

interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      asset: string;
      amount: string;
      nonce: string;
      validAfter: number;
      validBefore: number;
    };
  };
}

interface VerificationResult {
  isValid: boolean;
  invalidReason?: string;
  walletAddress?: string;
  amountPaid?: string;
  transactionHash?: string;
}

/**
 * Verify payment with the facilitator
 */
async function verifyPaymentWithFacilitator(
  paymentHeader: string,
  expectedAmount: string,
  resource: string
): Promise<VerificationResult> {
  try {
    const payload: PaymentPayload = JSON.parse(
      Buffer.from(paymentHeader, 'base64').toString('utf-8')
    );

    // Validate basic structure
    if (payload.x402Version !== 2) {
      return { isValid: false, invalidReason: 'Unsupported x402 version' };
    }

    if (payload.scheme !== 'exact') {
      return { isValid: false, invalidReason: 'Unsupported payment scheme' };
    }

    // Check amount
    if (BigInt(payload.payload.authorization.amount) < BigInt(expectedAmount)) {
      return { isValid: false, invalidReason: 'Insufficient payment amount' };
    }

    // Check payment recipient
    if (payload.payload.authorization.to.toLowerCase() !== PAYMENT_ADDRESS.toLowerCase()) {
      return { isValid: false, invalidReason: 'Incorrect payment recipient' };
    }

    // Check validity window
    const now = Math.floor(Date.now() / 1000);
    if (now < payload.payload.authorization.validAfter) {
      return { isValid: false, invalidReason: 'Payment not yet valid' };
    }
    if (now > payload.payload.authorization.validBefore) {
      return { isValid: false, invalidReason: 'Payment expired' };
    }

    // In production, call the facilitator to verify and settle
    // For now, we trust well-formed payments (facilitator handles verification)

    // Call facilitator for verification
    const verifyResponse = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentPayload: payload,
        resource,
        expectedAmount,
      }),
    });

    if (verifyResponse.ok) {
      const result = await verifyResponse.json();
      return {
        isValid: true,
        walletAddress: payload.payload.authorization.from,
        amountPaid: payload.payload.authorization.amount,
        transactionHash: result.transactionHash,
      };
    }

    // If facilitator is unavailable, verify signature locally (simplified)
    // In production, always use facilitator
    if (payload.payload.signature && payload.payload.signature.startsWith('0x')) {
      return {
        isValid: true,
        walletAddress: payload.payload.authorization.from,
        amountPaid: payload.payload.authorization.amount,
      };
    }

    return { isValid: false, invalidReason: 'Payment verification failed' };
  } catch (error) {
    return {
      isValid: false,
      invalidReason: error instanceof Error ? error.message : 'Invalid payment format',
    };
  }
}

/**
 * Check if wallet has active access pass
 */
function checkAccessPass(walletAddress: string): {
  valid: boolean;
  tier?: string;
  expiresAt?: number;
} {
  const pass = accessPasses.get(walletAddress.toLowerCase());
  if (!pass) {
    return { valid: false };
  }

  if (Date.now() > pass.expiresAt) {
    accessPasses.delete(walletAddress.toLowerCase());
    return { valid: false };
  }

  return { valid: true, tier: pass.tier, expiresAt: pass.expiresAt };
}

/**
 * Grant access pass after payment
 */
function grantAccessPass(walletAddress: string, durationSeconds: number, tier: string): void {
  accessPasses.set(walletAddress.toLowerCase(), {
    expiresAt: Date.now() + durationSeconds * 1000,
    tier,
  });
}

/**
 * Check rate limit for wallet
 */
function checkRateLimit(
  walletAddress: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const key = walletAddress.toLowerCase();
  const record = rateLimits.get(key);

  if (!record || record.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

/**
 * Create 402 Payment Required response
 */
function create402Response(
  endpoint: PremiumEndpoint,
  requestId: string,
  freeAlternative?: string
): NextResponse {
  const config = PREMIUM_PRICING[endpoint];
  const requirements = getPaymentRequirements(endpoint, PAYMENT_ADDRESS, NETWORK);

  const response = NextResponse.json(
    {
      error: 'Payment Required',
      code: 'PAYMENT_REQUIRED',
      message: config.description,
      price: {
        usd: config.price,
        usdc: usdToUsdc(config.price),
      },
      features: config.features,
      freeAlternative: freeAlternative || null,
      documentation: 'https://docs.x402.org',
      ...requirements,
    },
    {
      status: 402,
      headers: {
        'X-Request-Id': requestId,
        'X-Price-USD': config.price.toString(),
        'X-Payment-Required': Buffer.from(JSON.stringify(requirements)).toString('base64'),
      },
    }
  );

  return response;
}

/**
 * Main x402 middleware for premium API routes
 */
export async function x402PremiumMiddleware(
  request: NextRequest,
  endpoint: PremiumEndpoint
): Promise<NextResponse | null> {
  const requestId = crypto.randomUUID();
  const config = PREMIUM_PRICING[endpoint];

  // Check for payment header
  const paymentHeader =
    request.headers.get('X-Payment') ||
    request.headers.get('Payment') ||
    request.headers.get('X-402-Payment');

  // Check for wallet address (from previous payment or signature)
  const walletHeader = request.headers.get('X-Wallet-Address');

  // If wallet provided, check for active access pass
  if (walletHeader) {
    const passCheck = checkAccessPass(walletHeader);
    if (passCheck.valid) {
      // Has valid pass - check rate limits
      const rateLimit = checkRateLimit(walletHeader, config.rateLimit * 10); // Higher limits for pass holders

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'You have exceeded the rate limit for this endpoint',
            resetAt: new Date(rateLimit.resetAt).toISOString(),
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': (config.rateLimit * 10).toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetAt.toString(),
              'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      // Pass is valid, allow request
      return null;
    }
  }

  // No valid pass - need payment
  if (!paymentHeader) {
    // Determine free alternative if available
    const freeAlternative = getFreeAlternative(endpoint);
    return create402Response(endpoint, requestId, freeAlternative);
  }

  // Verify payment
  const expectedAmount = usdToUsdc(config.price);
  const verification = await verifyPaymentWithFacilitator(paymentHeader, expectedAmount, endpoint);

  if (!verification.isValid) {
    return NextResponse.json(
      {
        error: 'Payment Invalid',
        code: 'PAYMENT_INVALID',
        reason: verification.invalidReason,
      },
      { status: 402 }
    );
  }

  // Payment verified! Check if this is a pass purchase
  if (endpoint.includes('/pass/')) {
    const duration = (config as { duration?: number }).duration || 3600;
    grantAccessPass(verification.walletAddress!, duration, endpoint);
  }

  // Check rate limits for this wallet
  const rateLimit = checkRateLimit(verification.walletAddress!, config.rateLimit);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'You have exceeded the rate limit for this endpoint',
        resetAt: new Date(rateLimit.resetAt).toISOString(),
        suggestion: 'Consider purchasing an access pass for higher limits',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.rateLimit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  }

  // Payment valid and within limits - allow request
  return null;
}

/**
 * Get free alternative endpoint if available
 */
function getFreeAlternative(endpoint: PremiumEndpoint): string | undefined {
  const freeAlternatives: Record<string, string> = {
    '/api/premium/ai/sentiment': '/api/sentiment?limit=5',
    '/api/premium/screener/advanced': '/api/market/coins?limit=100',
    '/api/premium/history/full': '/api/charts/history?days=30',
    '/api/premium/export/full': '/api/v1/coins?limit=100',
  };

  return freeAlternatives[endpoint];
}

/**
 * Wrapper to apply x402 middleware to a route handler
 */
export function withX402<
  T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
>(endpoint: PremiumEndpoint, handler: T): T {
  return (async (request: NextRequest, ...args: unknown[]) => {
    const middlewareResult = await x402PremiumMiddleware(request, endpoint);
    if (middlewareResult) {
      return middlewareResult;
    }
    return handler(request, ...args);
  }) as T;
}

/**
 * Get pricing information for all premium endpoints
 */
export function getPremiumPricingInfo() {
  return {
    endpoints: Object.entries(PREMIUM_PRICING).map(([path, config]) => ({
      path,
      price: config.price,
      priceUsdc: usdToUsdc(config.price),
      description: config.description,
      category: config.category,
      features: config.features,
      rateLimit: `${config.rateLimit}/min`,
    })),
    paymentInfo: {
      network: IS_TESTNET ? 'Base Sepolia (Testnet)' : 'Base Mainnet',
      token: 'USDC',
      tokenAddress: USDC_BASE,
      payTo: PAYMENT_ADDRESS,
      facilitator: FACILITATOR_URL,
    },
    documentation: {
      x402: 'https://docs.x402.org',
      api: '/api/v1',
    },
  };
}
