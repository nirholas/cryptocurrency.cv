/**
 * Premium AI Trading Signals Endpoint
 * Price: $0.05/request
 *
 * AI-generated buy/sell signals based on market data.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { generateSignals } from '@/lib/premium-ai';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return generateSignals(request);
}

export const GET = withX402('/api/premium/ai/signals', handler);
