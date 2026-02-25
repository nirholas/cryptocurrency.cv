/**
 * Whale Alert Adapter — Large cryptocurrency transaction tracking
 *
 * Whale Alert tracks large crypto transactions in real-time:
 * - Free tier: 10 req/min, transactions > $500K
 * - Paid: unlimited, lower thresholds
 * - Sign up: https://whale-alert.io/signup
 * - Docs: https://docs.whale-alert.io/
 *
 * @module providers/adapters/on-chain/whale-alert
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { WhaleAlert } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const API_BASE = 'https://api.whale-alert.io/v1';
const WHALE_ALERT_KEY = process.env.WHALE_ALERT_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: WHALE_ALERT_KEY ? 10 : 0,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const whaleAlertAdapter: DataProvider<WhaleAlert[]> = {
  name: 'whale-alert',
  description: 'Whale Alert — large crypto transactions ($500K+) across all major chains',
  priority: 1,
  weight: 0.7,
  rateLimit: RATE_LIMIT,
  capabilities: ['whale-alerts'],

  async fetch(params: FetchParams): Promise<WhaleAlert[]> {
    if (!WHALE_ALERT_KEY) {
      throw new Error(
        'Whale Alert requires API key (WHALE_ALERT_API_KEY). Sign up free: https://whale-alert.io/signup',
      );
    }

    const limit = params.limit ?? 20;
    const minValue = params.minValue ?? 500000;
    const start = Math.floor((Date.now() - 3_600_000) / 1000);

    const url = `${API_BASE}/transactions?api_key=${WHALE_ALERT_KEY}&min_value=${minValue}&start=${start}&limit=${limit}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Whale Alert API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error(`Whale Alert error: ${data.message ?? 'Unknown'}`);
    }

    const txns: RawWhaleAlertTx[] = data.transactions ?? [];
    return txns.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    if (!WHALE_ALERT_KEY) return false;
    try {
      const response = await fetch(`${API_BASE}/status?api_key=${WHALE_ALERT_KEY}`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: WhaleAlert[]): boolean {
    if (!Array.isArray(data)) return false;
    return data.every(tx => typeof tx.amountUsd === 'number' && tx.amountUsd > 0);
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface RawWhaleAlertTx {
  blockchain: string;
  symbol: string;
  hash: string;
  from: { address: string; owner: string; owner_type: string };
  to: { address: string; owner: string; owner_type: string };
  timestamp: number;
  amount: number;
  amount_usd: number;
}

function classifyType(
  fromType: string,
  toType: string,
): WhaleAlert['type'] {
  if (fromType === 'exchange' && toType !== 'exchange') return 'exchange-withdraw';
  if (fromType !== 'exchange' && toType === 'exchange') return 'exchange-deposit';
  return 'transfer';
}

function normalize(raw: RawWhaleAlertTx): WhaleAlert {
  return {
    txHash: raw.hash,
    chain: raw.blockchain,
    symbol: raw.symbol.toUpperCase(),
    amountUsd: raw.amount_usd,
    amount: raw.amount,
    from: raw.from.owner || raw.from.address,
    to: raw.to.owner || raw.to.address,
    type: classifyType(raw.from.owner_type, raw.to.owner_type),
    timestamp: new Date(raw.timestamp * 1000).toISOString(),
  };
}
