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
 * Sui Blockchain RPC API
 *
 * Sui Move-based L1 blockchain data via JSON-RPC 2.0.
 * Object queries, transaction blocks, move call results, and coin balances.
 *
 * No API key required — public fullnode endpoint.
 *
 * @see https://docs.sui.io/references/sui-api
 * @module lib/apis/sui
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const RPC_URL = 'https://fullnode.mainnet.sui.io:443';

// =============================================================================
// Types
// =============================================================================

export interface SuiObjectData {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: {
    AddressOwner?: string;
    ObjectOwner?: string;
    Shared?: { initial_shared_version: number };
    Immutable?: boolean;
  };
  content?: {
    dataType: string;
    type: string;
    fields: Record<string, unknown>;
    hasPublicTransfer: boolean;
  };
  display?: Record<string, string>;
  storageRebate?: string;
}

export interface SuiCoinBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance?: Record<string, string>;
}

export interface SuiCoinMetadata {
  id: string;
  decimals: number;
  name: string;
  symbol: string;
  description: string;
  iconUrl?: string;
}

export interface SuiTransactionBlock {
  digest: string;
  timestampMs: string;
  checkpoint?: string;
  transaction: {
    data: {
      sender: string;
      messageVersion: string;
      transaction: {
        kind: string;
        inputs?: unknown[];
        transactions?: unknown[];
      };
      gasData: {
        budget: string;
        price: string;
        owner: string;
        payment: Array<{ objectId: string; version: number; digest: string }>;
      };
    };
    txSignatures: string[];
  };
  effects: {
    status: { status: 'success' | 'failure'; error?: string };
    gasUsed: {
      computationCost: string;
      storageCost: string;
      storageRebate: string;
      nonRefundableStorageFee: string;
    };
    created?: Array<{ owner: Record<string, unknown>; reference: { objectId: string } }>;
    mutated?: Array<{ owner: Record<string, unknown>; reference: { objectId: string } }>;
    deleted?: Array<{ objectId: string }>;
  };
  events?: SuiEvent[];
}

export interface SuiEvent {
  id: { txDigest: string; eventSeq: string };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson?: Record<string, unknown>;
  timestampMs?: string;
}

export interface SuiMoveCallResult {
  results: unknown[];
  effects: {
    status: { status: string };
    gasUsed: Record<string, string>;
  };
}

