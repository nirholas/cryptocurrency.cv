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
 * Premium AI Market Summary Endpoint
 * Price: $0.01/request
 *
 * AI-generated market summary for any cryptocurrency.
 */

import { type NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { generateSummary } from '@/lib/premium-ai';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing AI summary request');
    const result = await generateSummary(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('AI summary request failed', error);
    return ApiError.internal('Failed to generate market summary', error);
  }
}

export const GET = withX402('/api/premium/ai/summary', handler);
