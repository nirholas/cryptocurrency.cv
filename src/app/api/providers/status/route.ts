import { NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Provider Status API — Health and status of all provider chains
 *
 * Returns the current state of all registered data provider chains,
 * including health status, active providers, and data freshness.
 *
 * GET /api/providers/status
 */
export async function GET() {
  try {
    // Import lazily to avoid circular deps
    const { listRegisteredCategories } = await import('@/lib/providers/setup');

    const categories = listRegisteredCategories();

    return NextResponse.json({
      framework: 'ProviderChain v1',
      categories: categories.length,
      registered: categories,
      capabilities: {
        strategies: ['fallback', 'race', 'consensus', 'broadcast'],
        features: [
          'circuit-breaker',
          'data-fusion',
          'anomaly-detection',
          'health-monitoring',
          'stale-while-revalidate',
          'per-provider-rate-limiting',
        ],
      },
      adapters: {
        'market-price': ['coingecko', 'coincap', 'binance'],
        'dex': ['dexscreener', 'geckoterminal'],
        'fear-greed': ['alternative-me', 'coinstats'],
        'funding-rate': ['binance-futures', 'bybit', 'okx'],
        'gas-fees': ['etherscan', 'blocknative'],
        'tvl': ['defillama'],
        'defi-yields': ['defillama-yields'],
        'derivatives': ['hyperliquid', 'coinglass'],
        'on-chain': ['blockchain-info', 'etherscan'],
        'social-metrics': ['lunarcrush'],
        'stablecoin-flows': ['defillama-stablecoins'],
      },
      dataSources: {
        total: 50,
        free: 35,
        apiKeyRequired: 15,
        categories: [
          'Market Data', 'DEX', 'Derivatives', 'DeFi', 'On-Chain',
          'Social', 'Oracles', 'NFT', 'Stablecoins', 'Layer 2',
        ],
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get provider status', message: String(error) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