export interface SuiNetworkSummary {
  latestCheckpoint: string;
  totalTransactions: string;
  referenceGasPrice: string;
  protocolVersion: string;
  epochNumber: string;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Make a JSON-RPC 2.0 call to the Sui fullnode.
 */
async function suiRpc<T>(method: string, params: unknown[] = []): Promise<T | null> {
  const res = await resilientFetchResponse(RPC_URL, {
    service: 'sui-rpc', timeoutMs: 8000, retries: 1,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `sui-${Date.now()}`,
      method,
      params,
    }),
    next: { revalidate: 15 }, // Sui has fast block times
  });

  if (!res.ok) {
    throw new Error(`Sui RPC error ${res.status}: ${method}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`Sui RPC error: ${json.error.message || JSON.stringify(json.error)}`);
  }

  return json.result as T;
}

// ---------------------------------------------------------------------------
// Object Queries
// ---------------------------------------------------------------------------

/**
 * Get a Sui object by its ID.
 */
export async function getObject(
  objectId: string,
  opts?: { showContent?: boolean; showDisplay?: boolean; showOwner?: boolean; showType?: boolean },
): Promise<SuiObjectData | null> {
  const options = {
    showContent: opts?.showContent ?? true,
    showDisplay: opts?.showDisplay ?? true,
    showOwner: opts?.showOwner ?? true,
    showType: opts?.showType ?? true,
  };

  const result = await suiRpc<{ data: SuiObjectData }>('sui_getObject', [objectId, options]);
  return result?.data ?? null;
}

/**
 * Get multiple objects in a single request.
 */
export async function getMultiObjects(
  objectIds: string[],
  opts?: { showContent?: boolean; showDisplay?: boolean },
): Promise<SuiObjectData[]> {
  const options = {
    showContent: opts?.showContent ?? true,
    showDisplay: opts?.showDisplay ?? false,
    showOwner: true,
    showType: true,
  };

  const results = await suiRpc<Array<{ data: SuiObjectData }>>('sui_multiGetObjects', [
    objectIds.slice(0, 50), // Limit batch size
    options,
  ]);

  return (results || []).map((r) => r.data).filter(Boolean);
}

/**
 * Get objects owned by an address.
 */
export async function getOwnedObjects(
  address: string,
  opts?: { cursor?: string; limit?: number; filter?: Record<string, unknown> },
): Promise<{ data: SuiObjectData[]; nextCursor?: string; hasNextPage: boolean }> {
  const result = await suiRpc<{
    data: Array<{ data: SuiObjectData }>;
    nextCursor?: string;
    hasNextPage: boolean;
  }>('suix_getOwnedObjects', [
    address,
    {
      filter: opts?.filter ?? null,
      options: { showContent: true, showType: true, showOwner: true },
    },
    opts?.cursor ?? null,
    opts?.limit ?? 50,
  ]);

  return {
    data: (result?.data || []).map((r) => r.data).filter(Boolean),
    nextCursor: result?.nextCursor,
    hasNextPage: result?.hasNextPage ?? false,
  };
}

// ---------------------------------------------------------------------------
// Coin Balances
// ---------------------------------------------------------------------------

/**
 * Get all coin balances for an address.
 */
export async function getAllBalances(address: string): Promise<SuiCoinBalance[]> {
  const data = await suiRpc<SuiCoinBalance[]>('suix_getAllBalances', [address]);
  return data || [];
}

/**
 * Get balance for a specific coin type.
 */
export async function getBalance(
  address: string,
  coinType: string = '0x2::sui::SUI',
): Promise<SuiCoinBalance | null> {
  return suiRpc<SuiCoinBalance>('suix_getBalance', [address, coinType]);
}

/**
 * Get metadata for a coin type.
 */
export async function getCoinMetadata(
  coinType: string = '0x2::sui::SUI',
): Promise<SuiCoinMetadata | null> {
  return suiRpc<SuiCoinMetadata>('suix_getCoinMetadata', [coinType]);
}

// ---------------------------------------------------------------------------
// Transaction Blocks
// ---------------------------------------------------------------------------

/**
 * Get a transaction block by digest.
 */
export async function getTransactionBlock(
  digest: string,
  opts?: { showInput?: boolean; showEffects?: boolean; showEvents?: boolean },
): Promise<SuiTransactionBlock | null> {
  const options = {
    showInput: opts?.showInput ?? true,
    showEffects: opts?.showEffects ?? true,
    showEvents: opts?.showEvents ?? true,
    showObjectChanges: false,
    showBalanceChanges: true,
  };

  return suiRpc<SuiTransactionBlock>('sui_getTransactionBlock', [digest, options]);
}

/**
 * Query recent transaction blocks with optional filters.
 */
export async function queryTransactionBlocks(
  opts?: {
    filter?: Record<string, unknown>;
    cursor?: string;
    limit?: number;
    descendingOrder?: boolean;
  },
): Promise<{ data: SuiTransactionBlock[]; nextCursor?: string; hasNextPage: boolean }> {
  const result = await suiRpc<{
    data: SuiTransactionBlock[];
    nextCursor?: string;
    hasNextPage: boolean;
  }>('suix_queryTransactionBlocks', [
    {
      filter: opts?.filter ?? null,
      options: { showInput: true, showEffects: true, showEvents: true },
    },
    opts?.cursor ?? null,
    opts?.limit ?? 20,
    opts?.descendingOrder ?? true,
  ]);

  return result ?? { data: [], hasNextPage: false };
}

/**
 * Get transactions for an address (sent from).
 */
export async function getTransactionsByAddress(
  address: string,
  opts?: { limit?: number; cursor?: string },
): Promise<{ data: SuiTransactionBlock[]; nextCursor?: string; hasNextPage: boolean }> {
  return queryTransactionBlocks({
    filter: { FromAddress: address },
    limit: opts?.limit ?? 20,
    cursor: opts?.cursor,
    descendingOrder: true,
  });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Query events by type.
 */
export async function queryEvents(
  eventType: string,
  opts?: { cursor?: string; limit?: number; descendingOrder?: boolean },
): Promise<{ data: SuiEvent[]; nextCursor?: string; hasNextPage: boolean }> {
  const result = await suiRpc<{
    data: SuiEvent[];
    nextCursor?: string;
    hasNextPage: boolean;
  }>('suix_queryEvents', [
    { MoveEventType: eventType },
    opts?.cursor ?? null,
    opts?.limit ?? 20,
    opts?.descendingOrder ?? true,
  ]);

  return result ?? { data: [], hasNextPage: false };
}

// ---------------------------------------------------------------------------
// Move Call Results (read-only)
// ---------------------------------------------------------------------------

/**
 * Execute a read-only Move call (devInspectTransactionBlock).
 */
export async function inspectMoveCall(
  sender: string,
  packageId: string,
  module: string,
  functionName: string,
  typeArguments: string[] = [],
  args: unknown[] = [],
): Promise<SuiMoveCallResult | null> {
  return suiRpc<SuiMoveCallResult>('sui_devInspectTransactionBlock', [
    sender,
    {
      kind: 'moveCall',
      data: {
        packageObjectId: packageId,
        module,
        function: functionName,
        typeArguments,
        arguments: args,
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Network Info
// ---------------------------------------------------------------------------

/**
 * Get current Sui network state.
 */
export async function getLatestCheckpoint(): Promise<string | null> {
  return suiRpc<string>('sui_getLatestCheckpointSequenceNumber', []);
}

/**
 * Get total transaction count on the network.
 */
export async function getTotalTransactions(): Promise<string | null> {
  return suiRpc<string>('sui_getTotalTransactionBlocks', []);
}

/**
 * Get the current reference gas price.
 */
export async function getReferenceGasPrice(): Promise<string | null> {
  return suiRpc<string>('suix_getReferenceGasPrice', []);
}

/**
 * Get current protocol config info.
 */
export async function getProtocolConfig(): Promise<Record<string, unknown> | null> {
  return suiRpc<Record<string, unknown>>('sui_getProtocolConfig', []);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Get a comprehensive Sui network summary.
 */
export async function getNetworkSummary(): Promise<SuiNetworkSummary> {
  const [checkpoint, totalTx, gasPrice, protocol] = await Promise.allSettled([
    getLatestCheckpoint(),
    getTotalTransactions(),
    getReferenceGasPrice(),
    getProtocolConfig(),
  ]);

  return {
    latestCheckpoint: checkpoint.status === 'fulfilled' ? (checkpoint.value ?? '0') : '0',
    totalTransactions: totalTx.status === 'fulfilled' ? (totalTx.value ?? '0') : '0',
    referenceGasPrice: gasPrice.status === 'fulfilled' ? (gasPrice.value ?? '0') : '0',
    protocolVersion:
      protocol.status === 'fulfilled'
        ? String((protocol.value as Record<string, unknown>)?.protocolVersion ?? 'unknown')
        : 'unknown',
    epochNumber:
      protocol.status === 'fulfilled'
        ? String((protocol.value as Record<string, unknown>)?.minSupportedProtocolVersion ?? '0')
        : '0',
    timestamp: new Date().toISOString(),
  };
}
