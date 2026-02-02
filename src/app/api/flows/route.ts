import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

/**
 * GET /api/flows
 * 
 * Get exchange inflow/outflow data for cryptocurrencies
 * Positive netflow = more going to exchanges (selling pressure)
 * Negative netflow = more leaving exchanges (accumulation)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coin = searchParams.get('coin')?.toLowerCase() || 'bitcoin';

  try {
    // CryptoQuant has exchange flow data but requires API key
    // For now, use aggregated on-chain metrics from public sources
    
    // Check if we have CryptoQuant API key
    const cryptoquantKey = process.env.CRYPTOQUANT_API_KEY;
    
    if (cryptoquantKey) {
      // Use CryptoQuant API
      const response = await fetch(
        `https://api.cryptoquant.com/v1/btc/exchange-flows/netflow?window=day`,
        {
          headers: { 'Authorization': `Bearer ${cryptoquantKey}` },
          next: { revalidate: 300 },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          coin,
          flows: data.result,
          source: 'cryptoquant',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Fallback: Use Glassnode-style metrics simulation based on public data
    // In production, integrate with on-chain data providers
    
    // For demo, return structure with note about data source
    const mockFlows = {
      coin,
      period: '24h',
      exchanges: {
        inflow: {
          btc: coin === 'bitcoin' ? 12500 : 85000,
          usd: coin === 'bitcoin' ? 1237500000 : 289000000,
        },
        outflow: {
          btc: coin === 'bitcoin' ? 15200 : 92000,
          usd: coin === 'bitcoin' ? 1504800000 : 312800000,
        },
        netflow: {
          btc: coin === 'bitcoin' ? -2700 : -7000,
          usd: coin === 'bitcoin' ? -267300000 : -23800000,
        },
      },
      interpretation: coin === 'bitcoin' 
        ? 'Net outflow from exchanges (accumulation signal)'
        : 'Net outflow from exchanges (accumulation signal)',
      topExchanges: [
        { name: 'Binance', netflow: coin === 'bitcoin' ? -1200 : -3500 },
        { name: 'Coinbase', netflow: coin === 'bitcoin' ? -800 : -2100 },
        { name: 'Kraken', netflow: coin === 'bitcoin' ? -400 : -900 },
        { name: 'OKX', netflow: coin === 'bitcoin' ? -300 : -500 },
      ],
      timestamp: new Date().toISOString(),
      source: 'simulated',
      note: 'Add CRYPTOQUANT_API_KEY for real exchange flow data',
    };

    return NextResponse.json(mockFlows);
  } catch (error) {
    console.error('Flows API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange flows' },
      { status: 500 }
    );
  }
}
