/**
 * Token Terminal Adapter — Crypto Protocol Fundamentals
 *
 * Token Terminal provides:
 * - Protocol revenue (fees, annualized)
 * - P/S ratio, P/F ratio (price-to-sales, price-to-fees)
 * - TVL with revenue context
 * - Treasury data
 * - Token incentives
 * - Fully diluted market cap metrics
 *
 * This data is unique — no other free source provides revenue/fundamentals.
 *
 * Uses Token Terminal's public API.
 * For advanced features, set TOKENTERMINAL_API_KEY.
 *
 * API: https://docs.tokenterminal.com/
 * env: TOKENTERMINAL_API_KEY
 *
 * @module providers/adapters/defi/tokenterminal
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

export interface ProtocolFundamentals {
  /** Protocol name */
  name: string;
  /** Protocol symbol */
  symbol: string;
  /** Protocol category (DEX, Lending, Yield, etc.) */
  category: string;
  /** Annualized revenue (USD) */
  revenue: number;
  /** Revenue change 30d (%) */
  revenueChange30d: number;
  /** Annualized fees (USD) */
  fees: number;
  /** Total Value Locked (USD) */
  tvl: number;
  /** Price-to-Sales ratio */
  psRatio: number;
  /** Price-to-Fees ratio */
  pfRatio: number;
  /** Fully diluted market cap */
  fdv: number;
  /** Market cap */
  marketCap: number;
  /** Token incentives (annual, USD) */
  tokenIncentives: number;
  /** Active users (30d) */
  activeUsers30d: number;
  /** Chain deployed on */
  chains: string[];
  /** Data source */
  source: string;
  /** Data timestamp */
  timestamp: string;
}

const TOKEN_TERMINAL_BASE = 'https://api.tokenterminal.com/v2';
const TOKEN_TERMINAL_API_KEY = process.env.TOKENTERMINAL_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: TOKEN_TERMINAL_API_KEY ? 20 : 5,
  windowMs: 60_000,
};

export const tokenTerminalAdapter: DataProvider<ProtocolFundamentals[]> = {
  name: 'tokenterminal',
  description: 'Token Terminal — Protocol revenue, P/S ratios, and crypto fundamentals analysis',
  priority: 1,
  weight: 0.55,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields', 'tvl'],

  async fetch(params: FetchParams): Promise<ProtocolFundamentals[]> {
    const limit = params.limit ?? 50;
    const now = new Date().toISOString();

    const headers: Record<string, string> = {
      'User-Agent': 'free-crypto-news/2.0',
      Accept: 'application/json',
    };
    if (TOKEN_TERMINAL_API_KEY) {
      headers.Authorization = `Bearer ${TOKEN_TERMINAL_API_KEY}`;
    }

    const url = `${TOKEN_TERMINAL_BASE}/projects?limit=${limit}`;

    const res = await fetch(url, { headers });

    if (!res.ok) throw new Error(`Token Terminal ${res.status}: ${res.statusText}`);

    const json = await res.json();
    const projects: ProtocolFundamentals[] = (json.data || json || []).map(
      (p: Record<string, unknown>): ProtocolFundamentals => {
        const metrics = (p.metrics || p) as Record<string, unknown>;

        return {
          name: (p.name as string) || '',
          symbol: (p.symbol as string) || '',
          category: (p.category as string) || 'DeFi',
          revenue: (metrics.revenue_annualized as number) || (metrics.revenue_30d as number) * 12 || 0,
          revenueChange30d: (metrics.revenue_change_30d as number) || 0,
          fees: (metrics.fees_annualized as number) || (metrics.fees_30d as number) * 12 || 0,
          tvl: (metrics.tvl as number) || 0,
          psRatio: (metrics.ps_ratio as number) || 0,
          pfRatio: (metrics.pf_ratio as number) || 0,
          fdv: (metrics.fully_diluted_valuation as number) || (metrics.fdv as number) || 0,
          marketCap: (metrics.market_cap as number) || 0,
          tokenIncentives: (metrics.token_incentives_annualized as number) || 0,
          activeUsers30d: (metrics.active_users_30d as number) || 0,
          chains: (p.chains as string[]) || [],
          source: 'tokenterminal',
          timestamp: now,
        };
      },
    );

    // Filter by symbol if specified
    if (params.symbols?.length) {
      const symbolSet = new Set(params.symbols.map((s) => s.toUpperCase()));
      return projects.filter(
        (p) => symbolSet.has(p.symbol.toUpperCase()) || symbolSet.has(p.name.toUpperCase()),
      );
    }

    return projects;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (TOKEN_TERMINAL_API_KEY) {
        headers.Authorization = `Bearer ${TOKEN_TERMINAL_API_KEY}`;
      }
      const res = await fetch(`${TOKEN_TERMINAL_BASE}/projects?limit=1`, { headers });
      return res.ok;
    } catch {
      return false;
    }
  },

  normalize(data: ProtocolFundamentals[]): ProtocolFundamentals[] {
    return data;
  },
};

export default tokenTerminalAdapter;
