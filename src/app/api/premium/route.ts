/**
 * Premium API Documentation Endpoint
 *
 * Public endpoint - no payment required.
 * Lists all premium endpoints with pricing and features.
 */

import { NextResponse } from 'next/server';
import { getPremiumPricingInfo } from '@/lib/x402-middleware';
import { PREMIUM_CATEGORIES } from '@/lib/x402-config';

export const runtime = 'edge';

export async function GET() {
  const pricingInfo = getPremiumPricingInfo();

  // Group endpoints by category
  const endpointsByCategory = Object.entries(PREMIUM_CATEGORIES).map(([key, category]) => ({
    category: key,
    ...category,
    endpoints: pricingInfo.endpoints.filter((e) => e.category === key),
  }));

  return NextResponse.json(
    {
      name: 'Crypto Data Aggregator Premium API',
      version: '2.0.0',
      description: 'Premium crypto data API powered by x402 micropayments',

      // Quick start
      quickStart: {
        step1: 'Make a request to any premium endpoint',
        step2: 'Receive 402 response with payment requirements',
        step3: 'Pay with USDC using any x402-compatible wallet',
        step4: 'Include payment proof in header and receive data',
        example: `curl -H "X-Payment: <base64-payment>" https://api.example.com/api/premium/ai/sentiment`,
      },

      // Payment info
      payment: pricingInfo.paymentInfo,

      // Pricing tiers
      accessPasses: [
        {
          name: '1 Hour Pass',
          path: '/api/premium/pass/hour',
          price: '$0.25',
          duration: '1 hour',
          benefits: ['All premium endpoints', 'No per-request fees', 'Higher rate limits'],
        },
        {
          name: '24 Hour Pass',
          path: '/api/premium/pass/day',
          price: '$2.00',
          duration: '24 hours',
          benefits: [
            'All premium endpoints',
            'No per-request fees',
            'Highest rate limits',
            'Priority support',
          ],
        },
        {
          name: 'Weekly Pass',
          path: '/api/premium/pass/week',
          price: '$10.00',
          duration: '7 days',
          benefits: [
            'All premium endpoints',
            'No per-request fees',
            'Highest rate limits',
            'Priority support',
            'Webhook support',
          ],
        },
      ],

      // Endpoints by category
      categories: endpointsByCategory,

      // Free alternatives
      freeEndpoints: [
        { path: '/api/market/coins', description: 'Basic market data (limited)' },
        { path: '/api/trending', description: 'Trending coins' },
        { path: '/api/news', description: 'Latest crypto news' },
        { path: '/api/charts/history', description: 'Price history (30 days)' },
        { path: '/api/sentiment', description: 'Basic sentiment (limited)' },
      ],

      // Value comparison
      valueComparison: {
        title: 'Why Pay Per Request?',
        competitors: [
          { name: 'CoinGecko Pro', price: '$129/month', note: 'Pay even if you use 1 request' },
          { name: 'CoinMarketCap', price: '$99/month', note: 'Monthly subscription required' },
          { name: 'Messari', price: '$249/month', note: 'Enterprise pricing only' },
        ],
        ourAdvantage: [
          'Pay only for what you use',
          'No subscription commitment',
          'Start for just $0.01',
          'Crypto-native payments',
          'No API key management',
        ],
      },

      // SDK links
      sdks: {
        typescript: '@x402/axios, @x402/fetch',
        python: 'x402',
        go: 'github.com/coinbase/x402/go',
        documentation: 'https://docs.x402.org',
      },

      // Support
      support: {
        documentation: '/docs/api',
        github: 'https://github.com/nirholas/crypto-data-aggregator',
        issues: 'https://github.com/nirholas/crypto-data-aggregator/issues',
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
      },
    }
  );
}
