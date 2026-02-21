import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedFees } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 30;

/**
 * GET /api/gas/estimate
 * Returns unified gas/fee estimates for Ethereum or Bitcoin.
 * Query params:
 *   - network: 'ethereum' | 'bitcoin' (default 'ethereum')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get('network') || 'ethereum').toLowerCase();

    if (network !== 'ethereum' && network !== 'bitcoin') {
      return NextResponse.json(
        { error: 'Invalid network', message: "network must be 'ethereum' or 'bitcoin'" },
        { status: 400 },
      );
    }

    if (network === 'bitcoin') {
      const fees = await getRecommendedFees();
      return NextResponse.json(
        {
          network: 'bitcoin',
          unit: 'sat/vB',
          fast: {
            value: fees.fastestFee,
            label: 'Next block (~10 min)',
          },
          standard: {
            value: fees.halfHourFee,
            label: '~30 minutes',
          },
          slow: {
            value: fees.hourFee,
            label: '~1 hour',
          },
          economy: {
            value: fees.economyFee,
            label: 'Economy (no priority)',
          },
          minimum: fees.minimumFee,
          timestamp: new Date().toISOString(),
          source: 'mempool.space',
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // Ethereum gas via Etherscan
    const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
    const etherscanUrl = `https://api.etherscan.io/api?module=gastracker&action=gasoracle${etherscanKey ? `&apikey=${etherscanKey}` : ''}`;

    const response = await fetch(etherscanUrl, {
      next: { revalidate: 30 },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return NextResponse.json(
          {
            network: 'ethereum',
            unit: 'gwei',
            baseFee: parseFloat(data.result.suggestBaseFee) || null,
            fast: {
              value: parseInt(data.result.FastGasPrice),
              label: 'Fast (~15 sec)',
            },
            standard: {
              value: parseInt(data.result.ProposeGasPrice),
              label: 'Standard (~30 sec)',
            },
            slow: {
              value: parseInt(data.result.SafeGasPrice),
              label: 'Safe (~1 min)',
            },
            lastBlock: data.result.LastBlock,
            timestamp: new Date().toISOString(),
            source: 'etherscan',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
    }

    // Fallback estimate
    return NextResponse.json(
      {
        network: 'ethereum',
        unit: 'gwei',
        baseFee: null,
        fast: { value: 50, label: 'Fast (~15 sec)' },
        standard: { value: 30, label: 'Standard (~30 sec)' },
        slow: { value: 20, label: 'Safe (~1 min)' },
        lastBlock: null,
        timestamp: new Date().toISOString(),
        source: 'estimate',
        note: 'Estimates based on typical gas prices. Add ETHERSCAN_API_KEY for live data.',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gas estimate', message: String(error) },
      { status: 500 },
    );
  }
}
