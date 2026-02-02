/**
 * Premium AI Trading Signals Endpoint
 * Price: $0.05/request
 *
 * AI-generated buy/sell signals based on market data.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { generateSignals } from '@/lib/premium-ai';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing AI signals request');
    const result = await generateSignals(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('AI signals request failed', error);
    return ApiError.internal('Failed to generate trading signals', error);
  }
}

export const GET = withX402('/api/premium/ai/signals', handler);
