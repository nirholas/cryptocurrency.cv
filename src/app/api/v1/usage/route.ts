/**
 * API v1 - Usage Endpoint
 *
 * GET /api/v1/usage - Get API key usage statistics
 *
 * Requires API key authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, API_KEY_TIERS, isKvConfigured } from '@/lib/api-keys';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Get API key from header or query param
  const apiKey = request.headers.get('X-API-Key') || request.nextUrl.searchParams.get('api_key');

  if (!apiKey) {
    return ApiError.unauthorized('API key required. Get one at /developers');
  }

  // Check if KV is configured
  if (!isKvConfigured()) {
    logger.error('KV storage not configured');
    return ApiError.serviceUnavailable('KV storage is required for API key validation');
  }

  try {
    logger.info('Validating API key and fetching usage');

    // Validate API key
    const keyData = await validateApiKey(apiKey);

    if (!keyData) {
      return ApiError.unauthorized('Invalid API key');
    }

    const tierConfig = API_KEY_TIERS[keyData.tier];
    const limit = tierConfig.requestsPerDay;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - keyData.usageToday);

    // Calculate reset time (next midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

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
  } catch (error) {
    logger.error('Failed to fetch usage data', error);
    return ApiError.internal('Failed to fetch usage data', error);
  }
}
