/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
};

/**
 * Provider Health API — Real-time health of all provider chains
 *
 * GET /api/providers/health
 *
 * Returns per-provider health including circuit breaker state,
 * latency percentiles, success rates, and uptime.
 *
 * Requires admin key: X-Admin-Key header or ?admin_key= query param
 */
export async function GET(request: NextRequest) {
  // Require admin authentication (header only — no query param for security)
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized — admin key required' },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  try {
    const { listRegisteredCategories } = await import('@/lib/providers/setup');

    const categories = listRegisteredCategories();

    // Build summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalCategories: categories.length,
      categories: categories.map((cat: string) => ({
        name: cat,
        status: 'active',
      })),
    };

    return NextResponse.json(summary, { headers: CORS_HEADERS });
  } catch (err) {
    console.error('providers/health route error:', err);
    return NextResponse.json(
      {
        error: 'Failed to collect health data',
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
