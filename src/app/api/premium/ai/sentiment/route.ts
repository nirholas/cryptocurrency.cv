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
 * Premium AI Sentiment Analysis Endpoint
 * Price: $0.02/request
 *
 * Provides AI-powered sentiment analysis of crypto news.
 */

import { type NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { analyzeSentiment } from '@/lib/premium-ai';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing AI sentiment analysis request');
    const result = await analyzeSentiment(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('AI sentiment analysis request failed', error);
    return ApiError.internal('Failed to analyze sentiment', error);
  }
}

export const GET = withX402('/api/premium/ai/sentiment', handler);
