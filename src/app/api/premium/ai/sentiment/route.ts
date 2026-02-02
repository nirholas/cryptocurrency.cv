/**
 * Premium AI Sentiment Analysis Endpoint
 * Price: $0.02/request
 *
 * Provides AI-powered sentiment analysis of crypto news.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402';
import { analyzeSentiment } from '@/lib/premium-ai';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

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
