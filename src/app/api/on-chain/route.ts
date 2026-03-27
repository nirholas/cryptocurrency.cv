/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/providers/registry';
import type { OnChainMetric } from '@/lib/providers/adapters/on-chain';
import { ApiError } from '@/lib/api-error';
import { BLOCKCHAIN_INFO_BASE, MEMPOOL_BASE } from '@/lib/constants';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * On-Chain Metrics API — Bitcoin & Ethereum network data
 *
 * Uses provider framework (Blockchain.info + Etherscan + Mempool.space + Santiment + Dune)
 * with circuit breakers and caching, falling back to direct API calls.
 *
 * GET /api/on-chain             — all available on-chain metrics
 * GET /api/on-chain?chain=btc   — Bitcoin metrics only
 * GET /api/on-chain?chain=eth   — Ethereum metrics only
 * GET /api/on-chain?metric=gas  — Gas/fee metrics only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain')?.toLowerCase();
    const metricFilter = searchParams.get('metric')?.toLowerCase();

    // Layer 1: Provider framework (broadcast across Blockchain.info, Etherscan, Mempool.space, Santiment, Dune)
    try {
      const result = await registry.fetch<OnChainMetric[]>('on-chain', { chain });
      let metrics = result.data;

      // Apply chain filter (map shorthand to full name)
      if (chain) {
        const chainMap: Record<string, string> = {
          btc: 'bitcoin', bitcoin: 'bitcoin',
          eth: 'ethereum', ethereum: 'ethereum',
        };
        const fullChain = chainMap[chain] ?? chain;
        metrics = metrics.filter(m => m.asset.toLowerCase() === fullChain);
      }

      // Apply metric filter
      if (metricFilter) {
        metrics = metrics.filter(m => m.metricId.includes(metricFilter) || m.name.toLowerCase().includes(metricFilter));
      }

      // Map to legacy response shape
      const data = metrics.map(m => ({
        metric: m.metricId,
        chain: m.asset,
        value: m.value,
        unit: m.unit,
        source: m.source,
      }));

      return NextResponse.json({
        count: data.length,
        data,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Provider': result.lineage.provider,
          'X-Cache': result.cached ? 'HIT' : 'MISS',
        },
      });
    } catch (err) { console.warn('[on-chain] Provider chain miss, falling back to direct API', err); }

    // Layer 2: Direct API fallback (legacy)
    const results: Record<string, unknown>[] = [];

    // Bitcoin data (Blockchain.info + Mempool.space)
    if (!chain || chain === 'btc' || chain === 'bitcoin') {
      const [bcResponse, mempoolResponse] = await Promise.allSettled([
        fetch(`${BLOCKCHAIN_INFO_BASE}/stats`),
        fetch(`${MEMPOOL_BASE}/v1/fees/recommended`),
      ]);

      if (bcResponse.status === 'fulfilled' && bcResponse.value.ok) {
        const bc = await bcResponse.value.json();
        results.push(
          { metric: 'hash_rate', chain: 'bitcoin', value: bc.hash_rate, unit: 'TH/s', source: 'blockchain.info' },
          { metric: 'difficulty', chain: 'bitcoin', value: bc.difficulty, unit: '', source: 'blockchain.info' },
          { metric: 'block_height', chain: 'bitcoin', value: bc.n_blocks_total, unit: 'blocks', source: 'blockchain.info' },
          { metric: 'transactions_24h', chain: 'bitcoin', value: bc.n_tx, unit: 'txs', source: 'blockchain.info' },
          { metric: 'btc_mined_24h', chain: 'bitcoin', value: (bc.n_btc_mined ?? 0) / 1e8, unit: 'BTC', source: 'blockchain.info' },
          { metric: 'market_price_usd', chain: 'bitcoin', value: bc.market_price_usd, unit: 'USD', source: 'blockchain.info' },
        );
      }

      if (mempoolResponse.status === 'fulfilled' && mempoolResponse.value.ok) {
        const fees = await mempoolResponse.value.json();
        results.push(
          { metric: 'fee_fastest', chain: 'bitcoin', value: fees.fastestFee, unit: 'sat/vB', source: 'mempool.space' },
          { metric: 'fee_halfhour', chain: 'bitcoin', value: fees.halfHourFee, unit: 'sat/vB', source: 'mempool.space' },
          { metric: 'fee_hour', chain: 'bitcoin', value: fees.hourFee, unit: 'sat/vB', source: 'mempool.space' },
          { metric: 'fee_economy', chain: 'bitcoin', value: fees.economyFee, unit: 'sat/vB', source: 'mempool.space' },
          { metric: 'fee_minimum', chain: 'bitcoin', value: fees.minimumFee, unit: 'sat/vB', source: 'mempool.space' },
        );
      }
    }

    // Ethereum data (Etherscan)
    if (!chain || chain === 'eth' || chain === 'ethereum') {
      const ethKey = process.env.ETHERSCAN_API_KEY;
      if (ethKey) {
        const [gasResponse, supplyResponse] = await Promise.allSettled([
          fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ethKey}`),
          fetch(`https://api.etherscan.io/api?module=stats&action=ethsupply2&apikey=${ethKey}`),
        ]);

        if (gasResponse.status === 'fulfilled' && gasResponse.value.ok) {
          const json = await gasResponse.value.json();
          const gas = json?.result;
          if (gas) {
            results.push(
              { metric: 'gas_safe', chain: 'ethereum', value: parseFloat(gas.SafeGasPrice ?? '0'), unit: 'gwei', source: 'etherscan' },
              { metric: 'gas_standard', chain: 'ethereum', value: parseFloat(gas.ProposeGasPrice ?? '0'), unit: 'gwei', source: 'etherscan' },
              { metric: 'gas_fast', chain: 'ethereum', value: parseFloat(gas.FastGasPrice ?? '0'), unit: 'gwei', source: 'etherscan' },
              { metric: 'base_fee', chain: 'ethereum', value: parseFloat(gas.suggestBaseFee ?? '0'), unit: 'gwei', source: 'etherscan' },
            );
          }
        }

        if (supplyResponse.status === 'fulfilled' && supplyResponse.value.ok) {
          const json = await supplyResponse.value.json();
          const supply = json?.result;
          if (supply) {
            results.push(
              { metric: 'total_supply', chain: 'ethereum', value: parseFloat(supply.EthSupply ?? '0') / 1e18, unit: 'ETH', source: 'etherscan' },
              { metric: 'eth_staked', chain: 'ethereum', value: parseFloat(supply.Eth2Staking ?? '0') / 1e18, unit: 'ETH', source: 'etherscan' },
              { metric: 'eth_burnt', chain: 'ethereum', value: parseFloat(supply.BurntFees ?? '0') / 1e18, unit: 'ETH', source: 'etherscan' },
            );
          }
        }
      }
    }

    // Filter by metric type
    let filtered = results;
    if (metricFilter) {
      filtered = results.filter(r => String(r.metric).includes(metricFilter));
    }

    return NextResponse.json({
      count: filtered.length,
      data: filtered,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'DIRECT',
      },
    });
  } catch (error) {
    console.error('On-chain API error:', error);
    return ApiError.internal('Failed to fetch on-chain data');
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
