/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getSources } from '@/lib/crypto-news';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { validateSourcesToken } from '@/lib/sources-token';

export const runtime = 'edge';
export const revalidate = 3600; // 1 hour

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Anti-scraping: require a valid, short-lived HMAC token
  const token = request.nextUrl.searchParams.get('token');
  if (!token || !(await validateSourcesToken(token))) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'INVALID_TOKEN', message: 'A valid sources token is required.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    logger.info('Fetching sources');
    const data = await getSources();
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, no-store',
        // CORS restricted — only same-origin requests
      },
    });
  } catch (error) {
    logger.error('Failed to fetch sources', error);
    return ApiError.internal('Failed to fetch sources', error);
  }
}
