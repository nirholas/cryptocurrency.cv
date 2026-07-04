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
 * Premium Smart Money Endpoint
 * Price: $0.05/request
 *
 * Track institutional and smart money movements.
 */

import { type NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { getSmartMoney } from '@/lib/premium-whales';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing smart money request');
    const result = await getSmartMoney(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('Smart money request failed', error);
    return ApiError.internal('Failed to fetch smart money data', error);
  }
}

export const GET = withX402('/api/premium/smart-money', handler);
