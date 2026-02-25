import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * On-Chain Metrics API — Bitcoin & Ethereum network data
 *
 * Aggregates from Blockchain.info, Mempool.space, and Etherscan.
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

    const results: Record<string, unknown>[] = [];

    // Bitcoin data (Blockchain.info + Mempool.space)
    if (!chain || chain === 'btc' || chain === 'bitcoin') {
      const [bcResponse, mempoolResponse] = await Promise.allSettled([
        fetch('https://api.blockchain.info/stats'),
        fetch('https://mempool.space/api/v1/fees/recommended'),
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
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch on-chain data', message: String(error) },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
