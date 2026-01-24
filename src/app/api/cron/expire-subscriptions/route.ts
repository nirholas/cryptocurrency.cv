/**
 * Cron Job: Expire Subscriptions
 *
 * GET /api/cron/expire-subscriptions - Check and downgrade expired subscriptions
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron, Railway Cron)
 * to automatically downgrade pro/enterprise keys to free tier when their
 * subscription expires.
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkSubscriptionExpiry,
  downgradeKeyToFree,
  getKeyById,
  isKvConfigured,
} from '@/lib/api-keys';

export const runtime = 'nodejs';

// Vercel Cron configuration
export const maxDuration = 60; // 60 seconds max execution time

/**
 * Verify cron request authorization
 */
function verifyCronAuth(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check query param (for simple cron services)
  const querySecret = request.nextUrl.searchParams.get('secret');
  if (querySecret === cronSecret) {
    return true;
  }

  return false;
}

/**
 * GET /api/cron/expire-subscriptions
 *
 * Called by cron job to check and process expired subscriptions
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check configuration
  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: 'KV storage not configured', skipped: true },
      { status: 200 }
    );
  }

  const startTime = Date.now();
  const results = {
    checked: 0,
    expired: 0,
    downgraded: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Find expired keys
    const expiredKeyIds = await checkSubscriptionExpiry();
    results.expired = expiredKeyIds.length;

    // Process each expired key
    for (const keyId of expiredKeyIds) {
      results.checked++;

      try {
        // Get key info for logging
        const keyData = await getKeyById(keyId);
        const previousTier = keyData?.tier || 'unknown';

        // Downgrade to free tier
        const success = await downgradeKeyToFree(keyId);

        if (success) {
          results.downgraded++;
          console.log(`[Cron] Downgraded key ${keyId} from ${previousTier} to free`);
        } else {
          results.failed++;
          results.errors.push(`Failed to downgrade ${keyId}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${keyId}: ${error}`);
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.expired} expired subscriptions`,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Subscription expiry check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process expired subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/expire-subscriptions
 *
 * Alternative method for cron services that use POST
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
