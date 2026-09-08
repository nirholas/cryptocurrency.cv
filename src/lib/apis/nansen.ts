/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Nansen On-Chain Analytics API
 *
 * Smart money tracking, token analytics (God Mode), and wallet profiling
 * across EVM chains. Premium intelligence for institutional-grade analysis.
 *
 * @see https://docs.nansen.ai/
 * @module lib/apis/nansen
 */

import { marketCache, apiCacheKey } from '@/lib/distributed-cache';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://api.nansen.ai';
const API_KEY = process.env.NANSEN_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface SmartMoneyTransaction {
  txHash: string;
  chain: string;
  walletAddress: string;
  walletLabel: string | null;
  walletType: string;
  token: string;
  symbol: string;
  action: 'buy' | 'sell' | 'transfer' | 'mint' | 'burn';
  amount: number;
  valueUsd: number;
  timestamp: string;
  gasUsed: number;
  gasPrice: number;
}

export interface SmartMoneyActivitySummary {
  transactions: SmartMoneyTransaction[];
  totalBuyVolumeUsd: number;
  totalSellVolumeUsd: number;
  netFlowUsd: number;
  uniqueWallets: number;
  topTokensByVolume: Array<{
    symbol: string;
    buyVolumeUsd: number;
    sellVolumeUsd: number;
    netFlowUsd: number;
    txCount: number;
  }>;
  timestamp: string;
}

