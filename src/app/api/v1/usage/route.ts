/**
 * API v1 - Usage Endpoint
 *
 * GET /api/v1/usage - Get API key usage statistics
 *
 * Requires API key authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, API_KEY_TIERS, isKvConfigured } from '@/lib/api-keys';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Get API key from header or query param
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('api_key');

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'API key required. Get one at /developers',
      },
      { status: 401 }
    );
  }

  // Check if KV is configured
  if (!isKvConfigured()) {
    // Return demo data if KV not configured
    return NextResponse.json({
      tier: 'free',
      usageToday: 0,
      usageMonth: 0,
      limit: 100,
      remaining: 100,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      note: 'KV storage not configured - showing demo data',
    });
  }

  // Validate API key
  const keyData = await validateApiKey(apiKey);

  if (!keyData) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Invalid API key',
      },
      { status: 401 }
    );
  }

  const tierConfig = API_KEY_TIERS[keyData.tier];
  const limit = tierConfig.requestsPerDay;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - keyData.usageToday);

  // Calculate reset time (next midnight UTC)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return NextResponse.json(
    {
      tier: keyData.tier,
      usageToday: keyData.usageToday,
      usageMonth: keyData.usageMonth,
      limit: limit,
      remaining: remaining,
      resetAt: tomorrow.toISOString(),
      keyInfo: {
        id: keyData.id,
        name: keyData.name,
        createdAt: keyData.createdAt,
        lastUsedAt: keyData.lastUsedAt,
        permissions: keyData.permissions,
      },
    },
    {
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': tomorrow.getTime().toString(),
      },
    }
  );
}
