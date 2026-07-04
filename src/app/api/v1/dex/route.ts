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
 * GET /api/v1/dex
 *
 * Premium API v1 — DEX Analytics
 * Returns decentralized exchange volume, liquidity, and top pools.
 * Aggregates data from DexScreener and GeckoTerminal.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   chain     — Filter by chain (ethereum, solana, base, arbitrum, bsc — default: all)
 *   query     — Search for specific token pair
 *   sort      — Sort by: volume, liquidity, txns (default: volume)
 *   limit     — Number of results (1-100, default: 20)
 *
 * @price $0.002 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';
export const revalidate = 60;

const ENDPOINT = '/api/v1/dex';

interface DexPool {
  name: string;
  chain: string;
  dex: string;
  pairAddress: string;
  baseToken: { symbol: string; name: string; address: string };
  quoteToken: { symbol: string; name: string; address: string };
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  txns24h: { buys: number; sells: number; total: number };
  fdv: number;
  createdAt: string;
  url: string;
}

const CHAIN_MAP: Record<string, string> = {
  ethereum: 'ethereum',
  eth: 'ethereum',
  solana: 'solana',
  sol: 'solana',
  base: 'base',
  arbitrum: 'arbitrum',
  arb: 'arbitrum',
  bsc: 'bsc',
  bnb: 'bsc',
  polygon: 'polygon',
  avalanche: 'avalanche',
  optimism: 'optimism',
};

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const chain = CHAIN_MAP[params.get('chain')?.toLowerCase() || ''] || '';
  const query = params.get('query') || '';
  const sort = params.get('sort') || 'volume';
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '20', 10) || 20, 1), 100);

  try {
    logger.info('Fetching DEX data', { chain, query, sort, limit });

    let pools: DexPool[] = [];
    const sources: string[] = [];

    if (query) {
      // Search mode
      pools = await fetchDexScreenerSearch(query);
      sources.push('dexscreener');
    } else if (chain) {
      // Chain-specific top pools
      const [dsResults, gtResults] = await Promise.allSettled([
        fetchDexScreenerByChain(chain),
        fetchGeckoTerminalByChain(chain),
      ]);

      if (dsResults.status === 'fulfilled') {
        pools.push(...dsResults.value);
        sources.push('dexscreener');
      }
      if (gtResults.status === 'fulfilled') {
        pools.push(...gtResults.value);
        sources.push('geckoterminal');
      }
    } else {
      // Global trending
      pools = await fetchDexScreenerTrending();
      sources.push('dexscreener');
    }

    // Deduplicate by pair address
    const seen = new Set<string>();
    pools = pools.filter((p) => {
      const key = `${p.chain}:${p.pairAddress}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort
    if (sort === 'liquidity') {
      pools.sort((a, b) => b.liquidity - a.liquidity);
    } else if (sort === 'txns') {
      pools.sort((a, b) => b.txns24h.total - a.txns24h.total);
    } else {
      pools.sort((a, b) => b.volume24h - a.volume24h);
    }

    pools = pools.slice(0, limit);

    // Aggregated stats
    const totalVolume = pools.reduce((s, p) => s + p.volume24h, 0);
    const totalLiquidity = pools.reduce((s, p) => s + p.liquidity, 0);

    return NextResponse.json({
      count: pools.length,
      totalVolume24h: Math.round(totalVolume),
      totalLiquidity: Math.round(totalLiquidity),
      chain: chain || 'all',
      sort,
      pools,
      sources,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    logger.error('DEX fetch failed', { error: String(error) });
    return ApiError.internal('Failed to fetch DEX data');
  }
}

// =============================================================================
// DATA FETCHERS
// =============================================================================

async function fetchDexScreenerSearch(query: string): Promise<DexPool[]> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 60 } },
  );
  if (!res.ok) throw new Error(`DexScreener search ${res.status}`);
  const json = await res.json();
  return (json.pairs || []).map(mapDexScreenerPair);
}

async function fetchDexScreenerByChain(chain: string): Promise<DexPool[]> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${chain}`,
    { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 60 } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json.pairs || []).slice(0, 50).map(mapDexScreenerPair);
}

async function fetchDexScreenerTrending(): Promise<DexPool[]> {
  // Get boosted tokens as trending proxy
  const res = await fetch(
    'https://api.dexscreener.com/token-boosts/latest/v1',
    { headers: { 'User-Agent': 'free-crypto-news/2.0' }, next: { revalidate: 60 } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  // Map boosted tokens to pool format
  return (Array.isArray(json) ? json : []).slice(0, 30).map((t: Record<string, unknown>) => ({
    name: `${t.tokenAddress || 'Unknown'}`,
    chain: (t.chainId as string) || 'unknown',
    dex: 'various',
    pairAddress: (t.tokenAddress as string) || '',
    baseToken: { symbol: '', name: '', address: (t.tokenAddress as string) || '' },
    quoteToken: { symbol: 'USD', name: 'USD', address: '' },
    priceUsd: 0,
    priceChange24h: 0,
    volume24h: 0,
    liquidity: 0,
    txns24h: { buys: 0, sells: 0, total: 0 },
    fdv: 0,
    createdAt: '',
    url: (t.url as string) || '',
  }));
}

async function fetchGeckoTerminalByChain(chain: string): Promise<DexPool[]> {
  const chainMap: Record<string, string> = {
    ethereum: 'eth',
    solana: 'solana',
    base: 'base',
    arbitrum: 'arbitrum',
    bsc: 'bsc',
    polygon: 'polygon_pos',
    avalanche: 'avax',
  };
  const network = chainMap[chain];
  if (!network) return [];

  const res = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools`,
    {
      headers: {
        'User-Agent': 'free-crypto-news/2.0',
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    },
  );
  if (!res.ok) return [];

  const json = await res.json();
  return (json.data || []).map((pool: Record<string, unknown>) => {
    const attrs = (pool.attributes || {}) as Record<string, unknown>;
    return {
      name: (attrs.name as string) || '',
      chain,
      dex: (attrs.dex_id as string) || '',
      pairAddress: (attrs.address as string) || '',
      baseToken: {
        symbol: (attrs.base_token_symbol as string) || '',
        name: '',
        address: '',
      },
      quoteToken: {
        symbol: (attrs.quote_token_symbol as string) || '',
        name: '',
        address: '',
      },
      priceUsd: parseFloat((attrs.base_token_price_usd as string) || '0'),
      priceChange24h: parseFloat((attrs.price_change_percentage as Record<string, string>)?.h24 || '0'),
      volume24h: parseFloat((attrs.volume_usd as Record<string, string>)?.h24 || '0'),
      liquidity: parseFloat((attrs.reserve_in_usd as string) || '0'),
      txns24h: {
        buys: (attrs.transactions as Record<string, Record<string, number>>)?.h24?.buys || 0,
        sells: (attrs.transactions as Record<string, Record<string, number>>)?.h24?.sells || 0,
        total: ((attrs.transactions as Record<string, Record<string, number>>)?.h24?.buys || 0) +
               ((attrs.transactions as Record<string, Record<string, number>>)?.h24?.sells || 0),
      },
      fdv: parseFloat((attrs.fdv_usd as string) || '0'),
      createdAt: (attrs.pool_created_at as string) || '',
      url: `https://www.geckoterminal.com/${network}/pools/${attrs.address}`,
    } satisfies DexPool;
  });
}

 
function mapDexScreenerPair(p: any): DexPool {
  return {
    name: p.baseToken?.symbol && p.quoteToken?.symbol
      ? `${p.baseToken.symbol}/${p.quoteToken.symbol}`
      : p.pairAddress || 'Unknown',
    chain: p.chainId || 'unknown',
    dex: p.dexId || 'unknown',
    pairAddress: p.pairAddress || '',
    baseToken: {
      symbol: p.baseToken?.symbol || '',
      name: p.baseToken?.name || '',
      address: p.baseToken?.address || '',
    },
    quoteToken: {
      symbol: p.quoteToken?.symbol || '',
      name: p.quoteToken?.name || '',
      address: p.quoteToken?.address || '',
    },
    priceUsd: parseFloat(p.priceUsd || '0'),
    priceChange24h: p.priceChange?.h24 || 0,
    volume24h: p.volume?.h24 || 0,
    liquidity: p.liquidity?.usd || 0,
    txns24h: {
      buys: p.txns?.h24?.buys || 0,
      sells: p.txns?.h24?.sells || 0,
      total: (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
    },
    fdv: p.fdv || 0,
    createdAt: p.pairCreatedAt || '',
    url: p.url || '',
  };
}
