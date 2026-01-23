/**
 * Premium Advanced Screener Endpoint
 * Price: $0.02/request
 *
 * Powerful crypto screening with unlimited filter combinations.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { advancedScreener } from '@/lib/premium-screener';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return advancedScreener(request);
}

export const GET = withX402('/api/premium/screener/advanced', handler);
