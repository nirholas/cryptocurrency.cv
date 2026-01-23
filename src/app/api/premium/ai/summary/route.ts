/**
 * Premium AI Market Summary Endpoint
 * Price: $0.01/request
 *
 * AI-generated market summary for any cryptocurrency.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { generateSummary } from '@/lib/premium-ai';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return generateSummary(request);
}

export const GET = withX402('/api/premium/ai/summary', handler);
