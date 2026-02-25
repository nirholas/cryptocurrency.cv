/**
 * Arkham Intelligence Adapter — Entity-labeled on-chain intelligence
 *
 * Arkham provides entity-labeled blockchain intelligence:
 * - Wallet identification (exchange, fund, whale)
 * - Large transfer tracking with entity labels
 * - Portfolio tracking for known entities
 * - Cross-chain transfer monitoring
 *
 * Requires ARKHAM_API_KEY env var.
 * Free tier: limited API calls, major entity labels only.
 *
 * API: https://platform.arkhamintelligence.com/docs
 * env: ARKHAM_API_KEY
 *
 * @module providers/adapters/on-chain/arkham
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { WhaleAlert } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const API_BASE = 'https://api.arkhamintelligence.com';
const ARKHAM_API_KEY = process.env.ARKHAM_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: ARKHAM_API_KEY ? 30 : 0,
  windowMs: 60_000,
};

// =============================================================================
// RAW TYPES
// =============================================================================

interface ArkhamTransfer {
  transactionHash: string;
  chain: string;
  tokenSymbol: string;
  tokenName: string;
  fromAddress: string;
  fromEntity: ArkhamEntity | null;
  toAddress: string;
  toEntity: ArkhamEntity | null;
  unitValue: number;
  historicalUSD: number;
  blockTimestamp: string;
}

interface ArkhamEntity {
  name: string;
  type: string; // 'exchange' | 'fund' | 'dao' | 'individual' | 'unknown'
  website?: string;
}

// =============================================================================
// ADAPTER
// =============================================================================

export const arkhamAdapter: DataProvider<WhaleAlert[]> = {
  name: 'arkham',
  description: 'Arkham Intelligence — entity-labeled whale tracking with wallet identification',
  priority: 2,
  weight: 0.55,
  rateLimit: RATE_LIMIT,
  capabilities: ['whale-alerts', 'on-chain'],

  async fetch(params: FetchParams): Promise<WhaleAlert[]> {
    if (!ARKHAM_API_KEY) {
      throw new Error(
        'Arkham Intelligence requires API key (ARKHAM_API_KEY). Sign up: https://platform.arkhamintelligence.com',
      );
    }

    const limit = params.limit ?? 20;
    const chain = params.chain ?? 'all';
    const minUsd = (params.extra?.minValue as number) ?? 1_000_000;
    const since = Math.floor((Date.now() - 3_600_000) / 1000);

    const searchParams = new URLSearchParams({
      chain,
      usdGte: String(minUsd),
      from: String(since),
      limit: String(limit),
    });

    const url = `${API_BASE}/transfers?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'API-Key': ARKHAM_API_KEY,
        Accept: 'application/json',
        'User-Agent': 'free-crypto-news/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Arkham API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const transfers: ArkhamTransfer[] = data.transfers ?? data ?? [];

    return transfers.map(normalizeTransfer);
  },

  async healthCheck(): Promise<boolean> {
    if (!ARKHAM_API_KEY) return false;
    try {
      const response = await fetch(`${API_BASE}/health`, {
        headers: { 'API-Key': ARKHAM_API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: WhaleAlert[]): boolean {
    if (!Array.isArray(data)) return false;
    return data.length === 0 || data.every(tx =>
      typeof tx.amountUsd === 'number' && tx.amountUsd > 0 && typeof tx.txHash === 'string',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

function classifyType(
  from: ArkhamEntity | null,
  to: ArkhamEntity | null,
): WhaleAlert['type'] {
  const fromType = from?.type?.toLowerCase() ?? '';
  const toType = to?.type?.toLowerCase() ?? '';

  if (fromType === 'exchange' && toType !== 'exchange') return 'exchange-withdraw';
  if (fromType !== 'exchange' && toType === 'exchange') return 'exchange-deposit';
  if (!from && to) return 'mint';
  if (from && !to) return 'burn';
  return 'transfer';
}

function normalizeTransfer(raw: ArkhamTransfer): WhaleAlert {
  return {
    txHash: raw.transactionHash,
    chain: raw.chain,
    symbol: (raw.tokenSymbol ?? '').toUpperCase(),
    amountUsd: raw.historicalUSD,
    amount: raw.unitValue,
    from: raw.fromEntity?.name ?? raw.fromAddress ?? '',
    to: raw.toEntity?.name ?? raw.toAddress ?? '',
    type: classifyType(raw.fromEntity, raw.toEntity),
    timestamp: raw.blockTimestamp ?? new Date().toISOString(),
  };
}

export default arkhamAdapter;
