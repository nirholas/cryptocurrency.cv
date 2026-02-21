import { NextRequest, NextResponse } from 'next/server';
import { getProtocolData } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

const VALID_PROTOCOLS = ['uniswap', 'aave', 'curve'] as const;
type ValidProtocol = (typeof VALID_PROTOCOLS)[number];

/**
 * GET /api/onchain/protocol/[protocol]
 * Returns aggregated data for a specific DeFi protocol
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ protocol: string }> }
): Promise<NextResponse> {
  const { protocol } = await params;

  if (!protocol) {
    return NextResponse.json({ error: 'Protocol is required' }, { status: 400 });
  }

  const normalizedProtocol = protocol.toLowerCase();
  if (!VALID_PROTOCOLS.includes(normalizedProtocol as ValidProtocol)) {
    return NextResponse.json(
      { error: 'Invalid protocol', message: 'Protocol must be one of: uniswap, aave, curve' },
      { status: 400 }
    );
  }

  try {
    const data = await getProtocolData(normalizedProtocol as ValidProtocol);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch protocol data', message: String(error) },
      { status: 500 }
    );
  }
}
