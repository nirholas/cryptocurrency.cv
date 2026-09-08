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
 * Shyft Solana DeFi & Parsing API
 *
 * Advanced Solana data including DeFi positions, parsed transactions,
 * token metadata, and wallet analytics.
 *
 * Free tier: 100 req/min, 1M calls/mo. Pro: $49/mo.
 *
 * @see https://docs.shyft.to/
 * @module lib/apis/shyft
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://api.shyft.to/sol/v1';
const API_KEY = process.env.SHYFT_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export type ShyftNetwork = 'mainnet-beta' | 'devnet' | 'testnet';

export interface DeFiPosition {
  protocol: string;
  protocolAddress: string;
  type: 'lending' | 'borrowing' | 'liquidity' | 'staking' | 'farming';
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  amount: number;
  valueUsd: number;
  apy?: number;
  healthFactor?: number;
  collateralFactor?: number;
  pool?: string;
}

export interface DeFiPositionsResponse {
  positions: DeFiPosition[];
  totalValueUsd: number;
  protocols: string[];
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
  description?: string;
  externalUrl?: string;
  supply?: number;
  mintAuthority?: string;
  freezeAuthority?: string;
  isNFT: boolean;
  isMutable: boolean;
  tokenStandard?: string;
  collection?: {
    address: string;
    name: string;
    verified: boolean;
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface ParsedTransaction {
  signature: string;
  type: string;
  status: 'success' | 'failed';
  fee: number;
  timestamp: number;
  blockTime: number;
  slot: number;
  signers: string[];
  protocol?: {
    name: string;
    address: string;
  };
  actions: Array<{
    type: string;
    info: Record<string, unknown>;
    sourceProtocol?: string;
  }>;
  tokenTransfers: Array<{
    from: string;
    to: string;
    amount: number;
    mint: string;
    symbol?: string;
    decimals: number;
  }>;
  nativeTransfers: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
}

export interface WalletTokenInfo {
  address: string;
  balance: number;
  associatedAccount: string;
  info: {
    name: string;
    symbol: string;
    image?: string;
    decimals: number;
  };
}

export interface ShyftSolanaSummary {
  address: string;
  defiPositions: DeFiPositionsResponse | null;
  recentTransactions: ParsedTransaction[];
  tokens: WalletTokenInfo[];
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Shyft REST API with key auth.
 */
async function shyftFetch<T>(path: string): Promise<T | null> {
  if (!API_KEY) {
    console.warn('Shyft: SHYFT_API_KEY not set — skipping request');
    return null;
  }

  const res = await resilientFetchResponse(`${BASE_URL}${path}`, {
    service: 'shyft', timeoutMs: 8000, retries: 1,
    headers: {
      accept: 'application/json',
      'x-api-key': API_KEY,
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`Shyft API error ${res.status}: ${path}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(`Shyft API error: ${json.message || 'unknown'}`);
  }

  return json.result as T;
}

// ---------------------------------------------------------------------------
// DeFi Positions
// ---------------------------------------------------------------------------

/**
 * Get all DeFi positions (lending, borrowing, LPs, staking) for a wallet.
 */
export async function getDeFiPositions(
  address: string,
  network: ShyftNetwork = 'mainnet-beta',
): Promise<DeFiPositionsResponse | null> {
  return shyftFetch<DeFiPositionsResponse>(
    `/wallet/get_portfolio?network=${network}&wallet=${encodeURIComponent(address)}`,
  );
}

// ---------------------------------------------------------------------------
// Token Metadata
// ---------------------------------------------------------------------------

/**
 * Get rich metadata for a token mint address.
 */
export async function getTokenMetadata(
  mint: string,
  network: ShyftNetwork = 'mainnet-beta',
): Promise<TokenMetadata | null> {
  return shyftFetch<TokenMetadata>(
    `/token/get_info?network=${network}&token_address=${encodeURIComponent(mint)}`,
  );
}

// ---------------------------------------------------------------------------
// Parsed Transactions
// ---------------------------------------------------------------------------

/**
 * Get parsed and human-readable transactions for an address.
 * Shyft parses DeFi interactions, swaps, NFT mints, and more.
 */
export async function getParsedTransactions(
  address: string,
  opts?: {
    network?: ShyftNetwork;
    limit?: number;
    beforeSignature?: string;
    type?: string;
  },
): Promise<ParsedTransaction[]> {
  const network = opts?.network ?? 'mainnet-beta';
  const limit = opts?.limit ?? 20;

  const params = new URLSearchParams({
    network,
    account: address,
    tx_num: String(limit),
  });
  if (opts?.beforeSignature) params.set('before_tx_signature', opts.beforeSignature);
  if (opts?.type) params.set('type', opts.type);

  const data = await shyftFetch<ParsedTransaction[]>(
    `/transaction/history?${params.toString()}`,
  );
  return data || [];
}

// ---------------------------------------------------------------------------
// Wallet Tokens
// ---------------------------------------------------------------------------

/**
 * Get all tokens held by a wallet.
 */
export async function getWalletTokens(
  address: string,
  network: ShyftNetwork = 'mainnet-beta',
): Promise<WalletTokenInfo[]> {
  const data = await shyftFetch<WalletTokenInfo[]>(
    `/wallet/all_tokens?network=${network}&wallet=${encodeURIComponent(address)}`,
  );
  return data || [];
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Get a comprehensive DeFi-focused summary for a Solana wallet.
 */
export async function getWalletDeFiSummary(address: string): Promise<ShyftSolanaSummary> {
  const [defi, txns, tokens] = await Promise.allSettled([
    getDeFiPositions(address),
    getParsedTransactions(address, { limit: 20 }),
    getWalletTokens(address),
  ]);

  return {
    address,
    defiPositions: defi.status === 'fulfilled' ? defi.value : null,
    recentTransactions: txns.status === 'fulfilled' ? txns.value : [],
    tokens: tokens.status === 'fulfilled' ? tokens.value : [],
    timestamp: new Date().toISOString(),
  };
}
