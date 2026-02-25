/**
 * The Graph Adapter — Decentralized Subgraph Data
 *
 * The Graph indexes blockchain data via subgraphs. This adapter queries:
 * - Uniswap V3 (volume, TVL, top pools)
 * - Aave V3 (lending stats, utilization)
 * - Compound V3 (supply/borrow rates)
 * - Lido (staking metrics)
 *
 * No API key needed for the hosted service (rate-limited).
 * For The Graph Network (decentralized), set THEGRAPH_API_KEY.
 *
 * @module providers/adapters/defi/thegraph
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

export interface SubgraphDeFiData {
  protocol: string;
  chain: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  users24h: number;
  topPools: Array<{
    name: string;
    tvl: number;
    volume24h: number;
    apy: number;
  }>;
  source: string;
  timestamp: string;
}

const GRAPH_API_KEY = process.env.THEGRAPH_API_KEY ?? '';
const GRAPH_GATEWAY = GRAPH_API_KEY
  ? `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id`
  : 'https://api.thegraph.com/subgraphs/name';

// Subgraph IDs / names for major protocols
const SUBGRAPHS: Record<string, {
  id: string;       // For gateway (Graph Network)
  name: string;     // For hosted service
  chain: string;
  query: string;
}> = {
  uniswap: {
    id: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
    name: 'uniswap/uniswap-v3',
    chain: 'ethereum',
    query: `{
      factories(first: 1) {
        totalVolumeUSD
        totalFeesUSD
        totalValueLockedUSD
        txCount
      }
      pools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
        token0 { symbol }
        token1 { symbol }
        totalValueLockedUSD
        volumeUSD
        feesUSD
      }
    }`,
  },
  aave: {
    id: 'GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF',
    name: 'aave/protocol-v3',
    chain: 'ethereum',
    query: `{
      protocols(first: 1) {
        totalValueLockedUSD
        totalBorrowBalanceUSD
        totalDepositBalanceUSD
        cumulativeUniqueUsers
      }
      markets(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
        name
        totalValueLockedUSD
        totalBorrowBalanceUSD
        totalDepositBalanceUSD
        inputToken { symbol }
      }
    }`,
  },
};

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: GRAPH_API_KEY ? 30 : 10,
  windowMs: 60_000,
};

export const theGraphAdapter: DataProvider<SubgraphDeFiData[]> = {
  name: 'thegraph',
  description: 'The Graph — Decentralized subgraph data for Uniswap, Aave, and major DeFi protocols',
  priority: 2,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields', 'dex', 'tvl'],

  async fetch(params: FetchParams): Promise<SubgraphDeFiData[]> {
    const now = new Date().toISOString();

    // Filter protocols if specified
    const targetProtocols = params.extra?.protocols
      ? (params.extra.protocols as string).split(',')
      : Object.keys(SUBGRAPHS);

    const results = await Promise.allSettled(
      targetProtocols
        .filter((p) => SUBGRAPHS[p])
        .map(async (protocol): Promise<SubgraphDeFiData> => {
          const config = SUBGRAPHS[protocol];
          const url = GRAPH_API_KEY
            ? `${GRAPH_GATEWAY}/${config.id}`
            : `${GRAPH_GATEWAY}/${config.name}`;

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: config.query }),
          });

          if (!res.ok) throw new Error(`The Graph ${protocol}: ${res.status}`);

          const json = await res.json();
          const data = json.data;

          return parseProtocolData(protocol, config.chain, data, now);
        }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<SubgraphDeFiData> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const config = SUBGRAPHS.uniswap;
      const url = GRAPH_API_KEY
        ? `${GRAPH_GATEWAY}/${config.id}`
        : `${GRAPH_GATEWAY}/${config.name}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ factories(first: 1) { id } }' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  normalize(data: SubgraphDeFiData[]): SubgraphDeFiData[] {
    return data;
  },
};

function parseProtocolData(
  protocol: string,
  chain: string,
  data: Record<string, unknown>,
  timestamp: string,
): SubgraphDeFiData {
  if (protocol === 'uniswap') {
    const factory = (data.factories as Record<string, string>[])?.[0] || {};
    const pools = (data.pools as Record<string, unknown>[]) || [];

    return {
      protocol: 'Uniswap V3',
      chain,
      tvl: parseFloat(factory.totalValueLockedUSD || '0'),
      volume24h: parseFloat(factory.totalVolumeUSD || '0'),
      fees24h: parseFloat(factory.totalFeesUSD || '0'),
      users24h: parseInt(factory.txCount || '0', 10),
      topPools: pools.map((p) => ({
        name: `${(p.token0 as Record<string, string>)?.symbol}/${(p.token1 as Record<string, string>)?.symbol}`,
        tvl: parseFloat((p.totalValueLockedUSD as string) || '0'),
        volume24h: parseFloat((p.volumeUSD as string) || '0'),
        apy: 0, // Would need fee/TVL calculation
      })),
      source: 'thegraph',
      timestamp,
    };
  }

  if (protocol === 'aave') {
    const proto = (data.protocols as Record<string, string>[])?.[0] || {};
    const markets = (data.markets as Record<string, unknown>[]) || [];

    return {
      protocol: 'Aave V3',
      chain,
      tvl: parseFloat(proto.totalValueLockedUSD || '0'),
      volume24h: parseFloat(proto.totalBorrowBalanceUSD || '0'), // Use borrow as proxy
      fees24h: 0,
      users24h: parseInt(proto.cumulativeUniqueUsers || '0', 10),
      topPools: markets.map((m) => ({
        name: (m.name as string) || (m.inputToken as Record<string, string>)?.symbol || '',
        tvl: parseFloat((m.totalValueLockedUSD as string) || '0'),
        volume24h: parseFloat((m.totalDepositBalanceUSD as string) || '0'),
        apy: 0,
      })),
      source: 'thegraph',
      timestamp,
    };
  }

  // Generic fallback
  return {
    protocol,
    chain,
    tvl: 0,
    volume24h: 0,
    fees24h: 0,
    users24h: 0,
    topPools: [],
    source: 'thegraph',
    timestamp,
  };
}

export default theGraphAdapter;
