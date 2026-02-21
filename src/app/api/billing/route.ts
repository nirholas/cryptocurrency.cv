/**
 * GET /api/billing
 *
 * Returns x402 payment configuration for this API.
 * No Stripe. No subscriptions. Pay per request in USDC on Base.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RECEIVE_ADDRESS =
  process.env.X402_RECEIVE_ADDRESS ?? '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

export async function GET() {
  return NextResponse.json({
    scheme: 'x402',
    version: 1,
    network: 'base',
    asset: 'USDC',
    payTo: RECEIVE_ADDRESS,
    endpoints: {
      '/api/premium/:path*': { price: '$0.001', description: 'Premium data endpoints' },
    },
    docs: 'https://x402.org',
    note: 'No subscription required. Pay per request on-chain.',
  });
}
