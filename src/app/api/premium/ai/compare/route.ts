/**
 * Premium AI Coin Comparison Endpoint
 * Price: $0.03/request
 *
 * AI comparison of multiple cryptocurrencies.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { compareCoins } from '@/lib/premium-ai';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing AI coin comparison request');
    const result = await compareCoins(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('AI comparison request failed', error);
    return ApiError.internal('Failed to compare coins', error);
  }
}

export const GET = withX402('/api/premium/ai/compare', handler);
