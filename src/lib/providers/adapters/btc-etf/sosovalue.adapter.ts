/**
 * SoSoValue BTC ETF Adapter
 *
 * SoSoValue provides free BTC/ETH ETF flow data:
 * - Daily inflows/outflows for all spot BTC ETFs
 * - AUM tracking
 * - No API key required for public data
 *
 * Note: SoSoValue's API is undocumented; we scrape their public API used by the website.
 *
 * @module providers/adapters/btc-etf/sosovalue
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { BTCETFAggregate } from './types';

const BASE = 'https://api.sosovalue.com/common/v1';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };

export const sosovalueETFAdapter: DataProvider<BTCETFAggregate> = {
  name: 'sosovalue-etf',
  description: 'SoSoValue — free BTC ETF flow data',
  priority: 2,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['btc-etf'],

  async fetch(_params: FetchParams): Promise<BTCETFAggregate> {
    const res = await fetch(`${BASE}/etf/us-btc-spot/list`, {
      headers: {
        'User-Agent': 'free-crypto-news/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) throw new Error(`SoSoValue API: ${res.status}`);

    const json = await res.json();
    const data: SoSoValueETF[] = json.data ?? [];
    const now = new Date().toISOString();

    const etfs = data.map((e) => ({
      ticker: e.ticker ?? 'UNKNOWN',
      name: e.etfName ?? e.ticker ?? '',
      issuer: e.issuer ?? '',
      dailyFlowUsd: e.netInflow ?? 0,
      weeklyFlowUsd: 0,
      aumUsd: e.totalNetAssets ?? 0,
      btcHoldings: e.btcHoldings ?? 0,
      marketShare: 0,
      feeBps: e.expenseRatio ? e.expenseRatio * 10000 : 0,
      source: 'sosovalue',
      timestamp: now,
    }));

    const totalAum = etfs.reduce((sum, e) => sum + e.aumUsd, 0);
    for (const e of etfs) {
      e.marketShare = totalAum > 0 ? (e.aumUsd / totalAum) * 100 : 0;
    }

    return {
      totalAumUsd: totalAum,
      totalBtcHoldings: etfs.reduce((sum, e) => sum + e.btcHoldings, 0),
      dailyNetFlowUsd: etfs.reduce((sum, e) => sum + e.dailyFlowUsd, 0),
      weeklyNetFlowUsd: 0,
      etfs,
      source: 'sosovalue',
      timestamp: now,
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/etf/us-btc-spot/list`, {
        headers: { 'User-Agent': 'free-crypto-news/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: BTCETFAggregate): boolean {
    return Array.isArray(data.etfs);
  },
};

interface SoSoValueETF {
  ticker?: string;
  etfName?: string;
  issuer?: string;
  netInflow?: number;
  totalNetAssets?: number;
  btcHoldings?: number;
  expenseRatio?: number;
}
