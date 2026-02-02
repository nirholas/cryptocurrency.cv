/**
 * Premium Whale Alerts Endpoint
 * Price: $0.05/request
 *
 * Subscribe to whale transaction alerts via webhook.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { createWhaleAlert } from '@/lib/premium-whales';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Processing whale alert creation request');
    const result = await createWhaleAlert(request);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    return result;
  } catch (error) {
    logger.error('Whale alert creation failed', error);
    return ApiError.internal('Failed to create whale alert', error);
  }
}

export const POST = withX402('/api/premium/whales/alerts', handler);
