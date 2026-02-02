/**
 * Premium Advanced Screener Endpoint
 * Price: $0.02/request
 *
 * Powerful crypto screening with unlimited filter combinations.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { advancedScreener } from '@/lib/premium-screener';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

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
