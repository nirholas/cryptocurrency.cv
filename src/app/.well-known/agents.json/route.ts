/**
 * Agents.json Discovery Route
 * 
 * Machine-readable agent capabilities discovery
 * For AI agents to understand available tools and skills
 */

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://news-crypto.vercel.app';

export const runtime = 'edge';

export async function GET() {
  const agents = {
    version: '1.0.0',
    name: 'Free Crypto News',
    description: 'Real-time cryptocurrency news and market intelligence API',
    homepage: BASE_URL,
    
    // Discovery endpoints
    discovery: {
      openapi: `${BASE_URL}/api/openapi.json`,
      llms_txt: `${BASE_URL}/llms.txt`,
      llms_full: `${BASE_URL}/llms-full.txt`,
      ai_plugin: `${BASE_URL}/.well-known/ai-plugin.json`,
      x402: `${BASE_URL}/.well-known/x402`,
    },
    
    // Available skills/tools for agents
    skills: [
      {
        name: 'get_crypto_news',
        description: 'Fetch latest cryptocurrency news articles',
        endpoint: '/api/news',
        method: 'GET',
        parameters: [
          { name: 'limit', type: 'integer', description: 'Number of articles (max 100)' },
          { name: 'category', type: 'string', description: 'Filter by category' },
          { name: 'source', type: 'string', description: 'Filter by source' },
        ],
      },
      {
        name: 'search_news',
        description: 'Search for news articles by keyword',
        endpoint: '/api/search',
        method: 'GET',
        parameters: [
          { name: 'q', type: 'string', required: true, description: 'Search query' },
          { name: 'limit', type: 'integer', description: 'Number of results' },
        ],
      },
      {
        name: 'get_trending',
        description: 'Get trending topics and tickers',
        endpoint: '/api/trending',
        method: 'GET',
      },
      {
        name: 'get_sentiment',
        description: 'Get AI-analyzed sentiment for a cryptocurrency',
        endpoint: '/api/ai/sentiment',
        method: 'GET',
        parameters: [
          { name: 'asset', type: 'string', required: true, description: 'Asset symbol (BTC, ETH, etc.)' },
        ],
      },
      {
        name: 'get_market_data',
        description: 'Get cryptocurrency market data',
        endpoint: '/api/market/coins',
        method: 'GET',
        parameters: [
          { name: 'limit', type: 'integer', description: 'Number of coins' },
        ],
      },
      {
        name: 'get_coin_details',
        description: 'Get detailed data for a specific coin',
        endpoint: '/api/market/coin/{id}',
        method: 'GET',
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'Coin ID (bitcoin, ethereum, etc.)' },
        ],
      },
      {
        name: 'get_fear_greed',
        description: 'Get the Fear & Greed Index',
        endpoint: '/api/market/fear-greed',
        method: 'GET',
      },
      {
        name: 'get_trading_signals',
        description: 'Get AI trading signals',
        endpoint: '/api/signals',
        method: 'GET',
      },
      {
        name: 'get_whale_alerts',
        description: 'Get large transaction (whale) alerts',
        endpoint: '/api/whale-alerts',
        method: 'GET',
        parameters: [
          { name: 'minValue', type: 'integer', description: 'Minimum USD value' },
        ],
      },
      {
        name: 'generate_summary',
        description: 'Generate AI summary of article content',
        endpoint: '/api/ai/summarize',
        method: 'POST',
        parameters: [
          { name: 'url', type: 'string', required: true, description: 'Article URL' },
        ],
      },
      {
        name: 'generate_debate',
        description: 'Generate bull vs bear analysis on a topic',
        endpoint: '/api/ai/debate',
        method: 'POST',
        parameters: [
          { name: 'topic', type: 'string', required: true, description: 'Topic to debate' },
        ],
      },
    ],
    
    // Authentication
    auth: {
      required: false,
      type: 'none',
      description: 'No authentication required for public endpoints',
    },
    
    // Rate limits
    rate_limits: {
      public: 'unlimited',
      premium: 'x402 micropayments',
    },
    
    // Integration options
    integrations: {
      mcp: {
        available: true,
        package: '@anthropic-ai/mcp-server-crypto-news',
      },
      chatgpt: {
        available: true,
        openapi: `${BASE_URL}/chatgpt/openapi.yaml`,
      },
      langchain: {
        available: true,
        docs: `${BASE_URL}/docs/examples/langchain`,
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
