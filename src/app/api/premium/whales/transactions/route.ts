/**
 * Premium Whale Transactions Endpoint
 * Price: $0.05/request
 *
 * Track large cryptocurrency transactions.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { getWhaleTransactions } from '@/lib/premium-whales';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return getWhaleTransactions(request);
}

export const GET = withX402('/api/premium/whales/transactions', handler);
