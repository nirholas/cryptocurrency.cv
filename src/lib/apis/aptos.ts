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
 * Aptos Blockchain REST API
 *
 * Aptos Move-based L1 blockchain data via REST API.
 * Account resources, transactions, events, and coin balances.
 *
 * No API key required — public fullnode endpoint.
 *
 * @see https://aptos.dev/nodes/aptos-api-spec
 * @module lib/apis/aptos
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://fullnode.mainnet.aptoslabs.com/v1';

// =============================================================================
// Types
// =============================================================================

export interface AptosAccountResource {
  type: string;
  data: Record<string, unknown>;
}

export interface AptosCoinStore {
  coin: {
    value: string;
  };
  frozen: boolean;
  deposit_events: AptosEventHandle;
  withdraw_events: AptosEventHandle;
}

export interface AptosEventHandle {
  counter: string;
  guid: { id: { addr: string; creation_num: string } };
}

export interface AptosTransaction {
  version: string;
  hash: string;
  state_change_hash: string;
  event_root_hash: string;
  state_checkpoint_hash?: string;
  gas_used: string;
  success: boolean;
  vm_status: string;
  accumulator_root_hash: string;
  timestamp: string;
  type: string;
  sender?: string;
  sequence_number?: string;
  max_gas_amount?: string;
  gas_unit_price?: string;
  expiration_timestamp_secs?: string;
  payload?: {
    type: string;
    function?: string;
    type_arguments?: string[];
    arguments?: unknown[];
  };
  events?: AptosEvent[];
  changes?: AptosStateChange[];
}

export interface AptosEvent {
  guid: { creation_number: string; account_address: string };
  sequence_number: string;
  type: string;
  data: Record<string, unknown>;
}

export interface AptosStateChange {
  type: string;
  address?: string;
  state_key_hash: string;
  data?: {
    type: string;
    data: Record<string, unknown>;
  };
}

export interface AptosLedgerInfo {
  chain_id: number;
  epoch: string;
  ledger_version: string;
  oldest_ledger_version: string;
  ledger_timestamp: string;
  node_role: string;
  oldest_block_height: string;
  block_height: string;
  git_hash: string;
}

export interface AptosBlock {
  block_height: string;
  block_hash: string;
  block_timestamp: string;
  first_version: string;
  last_version: string;
  transactions?: AptosTransaction[];
}

export interface AptosCoinBalance {
  coinType: string;
  balance: string;
  decimals: number;
  name: string;
  symbol: string;
}

export interface AptosNetworkSummary {
  chainId: number;
  epoch: string;
  ledgerVersion: string;
  blockHeight: string;
  ledgerTimestamp: string;
  nodeRole: string;
  gasEstimate: number;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Aptos REST API.
 */
async function aptosFetch<T>(path: string): Promise<T | null> {
  const res = await resilientFetchResponse(`${BASE_URL}${path}`, {
    service: 'aptos-rest', timeoutMs: 8000, retries: 1,
    headers: { accept: 'application/json' },
    next: { revalidate: 15 }, // Aptos has 1s block times
  });

  if (!res.ok) {
    throw new Error(`Aptos API error ${res.status}: ${path}`);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Account Resources
// ---------------------------------------------------------------------------

/**
 * Get all resources for an account address.
 */
export async function getAccountResources(
  address: string,
): Promise<AptosAccountResource[]> {
  const data = await aptosFetch<AptosAccountResource[]>(`/accounts/${encodeURIComponent(address)}/resources`);
  return data || [];
}

/**
 * Get a specific resource by type.
 */
export async function getAccountResource(
  address: string,
  resourceType: string,
): Promise<AptosAccountResource | null> {
  return aptosFetch<AptosAccountResource>(
    `/accounts/${encodeURIComponent(address)}/resource/${encodeURIComponent(resourceType)}`,
  );
}

/**
 * Get APT coin balance for an address.
 */
export async function getAptBalance(address: string): Promise<string | null> {
  const resource = await getAccountResource(
    address,
    '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
  );

  if (!resource) return null;
  const coinStore = resource.data as unknown as AptosCoinStore;
  return coinStore?.coin?.value ?? null;
}

/**
 * Get all modules published by an account.
 */
export async function getAccountModules(
  address: string,
): Promise<Array<{ abi: Record<string, unknown>; bytecode: string }>> {
  const data = await aptosFetch<Array<{ abi: Record<string, unknown>; bytecode: string }>>(
    `/accounts/${encodeURIComponent(address)}/modules`,
  );
  return data || [];
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

/**
 * Get transactions for an account.
 */
export async function getAccountTransactions(
  address: string,
  opts?: { limit?: number; start?: string },
): Promise<AptosTransaction[]> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.start) params.set('start', opts.start);

  const qs = params.toString();
  const path = `/accounts/${encodeURIComponent(address)}/transactions${qs ? `?${qs}` : ''}`;

  const data = await aptosFetch<AptosTransaction[]>(path);
  return data || [];
}

/**
 * Get a transaction by hash.
 */
export async function getTransactionByHash(hash: string): Promise<AptosTransaction | null> {
  return aptosFetch<AptosTransaction>(`/transactions/by_hash/${encodeURIComponent(hash)}`);
}

/**
 * Get a transaction by version number.
 */
export async function getTransactionByVersion(version: string): Promise<AptosTransaction | null> {
  return aptosFetch<AptosTransaction>(`/transactions/by_version/${encodeURIComponent(version)}`);
}

/**
 * Get recent transactions on the network.
 */
export async function getRecentTransactions(limit: number = 25): Promise<AptosTransaction[]> {
  const data = await aptosFetch<AptosTransaction[]>(`/transactions?limit=${limit}`);
  return data || [];
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Get events by event handle.
 */
export async function getEventsByEventHandle(
  address: string,
  eventHandleStruct: string,
  fieldName: string,
  opts?: { limit?: number; start?: string },
): Promise<AptosEvent[]> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.start) params.set('start', opts.start);

  const qs = params.toString();
  const path = `/accounts/${encodeURIComponent(address)}/events/${encodeURIComponent(eventHandleStruct)}/${encodeURIComponent(fieldName)}${qs ? `?${qs}` : ''}`;

  const data = await aptosFetch<AptosEvent[]>(path);
  return data || [];
}

/**
 * Get events by creation number.
 */
export async function getEventsByCreationNumber(
  address: string,
  creationNumber: string,
  opts?: { limit?: number; start?: string },
): Promise<AptosEvent[]> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.start) params.set('start', opts.start);

  const qs = params.toString();
  const path = `/accounts/${encodeURIComponent(address)}/events/${encodeURIComponent(creationNumber)}${qs ? `?${qs}` : ''}`;

  const data = await aptosFetch<AptosEvent[]>(path);
  return data || [];
}

