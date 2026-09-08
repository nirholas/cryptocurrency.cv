import { env } from './env.js';
import type { ChainConfig, SupportedChainId } from '../types/index.js';

export const SUPPORTED_CHAINS: readonly ChainConfig[] = [
  {
    chainId: 8453,
    name: 'Base',
    network: 'base',
    rpcUrl: env.BASE_RPC_URL,
    blockExplorerUrl: 'https://basescan.org',
    testnet: false,
  },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    rpcUrl: env.BASE_SEPOLIA_RPC_URL,
    blockExplorerUrl: 'https://sepolia.basescan.org',
    testnet: true,
  },
  {
    chainId: 42161,
    name: 'Arbitrum One',
    network: 'arbitrum',
    rpcUrl: env.ARBITRUM_RPC_URL,
    blockExplorerUrl: 'https://arbiscan.io',
    testnet: false,
  },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    network: 'arbitrum-sepolia',
    rpcUrl: env.ARBITRUM_SEPOLIA_RPC_URL,
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
    testnet: true,
  },
  {
    chainId: 1,
    name: 'Ethereum',
    network: 'ethereum',
    rpcUrl: env.ETHEREUM_RPC_URL,
    blockExplorerUrl: 'https://etherscan.io',
    testnet: false,
  },
];

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.chainId === chainId);
}

export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return getChainConfig(chainId) !== undefined;
}
