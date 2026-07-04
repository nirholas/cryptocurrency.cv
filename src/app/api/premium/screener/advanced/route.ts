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
 * Premium Advanced Screener Endpoint
 * Price: $0.02/request
 *
 * Powerful crypto screening with unlimited filter combinations.
 */

import { type NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { advancedScreener } from '@/lib/premium-screener';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing advanced screener request');
    const result = await advancedScreener(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('Advanced screener request failed', error);
    return ApiError.internal('Failed to execute screener', error);
  }
}

export const GET = withX402('/api/premium/screener/advanced', handler);
