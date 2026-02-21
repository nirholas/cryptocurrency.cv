import { NextRequest, NextResponse } from 'next/server';
import { getTransaction } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/bitcoin/tx/[txid]
 * Returns a Bitcoin transaction by its ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ txid: string }> }
): Promise<NextResponse> {
  const { txid } = await params;

  if (!txid) {
    return NextResponse.json(
      { error: 'Transaction ID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getTransaction(txid);

    if (!data) {
      return NextResponse.json(
        { error: 'Transaction not found', message: `No transaction found for txid "${txid}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const errorMsg = String(error);
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      return NextResponse.json(
        { error: 'Transaction not found', message: `No transaction found for txid "${txid}"` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch transaction', message: errorMsg },
      { status: 500 }
    );
  }
}