export interface TokenGodMode {
  token: string;
  symbol: string;
  chain: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: {
    total: number;
    smartMoney: number;
    whales: number;
    change24h: number;
  };
  flows: {
    smartMoneyNetFlow24h: number;
    exchangeNetFlow24h: number;
    dexVolume24h: number;
    cexVolume24h: number;
  };
  topHolders: Array<{
    address: string;
    label: string | null;
    balance: number;
    valueUsd: number;
    percentOfSupply: number;
    lastActivity: string;
  }>;
  signals: Array<{
    type: 'accumulation' | 'distribution' | 'whale_alert' | 'smart_money_inflow' | 'smart_money_outflow';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface WalletProfile {
  address: string;
  chain: string;
  labels: string[];
  profitability: {
    totalPnlUsd: number;
    winRate: number;
    avgHoldingPeriodDays: number;
    bestTrade: { token: string; pnlUsd: number } | null;
    worstTrade: { token: string; pnlUsd: number } | null;
  };
  portfolio: Array<{
    token: string;
    symbol: string;
    balance: number;
    valueUsd: number;
    avgBuyPrice: number;
    currentPrice: number;
    unrealizedPnlUsd: number;
  }>;
  activity: {
    totalTransactions: number;
    firstActive: string;
    lastActive: string;
    primaryDex: string | null;
    activeChains: string[];
  };
  score: {
    overall: number;
    tradingSkill: number;
    diversification: number;
    timing: number;
  };
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Nansen API with bearer auth.
 */
async function nansenFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Nansen: NANSEN_API_KEY not set — skipping request');
    return null;
  }

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const res = await resilientFetchResponse(url.toString(), {
    service: 'nansen', timeoutMs: 8000, retries: 1,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Nansen API error ${res.status}: ${path}`);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Smart Money Activity
// ---------------------------------------------------------------------------

/**
 * Get recent smart money transactions across chains.
 */
export async function getSmartMoneyActivity(options?: {
  chain?: string;
  token?: string;
  action?: 'buy' | 'sell';
  limit?: number;
}): Promise<SmartMoneyActivitySummary> {
  const params: Record<string, string> = {};
  if (options?.chain) params.chain = options.chain;
  if (options?.token) params.token = options.token;
  if (options?.action) params.action = options.action;
  if (options?.limit) params.limit = String(options.limit);

  const cacheKey = apiCacheKey('nansen:smart-money', params);

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await nansenFetch<{
        transactions?: Array<{
          tx_hash?: string;
          chain?: string;
          wallet_address?: string;
          wallet_label?: string;
          wallet_type?: string;
          token_name?: string;
          token_symbol?: string;
          action?: string;
          amount?: number;
          value_usd?: number;
          timestamp?: string;
          gas_used?: number;
          gas_price?: number;
        }>;
      }>('/v1/smart-money/transactions', params);

      const transactions: SmartMoneyTransaction[] = (data?.transactions || []).map((t) => ({
        txHash: t.tx_hash || '',
        chain: t.chain || 'ethereum',
        walletAddress: t.wallet_address || '',
        walletLabel: t.wallet_label || null,
        walletType: t.wallet_type || 'unknown',
        token: t.token_name || 'Unknown',
        symbol: t.token_symbol || 'UNKNOWN',
        action: (t.action as SmartMoneyTransaction['action']) || 'transfer',
        amount: t.amount || 0,
        valueUsd: t.value_usd || 0,
        timestamp: t.timestamp || new Date().toISOString(),
        gasUsed: t.gas_used || 0,
        gasPrice: t.gas_price || 0,
      }));

      const totalBuyVolumeUsd = transactions
        .filter((t) => t.action === 'buy')
        .reduce((s, t) => s + t.valueUsd, 0);
      const totalSellVolumeUsd = transactions
        .filter((t) => t.action === 'sell')
        .reduce((s, t) => s + t.valueUsd, 0);

      // Aggregate by token
      const tokenMap = new Map<
        string,
        { buyVolumeUsd: number; sellVolumeUsd: number; txCount: number }
      >();
      for (const t of transactions) {
        const existing = tokenMap.get(t.symbol) || {
          buyVolumeUsd: 0,
          sellVolumeUsd: 0,
          txCount: 0,
        };
        if (t.action === 'buy') existing.buyVolumeUsd += t.valueUsd;
        if (t.action === 'sell') existing.sellVolumeUsd += t.valueUsd;
        existing.txCount++;
        tokenMap.set(t.symbol, existing);
      }

      const topTokensByVolume = [...tokenMap.entries()]
        .map(([symbol, v]) => ({
          symbol,
          buyVolumeUsd: v.buyVolumeUsd,
          sellVolumeUsd: v.sellVolumeUsd,
          netFlowUsd: v.buyVolumeUsd - v.sellVolumeUsd,
          txCount: v.txCount,
        }))
        .sort((a, b) => b.buyVolumeUsd + b.sellVolumeUsd - (a.buyVolumeUsd + a.sellVolumeUsd))
        .slice(0, 20);

      const uniqueWallets = new Set(transactions.map((t) => t.walletAddress)).size;

      return {
        transactions,
        totalBuyVolumeUsd,
        totalSellVolumeUsd,
        netFlowUsd: totalBuyVolumeUsd - totalSellVolumeUsd,
        uniqueWallets,
        topTokensByVolume,
        timestamp: new Date().toISOString(),
      } satisfies SmartMoneyActivitySummary;
    },
    { ttl: 30, staleTtl: 15 }, // 30s for activity data
  );
}

// ---------------------------------------------------------------------------
// Token God Mode
// ---------------------------------------------------------------------------

/**
 * Get comprehensive token intelligence (God Mode) for a specific token.
 */
export async function getTokenGodMode(token: string): Promise<TokenGodMode | null> {
  const cacheKey = apiCacheKey('nansen:token-god-mode', { token });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await nansenFetch<{
        token?: string;
        symbol?: string;
        chain?: string;
        price?: number;
        price_change_24h?: number;
        market_cap?: number;
        volume_24h?: number;
        holders?: {
          total?: number;
          smart_money?: number;
          whales?: number;
          change_24h?: number;
        };
        flows?: {
          smart_money_net_flow_24h?: number;
          exchange_net_flow_24h?: number;
          dex_volume_24h?: number;
          cex_volume_24h?: number;
        };
        top_holders?: Array<{
          address?: string;
          label?: string;
          balance?: number;
          value_usd?: number;
          percent_of_supply?: number;
          last_activity?: string;
        }>;
        signals?: Array<{
          type?: string;
          severity?: string;
          description?: string;
          timestamp?: string;
        }>;
      }>(`/v1/token/${encodeURIComponent(token)}/god-mode`);

      if (!data) return null;

      return {
        token: data.token || token,
        symbol: data.symbol || token.toUpperCase(),
        chain: data.chain || 'ethereum',
        price: data.price || 0,
        priceChange24h: data.price_change_24h || 0,
        marketCap: data.market_cap || 0,
        volume24h: data.volume_24h || 0,
        holders: {
          total: data.holders?.total || 0,
          smartMoney: data.holders?.smart_money || 0,
          whales: data.holders?.whales || 0,
          change24h: data.holders?.change_24h || 0,
        },
        flows: {
          smartMoneyNetFlow24h: data.flows?.smart_money_net_flow_24h || 0,
          exchangeNetFlow24h: data.flows?.exchange_net_flow_24h || 0,
          dexVolume24h: data.flows?.dex_volume_24h || 0,
          cexVolume24h: data.flows?.cex_volume_24h || 0,
        },
        topHolders: (data.top_holders || []).map((h) => ({
          address: h.address || '',
          label: h.label || null,
          balance: h.balance || 0,
          valueUsd: h.value_usd || 0,
          percentOfSupply: h.percent_of_supply || 0,
          lastActivity: h.last_activity || '',
        })),
        signals: (data.signals || []).map((s) => ({
          type: (s.type as TokenGodMode['signals'][0]['type']) || 'whale_alert',
          severity: (s.severity as TokenGodMode['signals'][0]['severity']) || 'low',
          description: s.description || '',
          timestamp: s.timestamp || new Date().toISOString(),
        })),
        timestamp: new Date().toISOString(),
      } satisfies TokenGodMode;
    },
    { ttl: 300, staleTtl: 120 }, // 5min analytics
  );
}

// ---------------------------------------------------------------------------
// Wallet Profiler
// ---------------------------------------------------------------------------

/**
 * Get detailed wallet profile including PnL, portfolio, and scoring.
 */
export async function getWalletProfiler(address: string): Promise<WalletProfile | null> {
  const cacheKey = apiCacheKey('nansen:wallet-profiler', { address });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await nansenFetch<{
        address?: string;
        chain?: string;
        labels?: string[];
        profitability?: {
          total_pnl_usd?: number;
          win_rate?: number;
          avg_holding_period_days?: number;
          best_trade?: { token?: string; pnl_usd?: number };
          worst_trade?: { token?: string; pnl_usd?: number };
        };
        portfolio?: Array<{
          token?: string;
          symbol?: string;
          balance?: number;
          value_usd?: number;
          avg_buy_price?: number;
          current_price?: number;
          unrealized_pnl_usd?: number;
        }>;
        activity?: {
          total_transactions?: number;
          first_active?: string;
          last_active?: string;
          primary_dex?: string;
          active_chains?: string[];
        };
        score?: {
          overall?: number;
          trading_skill?: number;
          diversification?: number;
          timing?: number;
        };
      }>(`/v1/wallet/${address}/profile`);

      if (!data) return null;

      return {
        address: data.address || address,
        chain: data.chain || 'ethereum',
        labels: data.labels || [],
        profitability: {
          totalPnlUsd: data.profitability?.total_pnl_usd || 0,
          winRate: data.profitability?.win_rate || 0,
          avgHoldingPeriodDays: data.profitability?.avg_holding_period_days || 0,
          bestTrade: data.profitability?.best_trade
            ? {
                token: data.profitability.best_trade.token || '',
                pnlUsd: data.profitability.best_trade.pnl_usd || 0,
              }
            : null,
          worstTrade: data.profitability?.worst_trade
            ? {
                token: data.profitability.worst_trade.token || '',
                pnlUsd: data.profitability.worst_trade.pnl_usd || 0,
              }
            : null,
        },
        portfolio: (data.portfolio || []).map((p) => ({
          token: p.token || 'Unknown',
          symbol: p.symbol || 'UNKNOWN',
          balance: p.balance || 0,
          valueUsd: p.value_usd || 0,
          avgBuyPrice: p.avg_buy_price || 0,
          currentPrice: p.current_price || 0,
          unrealizedPnlUsd: p.unrealized_pnl_usd || 0,
        })),
        activity: {
          totalTransactions: data.activity?.total_transactions || 0,
          firstActive: data.activity?.first_active || '',
          lastActive: data.activity?.last_active || '',
          primaryDex: data.activity?.primary_dex || null,
          activeChains: data.activity?.active_chains || [],
        },
        score: {
          overall: data.score?.overall || 0,
          tradingSkill: data.score?.trading_skill || 0,
          diversification: data.score?.diversification || 0,
          timing: data.score?.timing || 0,
        },
        timestamp: new Date().toISOString(),
      } satisfies WalletProfile;
    },
    { ttl: 3600, staleTtl: 1800 }, // 1hr profiles
  );
}
