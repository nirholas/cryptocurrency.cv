/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 */

/**
 * Network and address validation.
 *
 * The single most damaging thing an x402 server can publish is a syntactically
 * perfect challenge that directs payment somewhere unrecoverable. A missing
 * environment variable is enough to do it: the payTo falls back to the zero
 * address, every field still validates, and the first agent to pay burns its
 * funds. Nothing else in the x402 tooling checks for this.
 *
 * @module networks
 */

/** CAIP-2 chain identifiers we can name in a message. */
const KNOWN_NETWORKS: Record<string, string> = {
  'eip155:1': 'Ethereum',
  'eip155:10': 'OP Mainnet',
  'eip155:56': 'BNB Smart Chain',
  'eip155:137': 'Polygon',
  'eip155:196': 'X Layer',
  'eip155:8453': 'Base',
  'eip155:42161': 'Arbitrum One',
  'eip155:43114': 'Avalanche',
  'eip155:84532': 'Base Sepolia',
  'eip155:421614': 'Arbitrum Sepolia',
  'eip155:11155111': 'Sepolia',
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana',
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'Solana Devnet',
};

/**
 * Pre-CAIP-2 network names still emitted by some facilitators. Accepted, but
 * worth flagging: a client built against CAIP-2 cannot route them.
 */
const LEGACY_NETWORK_ALIASES: Record<string, string> = {
  base: 'eip155:8453',
  'base-sepolia': 'eip155:84532',
  arbitrum: 'eip155:42161',
  ethereum: 'eip155:1',
  polygon: 'eip155:137',
  solana: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
};

/** Addresses that accept funds and never return them. */
const UNSPENDABLE = new Set([
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
  '0xdead000000000000000042069420694206942069',
  '11111111111111111111111111111111',
]);

const CAIP2_RE = /^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$/;
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function networkName(network: string | undefined): string | undefined {
  if (!network) return undefined;
  return KNOWN_NETWORKS[network] ?? KNOWN_NETWORKS[LEGACY_NETWORK_ALIASES[network] ?? ''];
}

export function isCaip2(network: string | undefined): boolean {
  return typeof network === 'string' && CAIP2_RE.test(network);
}

export function legacyAliasFor(network: string | undefined): string | undefined {
  if (!network) return undefined;
  return LEGACY_NETWORK_ALIASES[network];
}

/** Normalise a legacy alias to CAIP-2 so two networks can be compared. */
export function canonicalNetwork(network: string | undefined): string | undefined {
  if (!network) return undefined;
  return LEGACY_NETWORK_ALIASES[network] ?? network;
}

export function isEvmNetwork(network: string | undefined): boolean {
  return typeof network === 'string' && canonicalNetwork(network)!.startsWith('eip155:');
}

/** True when funds sent to this address can never be recovered. */
export function isUnspendable(address: string | undefined): boolean {
  if (!address) return false;
  return UNSPENDABLE.has(address.toLowerCase()) || /^0x0{40}$/.test(address);
}

/** True when the address is well-formed for the network's address space. */
export function isPlausibleAddress(address: string | undefined, network: string | undefined): boolean {
  if (!address) return false;
  if (isEvmNetwork(network)) return EVM_ADDRESS_RE.test(address);
  if (canonicalNetwork(network)?.startsWith('solana:')) return SOLANA_ADDRESS_RE.test(address);
  return EVM_ADDRESS_RE.test(address) || SOLANA_ADDRESS_RE.test(address);
}
