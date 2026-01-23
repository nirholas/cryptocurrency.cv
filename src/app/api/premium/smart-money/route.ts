/**
 * Premium Smart Money Endpoint
 * Price: $0.05/request
 *
 * Track institutional and smart money movements.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { getSmartMoney } from '@/lib/premium-whales';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return getSmartMoney(request);
}

export const GET = withX402('/api/premium/smart-money', handler);
