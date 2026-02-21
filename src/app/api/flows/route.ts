/**
 * Exchange Flows API — real on-chain data + AI interpretation
 *
 * GET /api/flows?coin=bitcoin
 *
 * Data sources (all free, no API key required):
 *  • Blockchain.com Charts API — BTC exchange balance over time
 *  • CoinGecko free API       — market data (volume, price change)
 *  • DeFi Llama               — DEX volume as proxy for on-chain activity
 *  • Groq AI                  — natural language interpretation of the data
 *
 * Falls back to CryptoQuant if CRYPTOQUANT_API_KEY is set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGroq, isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 300; // 5-minute cache

// ──────────────────────────────────────────────────────────────────────────────
// CoinGecko ID map
// ──────────────────────────────────────────────────────────────────────────────

const COINGECKO_IDS: Record<string, string> = {
  bitcoin: 'bitcoin', btc: 'bitcoin',
  ethereum: 'ethereum', eth: 'ethereum',
  solana: 'solana', sol: 'solana',
  bnb: 'binancecoin',
  xrp: 'ripple',
  cardano: 'cardano', ada: 'cardano',
  avalanche: 'avalanche-2', avax: 'avalanche-2',
  dogecoin: 'dogecoin', doge: 'dogecoin',
  polkadot: 'polkadot', dot: 'polkadot',
};

function getCoinGeckoId(coin: string): string {
  return COINGECKO_IDS[coin.toLowerCase()] ?? coin.toLowerCase();
}

// ──────────────────────────────────────────────────────────────────────────────
// Data fetchers
// ──────────────────────────────────────────────────────────────────────────────

interface MarketData {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  symbol: string;
  name: string;
}

async function fetchCoinGeckoMarket(coinId: string): Promise<MarketData | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const md = data.market_data;
    return {
      price: md.current_price?.usd ?? 0,
      priceChange24h: md.price_change_24h ?? 0,
      priceChangePercent24h: md.price_change_percentage_24h ?? 0,
      volume24h: md.total_volume?.usd ?? 0,
      marketCap: md.market_cap?.usd ?? 0,
      symbol: data.symbol?.toUpperCase() ?? coinId.toUpperCase(),
      name: data.name ?? coinId,
    };
  } catch { return null; }
}

interface BtcExchangeFlow {
  currentBalance: number;
  previousBalance: number;
  netChange: number;
  netChangeUsd: number;
}

async function fetchBtcExchangeFlow(btcPrice: number): Promise<BtcExchangeFlow | null> {
  try {
    const res = await fetch(
      'https://api.blockchain.info/charts/exchange-balance?timespan=2days&format=json&cors=true',
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data: { values: Array<{ x: number; y: number }> } = await res.json();
    const values = data.values ?? [];
    if (values.length < 2) return null;
    const current = values[values.length - 1].y;
    const previous = values[Math.max(0, values.length - 2)].y;
    const netChange = current - previous;
    return { currentBalance: current, previousBalance: previous, netChange, netChangeUsd: netChange * btcPrice };
  } catch { return null; }
}

interface DexVolume { total24h: number; change24h: number | null; }

async function fetchDexVolume(): Promise<DexVolume | null> {
  try {
    const res = await fetch(
      'https://api.llama.fi/overview/dexes?excludeTotalDataChartBreakdown=true&excludeTotalDataChart=false',
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { total24h: data.total24h ?? 0, change24h: data.change_1d ?? null };
  } catch { return null; }
}

// ──────────────────────────────────────────────────────────────────────────────
// AI interpretation
// ──────────────────────────────────────────────────────────────────────────────

async function generateInterpretation(
  coin: string,
  market: MarketData | null,
  btcFlow: BtcExchangeFlow | null,
  dex: DexVolume | null
): Promise<string> {
  const dataPoints: string[] = [];

  if (market) {
    dataPoints.push(
      `${market.name} (${market.symbol}): $${market.price.toLocaleString()}, ${market.priceChangePercent24h > 0 ? '+' : ''}${market.priceChangePercent24h.toFixed(2)}% in 24h`,
      `24h trading volume: $${(market.volume24h / 1e9).toFixed(2)}B`
    );
  }
  if (btcFlow && coin === 'bitcoin') {
    const direction = btcFlow.netChange < 0 ? 'outflow (accumulation)' : 'inflow (selling pressure)';
    dataPoints.push(
      `BTC on exchanges: ${btcFlow.currentBalance.toFixed(0)} BTC total`,
      `24h net flow: ${btcFlow.netChange > 0 ? '+' : ''}${btcFlow.netChange.toFixed(0)} BTC (${direction}) = $${Math.abs(btcFlow.netChangeUsd / 1e6).toFixed(1)}M`
    );
  }
  if (dex) {
    dataPoints.push(
      `DEX volume (24h): $${(dex.total24h / 1e9).toFixed(2)}B${dex.change24h !== null ? ` (${dex.change24h > 0 ? '+' : ''}${dex.change24h.toFixed(1)}% vs yesterday)` : ''}`
    );
  }

  if (!isGroqConfigured()) {
    if (btcFlow)
      return btcFlow.netChange < 0
        ? `Net outflow of ${Math.abs(btcFlow.netChange).toFixed(0)} BTC from exchanges — accumulation signal.`
        : `Net inflow of ${btcFlow.netChange.toFixed(0)} BTC to exchanges — potential selling pressure.`;
    if (market)
      return `${market.name} ${market.priceChangePercent24h > 0 ? 'up' : 'down'} ${Math.abs(market.priceChangePercent24h).toFixed(1)}% in 24h with $${(market.volume24h / 1e9).toFixed(1)}B volume.`;
    return 'On-chain data unavailable. Add GROQ_API_KEY for AI-powered interpretation.';
  }

  if (dataPoints.length === 0) return 'No on-chain data available for interpretation.';

  try {
    const response = await callGroq(
      [
        { role: 'system', content: 'You are a concise on-chain analyst. Give a clear 2-3 sentence read of the data.' },
        {
          role: 'user',
          content: `On-chain and market data for ${coin}:\n${dataPoints.join('\n')}\n\nWrite 2-3 sentences interpreting what these flows signal for ${coin} over the next 24-48 hours. Be specific and direct — no "may" or "might".`,
        },
      ],
      { maxTokens: 200, temperature: 0.3 }
    );
    return response.content.trim();
  } catch {
    return dataPoints.join('. ');
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coin = searchParams.get('coin')?.toLowerCase() || 'bitcoin';

  try {
    // CryptoQuant takes priority if API key is set
    const cryptoquantKey = process.env.CRYPTOQUANT_API_KEY;
    if (cryptoquantKey) {
      const res = await fetch(
        `https://api.cryptoquant.com/v1/btc/exchange-flows/netflow?window=day`,
        { headers: { Authorization: `Bearer ${cryptoquantKey}` }, next: { revalidate: 300 } }
      );
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ coin, flows: data.result, source: 'cryptoquant', timestamp: new Date().toISOString() });
      }
    }

    const coinGeckoId = getCoinGeckoId(coin);

    // Fetch all free data sources in parallel
    const [market, btcFlowRaw, dex] = await Promise.all([
      fetchCoinGeckoMarket(coinGeckoId),
      coin === 'bitcoin' ? fetchBtcExchangeFlow(0) : Promise.resolve(null),
      fetchDexVolume(),
    ]);

    // Recalculate USD value now that we have price
    const btcFlow: BtcExchangeFlow | null =
      btcFlowRaw && market
        ? { ...btcFlowRaw, netChangeUsd: btcFlowRaw.netChange * market.price }
        : btcFlowRaw;

    const interpretation = await generateInterpretation(coin, market, btcFlow, dex);

    const signal = btcFlow
      ? btcFlow.netChange < 0 ? 'accumulation' : 'distribution'
      : market
      ? market.priceChangePercent24h > 1 ? 'bullish' : market.priceChangePercent24h < -1 ? 'bearish' : 'neutral'
      : 'unknown';

    return NextResponse.json({
      coin: market?.name?.toLowerCase() ?? coin,
      symbol: market?.symbol ?? coin.toUpperCase(),
      period: '24h',
      timestamp: new Date().toISOString(),
      sources: [
        ...(btcFlow ? ['blockchain.com'] : []),
        ...(market ? ['coingecko'] : []),
        ...(dex ? ['defillama'] : []),
      ],
      market: market
        ? {
            price: market.price,
            priceChange24h: market.priceChange24h,
            priceChangePercent24h: market.priceChangePercent24h,
            volume24h: market.volume24h,
            marketCap: market.marketCap,
          }
        : null,
      exchangeBalance: btcFlow
        ? {
            current: btcFlow.currentBalance,
            previous: btcFlow.previousBalance,
            netChange: btcFlow.netChange,
            netChangeUsd: btcFlow.netChangeUsd,
            unit: 'BTC',
          }
        : null,
      dex: dex ? { volume24h: dex.total24h, change24h: dex.change24h } : null,
      interpretation,
      signal,
    });
  } catch (error) {
    console.error('Flows API error:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange flows' }, { status: 500 });
  }
}

