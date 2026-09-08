import type { Address, Hex } from 'viem';

/** Chain IDs this facilitator can verify and settle on. */
export type SupportedChainId = 1 | 8453 | 84532 | 42161 | 421614;

/** EIP-3009 TransferWithAuthorization message, as signed by the payer. */
export interface TransferAuthorization {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}

/** A signed x402 payment: the authorization plus the payer's EIP-712 signature. */
export interface X402Payment {
  chainId: SupportedChainId;
  token: Address;
  authorization: TransferAuthorization;
  signature: Hex;
}

/** What a resource server requires before it will serve a paid resource. */
export interface PaymentRequirements {
  chainId: SupportedChainId;
  asset: Address;
  payTo: Address;
  maxAmountRequired: bigint;
  /** Unix seconds after which these requirements are no longer honoured. */
  expiry?: number;
}

export type VerificationResult =
  | { valid: true; signer: Address }
  | { valid: false; reason: string };

export interface SettlementResult {
  success: boolean;
  chainId: number;
  network: string;
  txHash?: Hex;
  blockNumber?: number;
  error?: string;
}

export interface ChainConfig {
  chainId: SupportedChainId;
  name: string;
  /** Short slug used in API responses, e.g. "base". */
  network: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  testnet: boolean;
}

export interface TokenConfig {
  chainId: SupportedChainId;
  address: Address;
  symbol: string;
  decimals: number;
  /** EIP-712 domain name and version the token contract signs with. */
  eip712: { name: string; version: string };
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: bigint;
  verifyingContract: Address;
}
