import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/whales
 * 
 * Alias for /api/whale-alerts with MCP-friendly response format
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';
  const min_usd = searchParams.get('min_usd') || '1000000';
  
  // Forward to whale-alerts endpoint
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cryptocurrency.cv';
  
  try {
    const response = await fetch(
      `${baseUrl}/api/whale-alerts?limit=${limit}&min_usd=${min_usd}`,
      { next: { revalidate: 60 } }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch whale alerts');
    }
    
    const data = await response.json();
    
    // Transform for MCP-friendly format
    return NextResponse.json({
      alerts: (data.alerts || []).map((alert: {
        id: string;
        blockchain: string;
        symbol: string;
        amount: number;
        amountUsd: number;
        from: { address: string; owner?: string };
        to: { address: string; owner?: string };
        hash: string;
        timestamp: number;
        transactionType: string;
        significance: string;
      }) => ({
        hash: alert.hash,
        blockchain: alert.blockchain,
        symbol: alert.symbol,
        amount: alert.amount,
        usd_value: alert.amountUsd,
        from: alert.from?.owner || alert.from?.address?.slice(0, 10) + '...',
        to: alert.to?.owner || alert.to?.address?.slice(0, 10) + '...',
        type: alert.transactionType,
        significance: alert.significance,
        timestamp: alert.timestamp,
      })),
      summary: data.summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Whales API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whale alerts' },
      { status: 500 }
    );
  }
}
