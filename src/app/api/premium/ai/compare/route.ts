/**
 * Premium AI Coin Comparison Endpoint
 * Price: $0.03/request
 *
 * AI comparison of multiple cryptocurrencies.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { compareCoins } from '@/lib/premium-ai';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return compareCoins(request);
}

export const GET = withX402('/api/premium/ai/compare', handler);
