/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Agents.json Discovery Route
 *
 * Machine-readable agent capabilities discovery.
 * Tells AI agents what this API does, how to pay, and how to call it.
 */

import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/constants';
import { ROUTE_COUNT } from '@/lib/openapi/routes.generated';

export const runtime = 'edge';

export async function GET() {
  const agents = {
    version: '1.1.0',
    name: 'Crypto Vision News API',
    description:
      'Real-time cryptocurrency news and market intelligence API with 350+ endpoints. ' +
      'Covers news, market data, DeFi, derivatives, on-chain analytics, AI analysis, ' +
      'social intelligence, NFTs, and multi-chain data (EVM, Solana, Aptos, Sui). ' +
      'Pay per request with USDC via x402 micropayments.',
    homepage: SITE_URL,

    // How agents should pay
    payment: {
      protocol: 'x402',
      description:
        'All API endpoints require x402 micropayment in USDC. ' +
        'Use @x402/fetch (npm), x402-client (Python/Go), or any x402-compatible SDK. ' +
        'Prices range from $0.001 to $0.20 per request — see x-payment-info on each OpenAPI operation.',
      network: 'eip155:42161',
      networkName: 'Arbitrum',
      asset: 'USDC',
      defaultPrice: '$0.001',
      sdks: {
        npm: '@x402/fetch',
        python: 'pip install x402-client',
        go: 'github.com/coinbase/x402-go',
      },
      quickStart: [
        'npm install @x402/fetch',
        'import { payFetch } from "@x402/fetch";',
        'const res = await payFetch("https://cryptocurrency.cv/api/v1/news", { wallet });',
      ],
    },

    // Discovery endpoints
    discovery: {
      openapi: `${SITE_URL}/openapi.json`,
      x402: `${SITE_URL}/.well-known/x402`,
      llms_txt: `${SITE_URL}/llms.txt`,
      llms_full: `${SITE_URL}/llms-full.txt`,
      agents_json: `${SITE_URL}/.well-known/agents.json`,
      ai_plugin: `${SITE_URL}/.well-known/ai-plugin.json`,
    },

    // API stats
    stats: {
      totalEndpoints: ROUTE_COUNT,
      pricingModel: 'pay-per-request',
      priceRange: { min: '$0.001', max: '$0.20' },
      responseFormat: 'JSON',
    },

    // Recommended workflows for agents
    workflows: {
      'get-latest-news': {
        description: 'Fetch the latest cryptocurrency headlines',
        steps: [
          'GET /api/v1/news?limit=20 — latest 20 articles from 300+ sources',
          'GET /api/v1/breaking — breaking news only',
          'GET /api/search?q=bitcoin+ETF — search for specific topics',
        ],
      },
      'market-overview': {
        description: 'Get a snapshot of the crypto market',
        steps: [
          'GET /api/v1/coins?per_page=20 — top 20 coins by market cap',
          'GET /api/v1/market-data — global market stats',
          'GET /api/v1/fear-greed — market sentiment index',
          'GET /api/v1/trending — trending coins',
        ],
      },
      'research-a-coin': {
        description: 'Deep dive into a specific cryptocurrency',
        steps: [
          'GET /api/v1/coin/{coinId} — detailed coin data',
          'GET /api/v1/sentiment?asset={symbol} — AI sentiment analysis',
          'GET /api/search?q={coinName} — recent news about it',
          'GET /api/v1/forecast?coinId={coinId} — AI price forecast',
          'GET /api/onchain/exchange-flows — exchange flow data',
        ],
      },
      'ai-analysis': {
        description: 'Get AI-powered market intelligence',
        steps: [
          'GET /api/v1/ask?q={question} — ask anything about crypto',
          'GET /api/v1/digest — daily market summary',
          'GET /api/v1/narratives — emerging market narratives',
          'GET /api/ai/research?topic={topic} — deep research report',
          'GET /api/premium/ai/signals?coin={coinId} — trading signals ($0.05)',
        ],
      },
      'defi-monitoring': {
        description: 'Monitor DeFi protocols and yields',
        steps: [
          'GET /api/defi — DeFi protocol overview with TVL',
          'GET /api/defi/yields — top yield farming opportunities',
          'GET /api/defi/bridges — cross-chain bridge data',
          'GET /api/v1/dex — DEX trading volumes',
        ],
      },
      'whale-tracking': {
        description: 'Track large holders and smart money',
        steps: [
          'GET /api/v1/whale-alerts — large transactions',
          'GET /api/premium/whales/transactions — detailed whale data ($0.05)',
          'GET /api/premium/smart-money — institutional flows ($0.05)',
          'GET /api/onchain/exchange-flows — exchange deposit/withdrawal patterns',
        ],
      },
    },

    // Key individual skills for tool-use agents
    skills: [
      {
        name: 'get_crypto_news',
        description: 'Fetch latest cryptocurrency news articles from 300+ sources',
        endpoint: '/api/v1/news',
        method: 'GET',
        price: '$0.001',
        parameters: [
          { name: 'limit', type: 'integer', description: 'Number of articles (1-100, default 20)' },
          { name: 'category', type: 'string', description: 'Filter: general, bitcoin, defi, nft, research, institutional, etf' },
          { name: 'source', type: 'string', description: 'Filter by source key (coindesk, decrypt, etc.)' },
          { name: 'page', type: 'integer', description: 'Page number for pagination' },
        ],
      },
      {
        name: 'search_news',
        description: 'Full-text search across all crypto news sources',
        endpoint: '/api/search',
        method: 'GET',
        price: '$0.001',
        parameters: [
          { name: 'q', type: 'string', required: true, description: 'Search keywords (e.g. "bitcoin ETF,blackrock")' },
          { name: 'limit', type: 'integer', description: 'Max results (default 10)' },
          { name: 'from', type: 'string', description: 'Start date (ISO 8601)' },
          { name: 'to', type: 'string', description: 'End date (ISO 8601)' },
        ],
      },
      {
        name: 'get_market_data',
        description: 'Get cryptocurrency prices, market caps, and volumes',
        endpoint: '/api/v1/coins',
        method: 'GET',
        price: '$0.001',
        parameters: [
          { name: 'per_page', type: 'integer', description: 'Results per page (max 250)' },
          { name: 'page', type: 'integer', description: 'Page number' },
          { name: 'order', type: 'string', description: 'Sort: market_cap_desc, volume_desc' },
          { name: 'ids', type: 'string', description: 'Comma-separated coin IDs' },
        ],
      },
      {
        name: 'ask_about_crypto',
        description: 'Ask any natural language question about cryptocurrency news and markets',
        endpoint: '/api/v1/ask',
        method: 'GET',
        price: '$0.005',
        parameters: [
          { name: 'q', type: 'string', required: true, description: 'Your question (e.g. "What happened to Bitcoin this week?")' },
        ],
      },
      {
        name: 'get_sentiment',
        description: 'AI-powered sentiment analysis for any cryptocurrency',
        endpoint: '/api/v1/sentiment',
        method: 'GET',
        price: '$0.005',
        parameters: [
          { name: 'asset', type: 'string', description: 'Asset symbol (BTC, ETH, SOL). Omit for overall market.' },
          { name: 'period', type: 'string', description: 'Time window: 1h, 24h, 7d, 30d' },
        ],
      },
      {
        name: 'get_trending',
        description: 'Get trending topics and coins in crypto',
        endpoint: '/api/v1/trending',
        method: 'GET',
        price: '$0.001',
        parameters: [
          { name: 'limit', type: 'integer', description: 'Number of results' },
          { name: 'period', type: 'string', description: 'Time window: 1h, 6h, 24h, 7d' },
        ],
      },
      {
        name: 'get_fear_greed',
        description: 'Crypto Fear & Greed Index (0=Extreme Fear, 100=Extreme Greed)',
        endpoint: '/api/v1/fear-greed',
        method: 'GET',
        price: '$0.002',
      },
      {
        name: 'get_whale_alerts',
        description: 'Large cryptocurrency transactions (whale movements)',
        endpoint: '/api/v1/whale-alerts',
        method: 'GET',
        price: '$0.003',
        parameters: [
          { name: 'minValue', type: 'integer', description: 'Minimum USD value' },
        ],
      },
      {
        name: 'get_defi_data',
        description: 'DeFi protocol data including TVL, yields, and bridges',
        endpoint: '/api/defi',
        method: 'GET',
        price: '$0.001',
      },
      {
        name: 'get_trading_signals',
        description: 'AI-generated buy/sell trading signals',
        endpoint: '/api/v1/signals',
        method: 'GET',
        price: '$0.005',
      },
      {
        name: 'get_price_forecast',
        description: 'AI price forecast for a cryptocurrency',
        endpoint: '/api/v1/forecast',
        method: 'GET',
        price: '$0.005',
        parameters: [
          { name: 'coinId', type: 'string', required: true, description: 'Coin ID (bitcoin, ethereum, etc.)' },
        ],
      },
      {
        name: 'get_daily_digest',
        description: 'AI-generated daily market summary and key events',
        endpoint: '/api/v1/digest',
        method: 'GET',
        price: '$0.005',
      },
      {
        name: 'deep_research',
        description: 'Generate a comprehensive research report on any crypto topic',
        endpoint: '/api/ai/research',
        method: 'GET',
        price: '$0.01',
        parameters: [
          { name: 'topic', type: 'string', required: true, description: 'Research topic' },
        ],
      },
    ],

    // Integration options
    integrations: {
      mcp: {
        available: true,
        description: 'Claude MCP server for direct integration',
        package: 'io.github.nirholas/free-crypto-news',
      },
      chatgpt: {
        available: true,
        openapi: `${SITE_URL}/.well-known/ai-plugin.json`,
      },
      x402: {
        available: true,
        description: 'x402 micropayment protocol (primary payment method)',
        discovery: `${SITE_URL}/.well-known/x402`,
        openapi: `${SITE_URL}/openapi.json`,
      },
    },

    // Contact
    contact: {
      github: 'https://github.com/nirholas/free-crypto-news',
      issues: 'https://github.com/nirholas/free-crypto-news/issues',
    },
  };

  return NextResponse.json(agents, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
