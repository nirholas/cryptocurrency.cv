/**
 * Premium AI Sentiment Analysis Endpoint
 * Price: $0.02/request
 *
 * Provides AI-powered sentiment analysis of crypto news.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { analyzeSentiment } from '@/lib/premium-ai';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return analyzeSentiment(request);
}

export const GET = withX402('/api/premium/ai/sentiment', handler);
