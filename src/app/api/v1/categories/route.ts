/**
 * GET /api/v1/categories
 *
 * Premium API v1 - News Categories Endpoint
 * Returns all available news categories with source counts.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getCategories } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 3600;

const ENDPOINT = '/api/v1/categories';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  try {
    logger.info('Fetching news categories');

    const data = getCategories();

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        ...data,
        usage: {
          example: '/api/v1/news?category=institutional',
          description: 'Use the category parameter to filter news by category',
        },
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
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch categories', error);
    return ApiError.internal('Failed to fetch categories', error);
  }
}
