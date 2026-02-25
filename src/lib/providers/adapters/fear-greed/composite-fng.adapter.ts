/**
 * Composite Fear & Greed Index Adapter
 *
 * Our OWN proprietary index combining:
 * - BTC 30-day realized volatility
 * - BTC momentum (SMA 50 vs SMA 200 proxy using price trend)
 * - Social sentiment (from social-metrics chain if available)
 * - BTC dominance change
 *
 * This is a differentiator — no API key needed, fully self-computed.
 *
 * @module providers/adapters/fear-greed/composite-fng
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { FearGreedIndex } from './alternative-me.adapter';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

export const compositeFearGreedAdapter: DataProvider<FearGreedIndex> = {
  name: 'composite-fng',
  description: 'Proprietary Fear & Greed composite index',
  priority: 3,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['fear-greed'],

  async fetch(_params: FetchParams): Promise<FearGreedIndex> {
    // Fetch BTC market data and global market cap
    const [btcRes, globalRes] = await Promise.all([
      fetch(`${COINGECKO_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=30`),
      fetch(`${COINGECKO_BASE}/global`),
    ]);

    if (!btcRes.ok) throw new Error(`CoinGecko BTC chart: ${btcRes.status}`);
    if (!globalRes.ok) throw new Error(`CoinGecko global: ${globalRes.status}`);

    const btcChart = await btcRes.json();
    const global = await globalRes.json();

    const prices: number[] = (btcChart.prices ?? []).map(([, p]: [number, number]) => p);

    // 1. Volatility component (0-100, high vol = fear)
    const volatility = computeVolatility(prices);
    const volScore = Math.max(0, Math.min(100, 100 - volatility * 2));

    // 2. Momentum component (price trend)
    const momentum = computeMomentum(prices);
    const momentumScore = Math.max(0, Math.min(100, 50 + momentum * 50));

    // 3. BTC dominance change (rising dominance = fear/flight to BTC)
    const btcDominance = global.data?.market_cap_percentage?.btc ?? 50;
    const domScore = btcDominance > 55 ? 30 : btcDominance > 45 ? 50 : 70;

    // 4. Volume momentum (high volume = conviction)
    const volumes: number[] = (btcChart.total_volumes ?? []).map(([, v]: [number, number]) => v);
    const volumeScore = computeVolumeMomentum(volumes);

    // Weighted composite
    const value = Math.round(
      volScore * 0.30 +
      momentumScore * 0.35 +
      domScore * 0.15 +
      volumeScore * 0.20,
    );

    const classification = classifyFearGreed(value);

    return {
      value,
      classification,
      timestamp: new Date().toISOString(),
      previousClose: null,
      weekAgo: null,
      monthAgo: null,
      lastUpdated: new Date().toISOString(),
      source: 'composite',
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${COINGECKO_BASE}/ping`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: FearGreedIndex): boolean {
    return typeof data.value === 'number' && data.value >= 0 && data.value <= 100;
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function computeVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  // Annualized volatility
  return Math.sqrt(variance * 365) * 100;
}

function computeMomentum(prices: number[]): number {
  if (prices.length < 10) return 0;
  const recent = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const older = prices.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  return older > 0 ? (recent - older) / older : 0;
}

function computeVolumeMomentum(volumes: number[]): number {
  if (volumes.length < 10) return 50;
  const recentAvg = volumes.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const olderAvg = volumes.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  const ratio = olderAvg > 0 ? recentAvg / olderAvg : 1;
  return Math.max(0, Math.min(100, ratio * 50));
}

function classifyFearGreed(value: number): 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed' {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}
