import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedFees } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/gas/history
 * Returns gas/fee history for Ethereum or Bitcoin networks.
 * Query params:
 *   - network: 'ethereum' | 'bitcoin' (default 'ethereum')
 *   - days: number (default 7)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const network = (searchParams.get('network') || 'ethereum').toLowerCase();
    const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 30);

    if (network !== 'ethereum' && network !== 'bitcoin') {
      return NextResponse.json(
        { error: 'Invalid network', message: "network must be 'ethereum' or 'bitcoin'" },
        { status: 400 },
      );
    }

    if (network === 'bitcoin') {
      // Current BTC fee snapshot — mempool.space doesn't provide historical fees via free API
      const fees = await getRecommendedFees();
      return NextResponse.json(
        {
          network: 'bitcoin',
          current: fees,
          history: [
            {
              timestamp: new Date().toISOString(),
              fastestFee: fees.fastestFee,
              halfHourFee: fees.halfHourFee,
              hourFee: fees.hourFee,
              economyFee: fees.economyFee,
              minimumFee: fees.minimumFee,
            },
          ],
          note: 'Bitcoin fee history is a current snapshot. Historical data requires a paid provider.',
          days,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // Ethereum gas history via Etherscan
    const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
    const etherscanUrl = `https://api.etherscan.io/api?module=gastracker&action=gasoracle${etherscanKey ? `&apikey=${etherscanKey}` : ''}`;

    const response = await fetch(etherscanUrl, {
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.status === '1' && data.result) {
        const current = {
          baseFee: parseFloat(data.result.suggestBaseFee) || null,
          low: parseInt(data.result.SafeGasPrice),
          medium: parseInt(data.result.ProposeGasPrice),
          high: parseInt(data.result.FastGasPrice),
          lastBlock: data.result.LastBlock,
        };

        return NextResponse.json(
          {
            network: 'ethereum',
            current,
            history: [
              {
                timestamp: new Date().toISOString(),
                ...current,
              },
            ],
            note: 'Ethereum gas history shows current snapshot. Full historical charts require a premium Etherscan plan.',
            days,
            source: 'etherscan',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
    }

    // Fallback
    return NextResponse.json(
      {
        network: 'ethereum',
        current: {
          baseFee: null,
          low: 20,
          medium: 30,
          high: 50,
        },
        history: [],
        note: 'Add ETHERSCAN_API_KEY for live Ethereum gas data.',
        days,
        source: 'estimate',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gas history', message: String(error) },
      { status: 500 },
    );
  }
}
