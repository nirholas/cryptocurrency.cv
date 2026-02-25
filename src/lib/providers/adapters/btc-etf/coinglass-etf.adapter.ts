/**
 * CoinGlass BTC ETF Adapter
 *
 * CoinGlass tracks BTC ETF flows in real-time:
 * - All 11 spot BTC ETFs
 * - Daily inflows/outflows
 * - AUM and holdings tracking
 *
 * @module providers/adapters/btc-etf/coinglass-etf
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { BTCETFAggregate } from './types';

const BASE = 'https://open-api.coinglass.com/public/v2';
const API_KEY = process.env.COINGLASS_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: API_KEY ? 30 : 0,
  windowMs: 60_000,
};

export const coinglassETFAdapter: DataProvider<BTCETFAggregate> = {
  name: 'coinglass-etf',
  description: 'CoinGlass — BTC spot ETF flow tracking',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['btc-etf'],

  async fetch(_params: FetchParams): Promise<BTCETFAggregate> {
    if (!API_KEY) throw new Error('COINGLASS_API_KEY not configured');

    const res = await fetch(`${BASE}/bitcoin-etf`, {
      headers: { coinglassSecret: API_KEY },
    });

    if (!res.ok) throw new Error(`CoinGlass ETF: ${res.status}`);

    const json = await res.json();
    const data = json.data ?? {};
    const etfList: CoinGlassETF[] = data.list ?? [];
    const now = new Date().toISOString();

    const etfs = etfList.map((e) => ({
      ticker: e.symbol ?? 'UNKNOWN',
      name: e.name ?? e.symbol ?? '',
      issuer: e.issuer ?? '',
      dailyFlowUsd: e.changeUsd ?? 0,
      weeklyFlowUsd: 0,
      aumUsd: e.totalAssets ?? 0,
      btcHoldings: e.btcAmount ?? 0,
      marketShare: 0,
      feeBps: e.fee ? e.fee * 100 : 0,
      source: 'coinglass-etf',
      timestamp: now,
    }));

    const totalAum = etfs.reduce((sum, e) => sum + e.aumUsd, 0);
    for (const etf of etfs) {
      etf.marketShare = totalAum > 0 ? (etf.aumUsd / totalAum) * 100 : 0;
    }

    return {
      totalAumUsd: totalAum,
      totalBtcHoldings: etfs.reduce((sum, e) => sum + e.btcHoldings, 0),
      dailyNetFlowUsd: etfs.reduce((sum, e) => sum + e.dailyFlowUsd, 0),
      weeklyNetFlowUsd: 0,
      etfs,
      source: 'coinglass-etf',
      timestamp: now,
    };
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/bitcoin-etf`, {
        headers: { coinglassSecret: API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: BTCETFAggregate): boolean {
    return Array.isArray(data.etfs) && data.etfs.length > 0;
  },
};

interface CoinGlassETF {
  symbol?: string;
  name?: string;
  issuer?: string;
  changeUsd?: number;
  totalAssets?: number;
  btcAmount?: number;
  fee?: number;
}
