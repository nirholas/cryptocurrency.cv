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
 * API Key Upgrade Endpoint
 *
 * POST /api/keys/upgrade — Upgrade an API key tier via x402 USDC payment
 *
 * This bridges the x402 payment system with the API key tier system.
 * Users pay with USDC on Base to upgrade their key from free → pro → enterprise.
 *
 * Authentication: API key via X-API-Key header
 *
 * Request body:
 * {
 *   "targetTier": "pro" | "enterprise",
 *   "months": 1                         // optional, default 1
 * }
 *
 * Flow:
 * 1. Validate current API key
 * 2. Check that upgrade is valid (can't downgrade)
 * 3. If x402 payment header present → verify payment via x402 protocol
 * 4. If no payment → return 402 with payment requirements
 * 5. On successful payment → upgrade key tier in KV
 *
 * @module api/keys/upgrade
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  validateApiKey,
  extractApiKey,
  upgradeKeyTier,
  isKvConfigured,
  API_KEY_TIERS,
} from '@/lib/api-keys';
import { API_TIERS } from '@/lib/x402/pricing';

export const runtime = 'nodejs';

const TIER_ORDER: readonly string[] = ['free', 'pro', 'enterprise'];

/**
 * GET /api/keys/upgrade — Show upgrade options and pricing
 */
export async function GET(request: NextRequest) {
  const rawKey = extractApiKey(request);
  let currentTier = 'free';

  if (rawKey && isKvConfigured()) {
    const keyData = await validateApiKey(rawKey);
    if (keyData) currentTier = keyData.tier;
  }

  const tiers = Object.entries(API_TIERS).map(([id, config]) => ({
    id,
    name: config.name,
    price: config.price,
    priceDisplay: config.priceDisplay,
    requestsPerDay: config.requestsPerDay,
    requestsPerMinute: config.requestsPerMinute,
    features: config.features,
    permissions: config.permissions,
    current: id === currentTier,
    available: TIER_ORDER.indexOf(id) > TIER_ORDER.indexOf(currentTier),
  }));

  return NextResponse.json({
    currentTier,
    tiers,
    payment: {
      method: 'x402',
      currency: 'USDC',
      network: 'Base (eip155:8453)',
      description: 'Pay with USDC on Base blockchain via x402 protocol',
      instructions: [
        'Include x-api-key header with your current key',
        'POST to /api/keys/upgrade with { "targetTier": "pro" }',
        'Include x402 payment header for the tier price',
        'Your key will be upgraded instantly upon payment verification',
      ],
    },
  });
}

/**
 * POST /api/keys/upgrade — Upgrade key tier
 */
export async function POST(request: NextRequest) {
  const rawKey = extractApiKey(request);

  if (!rawKey) {
    return NextResponse.json(
      {
        error: 'API key required',
        message: 'Provide your API key via X-API-Key header. Get a free key at /api/register',
      },
      { status: 401 },
    );
  }

  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: 'Service unavailable', message: 'KV storage not configured' },
      { status: 503 },
    );
  }

  let body: { targetTier?: string; months?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { targetTier, months = 1 } = body;

  if (!targetTier || !['pro', 'enterprise'].includes(targetTier)) {
    return NextResponse.json(
      {
        error: 'Invalid target tier',
        message: 'targetTier must be "pro" or "enterprise"',
        availableTiers: ['pro', 'enterprise'],
      },
      { status: 400 },
    );
  }

  // Validate current key
  const keyData = await validateApiKey(rawKey);
  if (!keyData) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 });
  }

  // Check that this is an upgrade, not a downgrade
  const currentIdx = TIER_ORDER.indexOf(keyData.tier);
  const targetIdx = TIER_ORDER.indexOf(targetTier);

  if (targetIdx <= currentIdx) {
    return NextResponse.json(
      {
        error: 'Invalid upgrade',
        message: `Cannot upgrade from ${keyData.tier} to ${targetTier}. Current tier is equal or higher.`,
        currentTier: keyData.tier,
      },
      { status: 400 },
    );
  }

  // Calculate price
  const tierConfig = API_TIERS[targetTier];
  const price = tierConfig.price * months;

  // Check for x402 payment header
  const paymentHeader = request.headers.get('x-402-payment') || request.headers.get('402-receipt');

  if (!paymentHeader) {
    // No payment — return 402 with payment requirements
    return NextResponse.json(
      {
        error: 'Payment Required',
        code: 'PAYMENT_REQUIRED',
        message: `Upgrade to ${tierConfig.name} requires $${price} USDC payment via x402`,
        payment: {
          protocol: 'x402',
          price: `$${price}`,
          priceUsdc: (price * 1_000_000).toString(),
          currency: 'USDC',
          network: 'eip155:8453',
          payTo: process.env.X402_RECEIVE_ADDRESS || '0x4027FdaC1a5216e264A00a5928b8366aE59cE888',
          description: `${tierConfig.name} tier upgrade for ${months} month(s)`,
          months,
          targetTier,
        },
        currentTier: keyData.tier,
        docs: 'https://docs.x402.org',
      },
      { status: 402 },
    );
  }

  // Payment header present — verify the payment amount matches the expected price.
  // The middleware validates the x402 signature, but we also verify the amount
  // to prevent underpayment or mismatched tier/price combinations.
  const expectedAmountMicro = (price * 1_000_000).toString();
  const paidAmount = request.headers.get('x-402-amount');
  if (paidAmount && paidAmount !== expectedAmountMicro) {
    return NextResponse.json(
      {
        error: 'Payment amount mismatch',
        code: 'PAYMENT_MISMATCH',
        message: `Expected ${expectedAmountMicro} micro-USDC ($${price}), received ${paidAmount}`,
      },
      { status: 402 },
    );
  }

  try {
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Perform the upgrade
    const result = await upgradeKeyTier(
      keyData.id,
      targetTier as 'pro' | 'enterprise',
      expiresAt.toISOString(),
    );

    if (!result.success) {
      return NextResponse.json({ error: 'Upgrade failed', message: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully upgraded to ${tierConfig.name} tier!`,
        key: {
          id: keyData.id,
          prefix: keyData.keyPrefix,
          previousTier: keyData.tier,
          newTier: targetTier,
          expiresAt: expiresAt.toISOString(),
        },
        tier: {
          name: tierConfig.name,
          requestsPerDay: tierConfig.requestsPerDay,
          requestsPerMinute: tierConfig.requestsPerMinute,
          features: tierConfig.features,
        },
        payment: {
          amount: `$${price}`,
          currency: 'USDC',
          months,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    console.error('[API Keys] Upgrade endpoint error:', error);
    return NextResponse.json({ error: 'Failed to process upgrade' }, { status: 500 });
  }
}
