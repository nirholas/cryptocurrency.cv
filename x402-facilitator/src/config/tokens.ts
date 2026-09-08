import type { Address } from 'viem';

import type { EIP712Domain, SupportedChainId, TokenConfig } from '../types/index.js';

/** Native (Circle-issued) USDC on every supported chain. All sign with the "USD Coin" v2 domain. */
export const TOKENS: readonly TokenConfig[] = [
  { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6, eip712: { name: 'USD Coin', version: '2' } },
  { chainId: 84532, address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', symbol: 'USDC', decimals: 6, eip712: { name: 'USDC', version: '2' } },
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6, eip712: { name: 'USD Coin', version: '2' } },
  { chainId: 421614, address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', symbol: 'USDC', decimals: 6, eip712: { name: 'USDC', version: '2' } },
  { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6, eip712: { name: 'USD Coin', version: '2' } },
];

export function getToken(chainId: number, address: string): TokenConfig | undefined {
  const needle = address.toLowerCase();
  return TOKENS.find((t) => t.chainId === chainId && t.address.toLowerCase() === needle);
}

export function getTokensForChain(chainId: SupportedChainId): TokenConfig[] {
  return TOKENS.filter((t) => t.chainId === chainId);
}

/** EIP-712 domain for a token, or undefined when the token is not registered on that chain. */
export function getEIP712Domain(chainId: number, address: Address): EIP712Domain | undefined {
  const token = getToken(chainId, address);
  if (!token) return undefined;
  return {
    name: token.eip712.name,
    version: token.eip712.version,
    chainId: BigInt(chainId),
    verifyingContract: token.address,
  };
}

/** ABI fragment for the EIP-3009 surface of USDC. */
export const EIP3009_ABI = [
  {
    type: 'function',
    name: 'transferWithAuthorization',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'authorizationState',
    stateMutability: 'view',
    inputs: [
      { name: 'authorizer', type: 'address' },
      { name: 'nonce', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/** EIP-712 type definition for TransferWithAuthorization (EIP-3009). */
export const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;
