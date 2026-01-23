/**
 * Premium Whale Alerts Endpoint
 * Price: $0.05/request
 *
 * Subscribe to whale transaction alerts via webhook.
 */

import { NextRequest } from 'next/server';
import { withX402 } from '@/lib/x402-middleware';
import { createWhaleAlert } from '@/lib/premium-whales';

export const runtime = 'edge';

async function handler(request: NextRequest) {
  return createWhaleAlert(request);
}

export const POST = withX402('/api/premium/whales/alerts', handler);
