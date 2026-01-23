/**
 * x402 Payment Verification Endpoint
 *
 * Health check endpoint for verifying x402 payment infrastructure
 * Returns current network configuration and payment status
 */

import { NextResponse } from 'next/server';
import { FACILITATOR_URL, PAYMENT_ADDRESS, USDC_ADDRESSES, NETWORKS } from '@/lib/x402';

// Get current network from environment
const CURRENT_NETWORK =
  process.env.X402_NETWORK ||
  (process.env.NODE_ENV === 'production' ? NETWORKS.BASE_MAINNET : NETWORKS.BASE_SEPOLIA);

export async function GET() {
  const now = new Date().toISOString();

  // Check if facilitator is reachable
  let facilitatorStatus = 'unknown';
  try {
    const response = await fetch(FACILITATOR_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    facilitatorStatus = response.ok ? 'healthy' : 'degraded';
  } catch {
    facilitatorStatus = 'unreachable';
  }

  return NextResponse.json(
    {
      status: 'ok',
      x402: {
        version: 2,
        enabled: true,
        network: {
          id: CURRENT_NETWORK,
          name: Object.entries(NETWORKS).find(([, v]) => v === CURRENT_NETWORK)?.[0] || 'unknown',
        },
        facilitator: {
          url: FACILITATOR_URL,
          status: facilitatorStatus,
        },
        paymentAddress: PAYMENT_ADDRESS,
        token: {
          symbol: 'USDC',
          address: USDC_ADDRESSES[CURRENT_NETWORK as keyof typeof USDC_ADDRESSES] || 'unknown',
          decimals: 6,
        },
        supportedNetworks: Object.entries(NETWORKS).map(([name, id]) => ({
          name,
          id,
          usdc: USDC_ADDRESSES[id as keyof typeof USDC_ADDRESSES] || null,
        })),
      },
      docs: {
        api: '/api/v1',
        x402: 'https://docs.x402.org',
        pricing: '/pricing',
      },
      timestamp: now,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60',
      },
    }
  );
}