// ---------------------------------------------------------------------------
// Blocks & Ledger
// ---------------------------------------------------------------------------

/**
 * Get current ledger information.
 */
export async function getLedgerInfo(): Promise<AptosLedgerInfo | null> {
  return aptosFetch<AptosLedgerInfo>('');
}

/**
 * Get a block by height.
 */
export async function getBlockByHeight(
  height: string,
  withTransactions: boolean = false,
): Promise<AptosBlock | null> {
  return aptosFetch<AptosBlock>(
    `/blocks/by_height/${encodeURIComponent(height)}?with_transactions=${withTransactions}`,
  );
}

/**
 * Get a block by version.
 */
export async function getBlockByVersion(
  version: string,
  withTransactions: boolean = false,
): Promise<AptosBlock | null> {
  return aptosFetch<AptosBlock>(
    `/blocks/by_version/${encodeURIComponent(version)}?with_transactions=${withTransactions}`,
  );
}

/**
 * Estimate gas price on the network.
 */
export async function estimateGasPrice(): Promise<number | null> {
  const data = await aptosFetch<{ deprioritized_gas_estimate: number; gas_estimate: number; prioritized_gas_estimate: number }>(
    '/estimate_gas_price',
  );
  return data?.gas_estimate ?? null;
}

// ---------------------------------------------------------------------------
// View Function (read-only Move calls)
// ---------------------------------------------------------------------------

/**
 * Execute a view function (read-only Move call).
 */
export async function executeViewFunction(
  functionId: string, // e.g. "0x1::coin::balance"
  typeArguments: string[] = [],
  args: unknown[] = [],
): Promise<unknown[] | null> {
  const res = await resilientFetchResponse(`${BASE_URL}/view`, {
    service: 'aptos-rest', timeoutMs: 8000, retries: 1,
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      function: functionId,
      type_arguments: typeArguments,
      arguments: args,
    }),
  });

  if (!res.ok) {
    throw new Error(`Aptos view function error ${res.status}: ${functionId}`);
  }

  return (await res.json()) as unknown[];
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Get a comprehensive Aptos network summary.
 */
export async function getNetworkSummary(): Promise<AptosNetworkSummary> {
  const [ledger, gasPrice] = await Promise.allSettled([
    getLedgerInfo(),
    estimateGasPrice(),
  ]);

  const ledgerInfo =
    ledger.status === 'fulfilled' ? ledger.value : null;

  return {
    chainId: ledgerInfo?.chain_id ?? 0,
    epoch: ledgerInfo?.epoch ?? '0',
    ledgerVersion: ledgerInfo?.ledger_version ?? '0',
    blockHeight: ledgerInfo?.block_height ?? '0',
    ledgerTimestamp: ledgerInfo?.ledger_timestamp ?? '0',
    nodeRole: ledgerInfo?.node_role ?? 'unknown',
    gasEstimate: gasPrice.status === 'fulfilled' ? (gasPrice.value ?? 0) : 0,
    timestamp: new Date().toISOString(),
  };
}
