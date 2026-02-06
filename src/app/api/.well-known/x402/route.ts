/**
 * x402 Bazaar Discovery Endpoint
 *
 * This endpoint enables AI agents and automated clients to discover
 * what paid endpoints are available and their pricing.
 *
 * Best practice from top x402 facilitators like Dexter (432k+ txns)
 *
 * @see https://docs.x402.org/bazaar
 */

import { NextResponse } from 'next/server';
import {
  PAYMENT_ADDRESS,
  NETWORKS,
  CURRENT_NETWORK,
  FACILITATOR_URL,
  IS_PRODUCTION,
  IS_TESTNET,
  getNetworkDisplayName,
} from '@/lib/x402';

export const dynamic = 'force-dynamic'; // Dynamic to reflect current config
export const revalidate = 60; // Revalidate every minute

// Simplified route definitions for discovery
const DISCOVERABLE_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/news', price: '$0.001', description: 'Latest crypto news' },
  { method: 'GET', path: '/api/v1/coins', price: '$0.002', description: 'All cryptocurrency data' },
  { method: 'GET', path: '/api/v1/coin/:id', price: '$0.001', description: 'Single coin details' },
  { method: 'GET', path: '/api/v1/market-data', price: '$0.002', description: 'Market overview' },
  { method: 'GET', path: '/api/v1/trending', price: '$0.001', description: 'Trending coins' },
  { method: 'GET', path: '/api/v1/defi', price: '$0.003', description: 'DeFi protocols data' },
  { method: 'GET', path: '/api/v1/analysis', price: '$0.005', description: 'AI market analysis' },
  { method: 'GET', path: '/api/v1/sentiment', price: '$0.005', description: 'Market sentiment' },
  { method: 'GET', path: '/api/v1/alerts', price: '$0.002', description: 'Price alerts' },
  { method: 'GET', path: '/api/v1/export', price: '$0.01', description: 'Bulk data export' },
];

// Only advertise networks we're currently accepting
const ACTIVE_NETWORKS = IS_TESTNET ? [NETWORKS.BASE_SEPOLIA] : [NETWORKS.BASE_MAINNET];

// Include both if explicitly configured for multi-network
const ALL_SUPPORTED_NETWORKS = [NETWORKS.BASE_MAINNET, NETWORKS.BASE_SEPOLIA];

export async function GET() {
  // Check if payment is properly configured
  const isConfigured =
    PAYMENT_ADDRESS && PAYMENT_ADDRESS !== '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';

  const resources = DISCOVERABLE_ENDPOINTS.map((ep) => ({
    ...ep,
    network: CURRENT_NETWORK,
    payTo: PAYMENT_ADDRESS,
    mimeType: 'application/json',
  }));

  // Categorize endpoints for AI agent discoverability
  const categories = [
    { name: 'News', icon: '📰', endpoints: resources.filter((r) => r.path.includes('news')) },
    {
      name: 'Market Data',
      icon: '📊',
      endpoints: resources.filter((r) => r.path.includes('coin') || r.path.includes('market')),
    },
    { name: 'DeFi', icon: '🔗', endpoints: resources.filter((r) => r.path.includes('defi')) },
    {
      name: 'AI Analysis',
      icon: '🤖',
      endpoints: resources.filter(
        (r) => r.path.includes('analysis') || r.path.includes('sentiment')
      ),
    },
    { name: 'Alerts', icon: '🔔', endpoints: resources.filter((r) => r.path.includes('alert')) },
    { name: 'Export', icon: '📦', endpoints: resources.filter((r) => r.path.includes('export')) },
  ].filter((c) => c.endpoints.length > 0);

  return NextResponse.json(
    {
      // x402 Bazaar discovery format
      x402Version: 2,
      provider: {
        name: 'Free Crypto News API',
        description:
          'Real-time cryptocurrency news, prices, and market data via x402 micropayments',
        url: 'https://cryptocurrency.cv',
        docs: 'https://cryptocurrency.cv/docs',
        github: 'https://github.com/nirholas/free-crypto-news',
      },

      // Payment configuration
      payment: {
        payTo: PAYMENT_ADDRESS,
        configured: isConfigured,
        networks: ALL_SUPPORTED_NETWORKS,
        activeNetwork: CURRENT_NETWORK,
        activeNetworkName: getNetworkDisplayName(CURRENT_NETWORK),
        preferredNetwork: IS_TESTNET ? NETWORKS.BASE_SEPOLIA : NETWORKS.BASE_MAINNET,
        asset: 'USDC',
        facilitator: FACILITATOR_URL,
      },

      // Environment info (helpful for clients)
      environment: {
        production: IS_PRODUCTION,
        testnet: IS_TESTNET,
        mode: IS_PRODUCTION ? (IS_TESTNET ? 'production-testnet' : 'production-mainnet') : 'development',
      },

      // Pricing summary
      pricing: {
        currency: 'USD',
        priceRange: {
          min: '$0.001',
          max: '$0.05',
        },
        totalEndpoints: resources.length,
        payPerRequest: true,
        subscriptionsAvailable: true,
        subscriptionUrl: '/pricing',
      },

      // All discoverable resources
      resources,

      // Categorized view (easier for AI agents)
      categories,

      // Usage examples for AI agents
      examples: {
        curl: `curl -H "X-Payment: <payment_signature>" https://cryptocurrency.cv/api/v1/news`,
        javascript: `import { payFetch } from '@x402/fetch';
const response = await payFetch('https://cryptocurrency.cv/api/v1/news', { wallet });`,
        python: `import x402
response = x402.get('https://cryptocurrency.cv/api/v1/news', wallet=wallet)`,
      },

      // SDK links
      sdks: {
        npm: '@x402/fetch',
        go: 'github.com/coinbase/x402-go',
        python: 'pip install x402-client',
      },

      // Metadata
      _meta: {
        generatedAt: new Date().toISOString(),
        cacheSeconds: 60,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'Content-Type': 'application/json',
        'X-X402-Version': '2',
        'X-X402-Network': CURRENT_NETWORK,
        'X-X402-Environment': IS_PRODUCTION ? 'production' : 'development',
      },
    }
  );
}
