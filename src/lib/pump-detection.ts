/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

export interface PumpAlert {
  id: string;
  symbol: string;
  pair: string;
  exchange: string;
  priceChange: number;
  volumeChange: number;
  timeFrame: string;
  risk: 'Low' | 'Medium' | 'High' | 'Very high';
  confidence: number;
  price: number;
  volume24h: number;
  detectedAt: string;
  isFavorite?: boolean;
}

export interface MarketOverview {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  fearGreedValue: number;
  fearGreedLabel: string;
  pumpingCoins: number;
  dumpingCoins: number;
  unusualActivity: number;
  lastUpdated: string;
}

export interface PumpScreenerData {
  alerts: PumpAlert[];
  marketOverview: MarketOverview;
  totalAlerts: number;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very high';

export function calculateRisk(priceChange: number, volumeChange: number): RiskLevel {
  const score = Math.abs(priceChange) * 0.4 + Math.abs(volumeChange / 100) * 0.6;
  if (score > 15) return 'Very high';
  if (score > 10) return 'High';
  if (score > 5) return 'Medium';
  return 'Low';
}

export function calculateConfidence(priceChange: number, volumeChange: number): number {
  const base = Math.min(100, Math.abs(volumeChange / 10) + Math.abs(priceChange) * 3);
  return Math.round(Math.max(20, Math.min(99, base)));
}

export function classifyFearGreed(value: number): string {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

const TIME_FRAMES = ['1m', '5m', '15m', '30m', '1h', '4h'] as const;
const EXCHANGES = ['Binance', 'Coinbase', 'Bybit', 'OKX', 'Kraken'] as const;

const COIN_PAIRS = [
  { symbol: 'BTC', pair: 'BTC/USDT' },
  { symbol: 'ETH', pair: 'ETH/USDT' },
  { symbol: 'SOL', pair: 'SOL/USDT' },
  { symbol: 'XRP', pair: 'XRP/USDT' },
  { symbol: 'DOGE', pair: 'DOGE/USDT' },
  { symbol: 'ADA', pair: 'ADA/USDT' },
  { symbol: 'AVAX', pair: 'AVAX/USDT' },
  { symbol: 'DOT', pair: 'DOT/USDT' },
  { symbol: 'LINK', pair: 'LINK/USDT' },
  { symbol: 'MATIC', pair: 'MATIC/USDT' },
  { symbol: 'PEPE', pair: 'PEPE/USDT' },
  { symbol: 'SHIB', pair: 'SHIB/USDT' },
  { symbol: 'ARB', pair: 'ARB/USDT' },
  { symbol: 'OP', pair: 'OP/USDT' },
  { symbol: 'APT', pair: 'APT/USDT' },
  { symbol: 'SUI', pair: 'SUI/USDT' },
  { symbol: 'INJ', pair: 'INJ/USDT' },
  { symbol: 'TIA', pair: 'TIA/USDT' },
  { symbol: 'SEI', pair: 'SEI/USDT' },
  { symbol: 'FET', pair: 'FET/USDT' },
  { symbol: 'RENDER', pair: 'RENDER/USDT' },
  { symbol: 'WIF', pair: 'WIF/USDT' },
  { symbol: 'JUP', pair: 'JUP/USDT' },
  { symbol: 'NEAR', pair: 'NEAR/USDT' },
  { symbol: 'FIL', pair: 'FIL/USDT' },
] as const;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generatePumpAlerts(seed?: number): PumpScreenerData {
  const now = new Date();
  const rand = seededRandom(seed ?? Math.floor(now.getTime() / 60000));

  const alerts: PumpAlert[] = [];

  for (const coinPair of COIN_PAIRS) {
    const shouldPump = rand() > 0.55;
    if (!shouldPump) continue;

    const priceChange = (rand() * 20 + 3) * (rand() > 0.15 ? 1 : -1);
    const volumeChange = rand() * 1200 + 200;
    const timeFrame = TIME_FRAMES[Math.floor(rand() * TIME_FRAMES.length)];
    const exchange = EXCHANGES[Math.floor(rand() * EXCHANGES.length)];
    const risk = calculateRisk(priceChange, volumeChange);
    const confidence = calculateConfidence(priceChange, volumeChange);

    alerts.push({
      id: `${coinPair.symbol}-${exchange}-${timeFrame}`,
      symbol: coinPair.symbol,
      pair: coinPair.pair,
      exchange,
      priceChange,
      volumeChange,
      timeFrame,
      risk,
      confidence,
      price: rand() * 50000 + 0.01,
      volume24h: rand() * 1e9 + 1e6,
      detectedAt: new Date(now.getTime() - Math.floor(rand() * 300000)).toISOString(),
    });
  }

  alerts.sort((a, b) => b.confidence - a.confidence);

  const fearGreedValue = Math.round(rand() * 40 + 40);

  const marketOverview: MarketOverview = {
    totalMarketCap: 2.47e12 + (rand() - 0.5) * 1e11,
    volume24h: 98.5e9 + (rand() - 0.5) * 1e10,
    btcDominance: 52.8 + (rand() - 0.5) * 3,
    fearGreedValue,
    fearGreedLabel: classifyFearGreed(fearGreedValue),
    pumpingCoins: 60 + Math.floor(rand() * 50),
    dumpingCoins: 20 + Math.floor(rand() * 40),
    unusualActivity: 15 + Math.floor(rand() * 30),
    lastUpdated: now.toISOString(),
  };

  return {
    alerts,
    marketOverview,
    totalAlerts: alerts.length,
  };
}
