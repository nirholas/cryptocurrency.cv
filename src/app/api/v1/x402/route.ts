/**
 * x402 Payment Status Endpoint
 *
 * Health check endpoint for verifying x402 payment infrastructure.
 * Returns current network configuration, payment status, and validation.
 *
 * Use this endpoint to:
 * - Verify x402 is properly configured before mainnet deployment
 * - Check facilitator connectivity
 * - Validate payment address is set
 */

import { NextResponse } from 'next/server';
import {
  FACILITATOR_URL,
  PAYMENT_ADDRESS,
  USDC_ADDRESSES,
  NETWORKS,
  CURRENT_NETWORK,
  IS_PRODUCTION,
  IS_TESTNET,
  getNetworkDisplayName,
} from '@/lib/x402/config';
import { validateConfig, getServerStatus } from '@/lib/x402/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date().toISOString();
  const validation = validateConfig();
  const serverStatus = getServerStatus();

  // Check if facilitator is reachable
  let facilitatorStatus = 'unknown';
  let facilitatorLatency: number | null = null;
  try {
    const start = Date.now();
    const response = await fetch(FACILITATOR_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    facilitatorLatency = Date.now() - start;
    facilitatorStatus = response.ok ? 'healthy' : 'degraded';
  } catch {
    facilitatorStatus = 'unreachable';
  }

  // Determine overall status
  const overallStatus =
    validation.valid && facilitatorStatus === 'healthy'
      ? 'ready'
      : validation.errors.length > 0
        ? 'misconfigured'
        : 'degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      ready: validation.valid && facilitatorStatus === 'healthy',
      x402: {
        version: 2,
        enabled: true,
        environment: {
          production: IS_PRODUCTION,
          testnet: IS_TESTNET,
          mode: IS_PRODUCTION
            ? IS_TESTNET
              ? 'production-testnet'
              : 'production-mainnet'
            : 'development',
        },
        network: {
          id: CURRENT_NETWORK,
          name: getNetworkDisplayName(CURRENT_NETWORK),
        },
        facilitator: {
          url: FACILITATOR_URL,
          status: facilitatorStatus,
          latencyMs: facilitatorLatency,
        },
        payment: {
          address: PAYMENT_ADDRESS,
          configured:
            !!PAYMENT_ADDRESS &&
            PAYMENT_ADDRESS !== '0x0000000000000000000000000000000000000000',
          // Obscure address in production responses for safety
          displayAddress: PAYMENT_ADDRESS
            ? IS_PRODUCTION
              ? `${PAYMENT_ADDRESS.slice(0, 6)}...${PAYMENT_ADDRESS.slice(-4)}`
              : PAYMENT_ADDRESS
            : null,
        },
        token: {
          symbol: 'USDC',
          address: USDC_ADDRESSES[CURRENT_NETWORK as keyof typeof USDC_ADDRESSES] || 'unknown',
          decimals: 6,
        },
        supportedNetworks: Object.entries(NETWORKS).map(([name, id]) => ({
          name,
          id,
          usdc: USDC_ADDRESSES[id as keyof typeof USDC_ADDRESSES] || null,
          active: id === CURRENT_NETWORK,
        })),
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      docs: {
        api: '/api/v1',
        x402: 'https://docs.x402.org',
        discovery: '/api/.well-known/x402',
        pricing: '/pricing',
      },
      _meta: {
        timestamp: now,
        serverVersion: process.env.npm_package_version || '1.0.0',
      },
    },
    {
      status: overallStatus === 'ready' ? 200 : overallStatus === 'misconfigured' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'X-X402-Status': overallStatus,
        'X-X402-Network': CURRENT_NETWORK,
      },
    }
  );
}
