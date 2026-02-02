/**
 * AI Plugin Discovery Route
 * 
 * Standard endpoint for AI agent discovery
 * Compatible with ChatGPT plugins and other AI frameworks
 */

import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://news-crypto.vercel.app';

export const runtime = 'edge';

export async function GET() {
  const plugin = {
    schema_version: 'v1',
    name_for_human: 'Free Crypto News',
    name_for_model: 'free_crypto_news',
    description_for_human: 'Get real-time cryptocurrency news, market data, AI analysis, and trading signals from 200+ sources.',
    description_for_model: 'Use this plugin to access real-time cryptocurrency news, market data, sentiment analysis, and trading signals. The API aggregates news from 200+ sources including CoinDesk, CoinTelegraph, and international outlets. You can search for news about specific cryptocurrencies, get market data for coins, check the Fear & Greed Index, and access AI-generated sentiment analysis. No API key required.',
    auth: {
      type: 'none',
    },
    api: {
      type: 'openapi',
      url: `${BASE_URL}/api/openapi.json`,
    },
    logo_url: `${BASE_URL}/icons/icon-512x512.png`,
    contact_email: 'support@news-crypto.vercel.app',
    legal_info_url: `${BASE_URL}/legal`,
    
    // Extended metadata for AI discovery
    capabilities: [
      'cryptocurrency_news',
      'market_data',
      'sentiment_analysis',
      'trading_signals',
      'whale_alerts',
      'fear_greed_index',
      'price_data',
      'search',
      'real_time_streaming',
    ],
    
    supported_languages: [
      'en', 'zh', 'ko', 'ja', 'es', 'de', 'fr', 'pt', 'ru', 'ar',
      'hi', 'vi', 'th', 'id', 'tr', 'it', 'nl', 'pl', 'uk', 'fa',
    ],
    
    data_sources: {
      count: 200,
      categories: ['news', 'market', 'social', 'on-chain'],
    },
    
    rate_limits: {
      type: 'none',
      description: 'No rate limits for public endpoints',
    },
    
    pricing: {
      type: 'free',
      premium_available: true,
      premium_protocol: 'x402',
    },
    
    // MCP server info for Claude
    mcp: {
      available: true,
      package: '@anthropic-ai/mcp-server-crypto-news',
      docs: `${BASE_URL}/docs/integrations/mcp`,
    },
    
    // LLMs.txt endpoints
    llms_txt: {
      summary: `${BASE_URL}/llms.txt`,
      full: `${BASE_URL}/llms-full.txt`,
    },
  };

  return NextResponse.json(plugin, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
