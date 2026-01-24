/**
 * API Key Upgrade Endpoint
 *
 * POST /api/upgrade - Upgrade API key tier using x402 payment
 * GET /api/upgrade - Get upgrade info and pricing
 *
 * Supports upgrading from free to pro tier via x402 micropayments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateApiKey,
  upgradeKeyTier,
  API_KEY_TIERS,
  isKvConfigured,
  extractApiKey,
} from '@/lib/api-keys';
import {
  createPaymentRequired,
  verifyX402Payment,
  create402Response,
  isX402Enabled,
  PAYMENT_ADDRESS,
  NETWORK,
} from '@/lib/x402';

export const runtime = 'nodejs';

// Upgrade pricing (in USD)
const UPGRADE_PRICING = {
  pro_monthly: {
    price: '29.00',
    tier: 'pro' as const,
    duration: 30, // days
    description: 'Pro Monthly Subscription - 10,000 requests/day',
  },
} as const;

type UpgradeType = keyof typeof UPGRADE_PRICING;

/**
 * GET /api/upgrade - Get upgrade info
 */
export async function GET(request: NextRequest) {
  const rawKey = extractApiKey(request);
  let currentTier: 'free' | 'pro' | 'enterprise' = 'free';
  let keyInfo = null;

  if (rawKey) {
    const keyData = await validateApiKey(rawKey);
    if (keyData) {
      currentTier = keyData.tier;
      keyInfo = {
        id: keyData.id,
        tier: keyData.tier,
        rateLimit: keyData.rateLimit,
        usageToday: keyData.usageToday,
        expiresAt: keyData.expiresAt,
      };
    }
  }

  return NextResponse.json({
    endpoint: '/api/upgrade',
    method: 'POST',
    description: 'Upgrade your API key tier using x402 payment',

    currentKey: keyInfo,

    upgrades: [
      {
        type: 'pro_monthly',
        name: 'Pro Monthly',
        price: '$29.00',
        tier: 'pro',
        duration: '30 days',
        features: API_KEY_TIERS.pro.features,
        requestsPerDay: API_KEY_TIERS.pro.requestsPerDay,
      },
    ],

    enterprise: {
      message: 'For Enterprise tier, please contact sales',
      email: 'enterprise@freecryptonews.org',
    },

    request: {
      headers: {
        'X-API-Key': 'Your current API key (required)',
        'X-Payment': 'x402 payment proof (required)',
      },
      body: {
        upgradeType: 'pro_monthly',
      },
    },

    paymentInfo: {
      protocol: 'x402',
      network: NETWORK,
      enabled: isX402Enabled(),
      address: PAYMENT_ADDRESS || 'Not configured',
    },

    configured: isKvConfigured() && isX402Enabled(),
  });
}

/**
 * POST /api/upgrade - Process tier upgrade with x402 payment
 */
export async function POST(request: NextRequest) {
  // Check configuration
  if (!isKvConfigured()) {
    return NextResponse.json({ error: 'API key storage not configured' }, { status: 503 });
  }

  if (!isX402Enabled()) {
    return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
  }

  // Extract and validate API key
  const rawKey = extractApiKey(request);
  if (!rawKey) {
    return NextResponse.json(
      { error: 'API key required. Include X-API-Key header.' },
      { status: 401 }
    );
  }

  const keyData = await validateApiKey(rawKey);
  if (!keyData) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 });
  }

  // Parse request body
  let body: { upgradeType?: string };
  try {
    body = await request.json();
  } catch {
    body = { upgradeType: 'pro_monthly' };
  }

  const upgradeType = (body.upgradeType || 'pro_monthly') as UpgradeType;

  // Validate upgrade type
  const upgradeConfig = UPGRADE_PRICING[upgradeType];
  if (!upgradeConfig) {
    return NextResponse.json(
      {
        error: 'Invalid upgrade type',
        available: Object.keys(UPGRADE_PRICING),
      },
      { status: 400 }
    );
  }

  // Check if already on this tier or higher
  if (keyData.tier === 'enterprise') {
    return NextResponse.json({ error: 'Already on Enterprise tier' }, { status: 400 });
  }

  if (keyData.tier === 'pro' && upgradeConfig.tier === 'pro') {
    // Check if renewal/extension
    const hasValidSubscription = keyData.expiresAt && new Date(keyData.expiresAt) > new Date();
    if (hasValidSubscription) {
      // Allow renewal - will extend expiry
    }
  }

  // Create payment requirement
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const paymentRequired = createPaymentRequired(
    upgradeConfig.price,
    upgradeConfig.description,
    `${baseUrl}/api/upgrade`
  );

  // Check for x402 payment
  const paymentHeader = request.headers.get('X-PAYMENT') || request.headers.get('Payment');

  if (!paymentHeader) {
    // No payment provided - return 402 with payment requirements
    return create402Response(paymentRequired);
  }

  // Verify the payment
  const paymentResult = await verifyX402Payment(request, paymentRequired);

  if (!paymentResult.valid) {
    return NextResponse.json(
      {
        error: 'Payment verification failed',
        details: paymentResult.error,
      },
      { status: 402 }
    );
  }

  // Calculate new expiry date
  let expiresAt: Date;
  if (keyData.expiresAt && new Date(keyData.expiresAt) > new Date()) {
    // Extend existing subscription
    expiresAt = new Date(keyData.expiresAt);
    expiresAt.setDate(expiresAt.getDate() + upgradeConfig.duration);
  } else {
    // New subscription
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + upgradeConfig.duration);
  }

  // Upgrade the key
  const upgradeResult = await upgradeKeyTier(
    keyData.id,
    upgradeConfig.tier,
    expiresAt.toISOString()
  );

  if (!upgradeResult.success) {
    return NextResponse.json(
      {
        error: 'Failed to upgrade tier',
        details: upgradeResult.error,
      },
      { status: 500 }
    );
  }

  // Return success response
  return NextResponse.json({
    success: true,
    message: `Successfully upgraded to ${upgradeConfig.tier} tier!`,

    key: {
      id: upgradeResult.data?.id,
      tier: upgradeResult.data?.tier,
      rateLimit: upgradeResult.data?.rateLimit,
      permissions: upgradeResult.data?.permissions,
      expiresAt: upgradeResult.data?.expiresAt,
    },

    payment: {
      settlementId: paymentResult.settlementId,
      amount: `$${upgradeConfig.price}`,
      description: upgradeConfig.description,
    },

    subscription: {
      startsAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      daysRemaining: upgradeConfig.duration,
      autoRenew: false,
    },
  });
}
