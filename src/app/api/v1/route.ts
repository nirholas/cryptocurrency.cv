/**
 * API v1 Documentation & Pricing Endpoint
 *
 * Public endpoint - no payment required
 * Returns API documentation, pricing, and available endpoints
 */

import { NextResponse } from 'next/server';
import {
  API_PRICING,
  API_TIERS,
  getEndpointMetadata,
  FACILITATOR_URL,
  PAYMENT_ADDRESS,
  NETWORKS,
} from '@/lib/x402';

// Get network from environment
const CURRENT_NETWORK =
  process.env.X402_NETWORK ||
  (process.env.NODE_ENV === 'production' ? NETWORKS.BASE_MAINNET : NETWORKS.BASE_SEPOLIA);

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  return NextResponse.json(
    {
      name: 'Crypto Data Aggregator API',
      version: '1.0.0',
      description: 'Real-time cryptocurrency market data API with x402 micropayments support',
      docs: 'https://crypto-data-aggregator.vercel.app/docs/api',

      // x402 Configuration
      x402: {
        version: 2,
        network: CURRENT_NETWORK,
        facilitator: FACILITATOR_URL,
        payTo: PAYMENT_ADDRESS,
        token: 'USDC',
        docs: 'https://docs.x402.org',
      },

      // Authentication Methods
      authentication: {
        methods: [
          {
            type: 'x402',
            description: 'Pay per request with USDC on Base (recommended for occasional use)',
            header: 'PAYMENT-SIGNATURE',
            network: CURRENT_NETWORK,
            docs: 'https://docs.x402.org',
          },
          {
            type: 'apiKey',
            description: 'Subscribe for an API key with monthly quota',
            header: 'X-API-Key',
            queryParam: 'api_key',
          },
        ],
      },

      // Subscription Tiers
      tiers: Object.entries(API_TIERS).map(([id, tier]) => ({
        id,
        name: tier.name,
        price: `$${tier.price}/month`,
        requestsPerDay: tier.requestsPerDay === -1 ? 'Unlimited' : tier.requestsPerDay,
        features: tier.features,
      })),

      // Endpoint Pricing
      endpoints: Object.entries(API_PRICING).map(([path, price]) => {
        const meta = getEndpointMetadata(path);
        const priceStr = typeof price === 'string' ? price : `$${price}`;
        return {
          method: 'GET',
          path,
          price: priceStr,
          priceUSDC: Math.round(parseFloat(priceStr.replace('$', '')) * 1e6),
          description: meta?.description || `API endpoint: ${path}`,
        };
      }),

      // Rate Limits
      rateLimit: {
        free: '100 requests/day',
        pro: '10,000 requests/day',
        enterprise: 'Unlimited',
        x402: 'Unlimited (pay per request)',
        headers: {
          limit: 'X-RateLimit-Limit',
          remaining: 'X-RateLimit-Remaining',
          reset: 'X-RateLimit-Reset',
        },
      },

      // Example Requests
      examples: {
        withApiKey: {
          description: 'Using API key authentication',
          curl: 'curl -H "X-API-Key: pro_your_key_here" https://crypto-data-aggregator.vercel.app/api/v1/coins',
        },
        withX402: {
          description: 'Using x402 micropayments',
          steps: [
            '1. Make request to endpoint',
            '2. Receive 402 with payment requirements',
            '3. Sign payment with your wallet',
            '4. Retry request with PAYMENT-SIGNATURE header',
            '5. Receive data',
          ],
          docs: 'https://docs.x402.org/getting-started/quickstart-for-buyers',
        },
      },

      // Support
      support: {
        docs: 'https://crypto-data-aggregator.vercel.app/docs/api',
        pricing: 'https://crypto-data-aggregator.vercel.app/pricing',
        github: 'https://github.com/nirholas/crypto-data-aggregator',
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
