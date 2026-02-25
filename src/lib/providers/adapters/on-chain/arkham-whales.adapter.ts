/**
 * Arkham Intelligence Whale Adapter — Smart money & whale transaction tracking
 *
 * Wraps the raw Arkham API client into the DataProvider interface for the
 * whale-alerts provider chain.
 *
 * @see https://platform.arkhamintelligence.com/docs
 * @module providers/adapters/on-chain/arkham-whales
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { WhaleAlert } from './types';

const BASE_URL = 'https://api.arkhamintel.com';
const API_KEY = process.env.ARKHAM_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 };

export const arkhamWhaleAdapter: DataProvider<WhaleAlert[]> = {
  name: 'arkham-whales',
  description: 'Arkham Intelligence — Labeled wallet whale transaction tracking',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['whale-alerts'],

  async fetch(params: FetchParams): Promise<WhaleAlert[]> {
    if (!API_KEY) throw new Error('ARKHAM_API_KEY not configured');

    const limit = params.limit ?? 25;
    const minUsd = params.extra?.minUsd ?? 1_000_000;

    // Fetch large transfers from Arkham
    const res = await fetch(
      `${BASE_URL}/transfers/all?usdGte=${minUsd}&limit=${limit}`,
      {
        headers: {
          'API-Key': API_KEY,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) throw new Error(`Arkham API error: ${res.status}`);

    const json = await res.json();
    const transfers: ArkhamTransfer[] = json?.transfers ?? json?.data ?? json ?? [];

    const results: WhaleAlert[] = transfers.map(t => ({
      txHash: t.transactionHash ?? t.txHash ?? '',
      chain: t.chain ?? t.blockchain ?? 'ethereum',
      symbol: t.tokenSymbol ?? t.symbol ?? '',
      amountUsd: t.historicalUSD ?? t.valueUsd ?? 0,
      amount: t.unitValue ?? t.amount ?? 0,
      from: t.fromAddress?.arkhamLabel ?? t.fromAddress?.address ?? '',
      to: t.toAddress?.arkhamLabel ?? t.toAddress?.address ?? '',
      type: classifyTransferType(t),
      timestamp: t.blockTimestamp ?? new Date().toISOString(),
    }));

    if (results.length === 0) throw new Error('No Arkham whale data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(`${BASE_URL}/transfers/all?limit=1&usdGte=10000000`, {
        headers: { 'API-Key': API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch { return false; }
  },

  validate(data: WhaleAlert[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyTransferType(t: ArkhamTransfer): WhaleAlert['type'] {
  const fromLabels = t.fromAddress?.arkhamLabel?.toLowerCase() ?? '';
  const toLabels = t.toAddress?.arkhamLabel?.toLowerCase() ?? '';

  if (fromLabels.includes('exchange') && !toLabels.includes('exchange')) {
    return 'exchange-withdraw';
  }
  if (!fromLabels.includes('exchange') && toLabels.includes('exchange')) {
    return 'exchange-deposit';
  }
  if (fromLabels.includes('mint') || t.fromAddress?.address === '0x0000000000000000000000000000000000000000') {
    return 'mint';
  }
  if (toLabels.includes('burn') || t.toAddress?.address === '0x0000000000000000000000000000000000000000') {
    return 'burn';
  }
  return 'transfer';
}

// Internal
interface ArkhamAddress {
  address?: string;
  arkhamLabel?: string;
  arkhamEntity?: string;
}

interface ArkhamTransfer {
  transactionHash?: string;
  txHash?: string;
  chain?: string;
  blockchain?: string;
  tokenSymbol?: string;
  symbol?: string;
  historicalUSD?: number;
  valueUsd?: number;
  unitValue?: number;
  amount?: number;
  fromAddress?: ArkhamAddress;
  toAddress?: ArkhamAddress;
  blockTimestamp?: string;
}
