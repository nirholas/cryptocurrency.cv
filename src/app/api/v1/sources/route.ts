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
 * GET /api/v1/sources
 *
 * Premium API v1 - News Sources Endpoint
 * Returns all available news sources with metadata.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getSources } from '@/lib/crypto-news';

export const runtime = 'nodejs';
export const revalidate = 3600;

const ENDPOINT = '/api/v1/sources';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  try {
    logger.info('Fetching news sources');

    const data = await getSources();

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        ...data,
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'CryptoNews',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch sources', error);
    return ApiError.internal('Failed to fetch sources', error);
  }
}
