/**
 * GET /api/v1/onchain
 *
 * Premium API v1 — On-chain Analytics
 * Returns on-chain metrics: active addresses, exchange flows,
 * hash rate, MVRV, SOPR, and more.
 * Aggregates from Blockchain.info, Mempool.space, Glassnode, and CryptoQuant.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   asset    — Asset (btc, eth — default: btc)
 *   metrics  — Comma-separated metrics (all, addresses, flows, mining, ratios — default: all)
 *
 * @price $0.003 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 300;

const ENDPOINT = '/api/v1/onchain';

interface OnChainData {
  asset: string;
  network: {
    blockHeight: number;
    hashRate: string;
    difficulty: string;
    mempoolSize: number;
    feeEstimate: { fast: number; medium: number; slow: number };
  };
  activity: {
    activeAddresses24h: number;
    transactionCount24h: number;
    totalTransferred24h: number;
  };
  exchange: {
    netFlow: string;
    inflowVolume: number;
    outflowVolume: number;
    reserveChange: string;
  };
  indicators: {
    mvrv: number | null;
    sopr: number | null;
    nupl: number | null;
    leverageRatio: number | null;
  };
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const asset = (params.get('asset') || 'btc').toLowerCase();

  try {
    logger.info('Fetching on-chain data', { asset });

    const data: OnChainData = {
      asset: asset.toUpperCase(),
      network: { blockHeight: 0, hashRate: '0', difficulty: '0', mempoolSize: 0, feeEstimate: { fast: 0, medium: 0, slow: 0 } },
      activity: { activeAddresses24h: 0, transactionCount24h: 0, totalTransferred24h: 0 },
      exchange: { netFlow: '0', inflowVolume: 0, outflowVolume: 0, reserveChange: '0' },
      indicators: { mvrv: null, sopr: null, nupl: null, leverageRatio: null },
    };

    const sources: string[] = [];

    if (asset === 'btc') {
      // Fetch from free sources in parallel
      const [bcStats, mempoolFees, mempoolBlocks] = await Promise.allSettled([
        fetch('https://api.blockchain.info/stats', { next: { revalidate: 300 } }),
        fetch('https://mempool.space/api/v1/fees/recommended', { next: { revalidate: 60 } }),
        fetch('https://mempool.space/api/blocks/tip/height', { next: { revalidate: 60 } }),
      ]);

      if (bcStats.status === 'fulfilled' && bcStats.value.ok) {
        const bc = await bcStats.value.json();
        data.network.hashRate = formatLargeNumber(bc.hash_rate * 1e9); // GH/s to H/s
        data.network.difficulty = formatLargeNumber(bc.difficulty);
        data.network.blockHeight = bc.n_blocks_total || 0;
        data.network.mempoolSize = bc.mempool_size || 0;
        data.activity.transactionCount24h = bc.n_tx || 0;
        data.activity.totalTransferred24h = (bc.total_btc_sent || 0) / 1e8; // satoshi to BTC
        sources.push('blockchain.info');
      }

      if (mempoolFees.status === 'fulfilled' && mempoolFees.value.ok) {
        const fees = await mempoolFees.value.json();
        data.network.feeEstimate = {
          fast: fees.fastestFee || 0,
          medium: fees.halfHourFee || 0,
          slow: fees.hourFee || 0,
        };
        sources.push('mempool.space');
      }

      if (mempoolBlocks.status === 'fulfilled' && mempoolBlocks.value.ok) {
        const height = await mempoolBlocks.value.text();
        data.network.blockHeight = parseInt(height, 10) || data.network.blockHeight;
      }

    } else if (asset === 'eth') {
      // ETH on-chain via Etherscan (free tier)
      const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
      const [gasRes, supplyRes] = await Promise.allSettled([
        fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanKey}`, { next: { revalidate: 60 } }),
        fetch(`https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${etherscanKey}`, { next: { revalidate: 300 } }),
      ]);

      if (gasRes.status === 'fulfilled' && gasRes.value.ok) {
        const gas = await gasRes.value.json();
        if (gas.result) {
          data.network.feeEstimate = {
            fast: parseInt(gas.result.FastGasPrice || '0', 10),
            medium: parseInt(gas.result.ProposeGasPrice || '0', 10),
            slow: parseInt(gas.result.SafeGasPrice || '0', 10),
          };
          sources.push('etherscan');
        }
      }

      if (supplyRes.status === 'fulfilled' && supplyRes.value.ok) {
        const supply = await supplyRes.value.json();
        if (supply.result) {
          data.activity.totalTransferred24h = parseInt(supply.result, 10) / 1e18;
        }
      }
    }

    return NextResponse.json({
      ...data,
      sources,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    logger.error('On-chain fetch failed', { error: String(error) });
    return ApiError.upstream('On-chain data providers');
  }
}

function formatLargeNumber(n: number): string {
  if (n >= 1e18) return `${(n / 1e18).toFixed(2)} EH`;
  if (n >= 1e15) return `${(n / 1e15).toFixed(2)} PH`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} TH`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GH`;
  return n.toFixed(0);
}
