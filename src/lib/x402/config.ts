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
 * x402 Configuration - SINGLE SOURCE OF TRUTH
 * 
 * All x402 configuration constants must be imported from this file.
 * DO NOT define x402 constants anywhere else in the codebase.
 * 
 * @module lib/x402/config
 * @see https://docs.x402.org
 */

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * Production environment detection
 * Checks Vercel deployment environment first, then NODE_ENV
 */
export const IS_PRODUCTION = 
  process.env.VERCEL_ENV === 'production' || 
  process.env.NODE_ENV === 'production';

/**
 * Testnet mode detection
 * Explicit testnet flag OR non-production environment
 */
export const IS_TESTNET = 
  process.env.X402_TESTNET === 'true' || 
  !IS_PRODUCTION;

/**
 * Development mode detection
 */
export const IS_DEVELOPMENT = 
  process.env.NODE_ENV === 'development';

/**
 * Build-time detection (Next.js build phase)
 * Used to suppress verbose logging during static generation
 */
export const IS_BUILD_TIME = 
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build' ||
  process.env.CI === 'true' ||
  (process.env.VERCEL === '1' && process.env.VERCEL_ENV === undefined);

// =============================================================================
// NETWORK CONFIGURATION (CAIP-2 Standard)
// =============================================================================

/**
 * Supported network identifiers following CAIP-2 standard
 * @see https://chainagnostic.org/CAIPs/caip-2
 */
export const NETWORKS = {
  // EVM Networks (eip155:chainId)
  BASE_MAINNET: 'eip155:8453',
  BASE_SEPOLIA: 'eip155:84532',
  ARBITRUM: 'eip155:42161',

  // Solana Networks (solana:genesisHash)
  SOLANA_MAINNET: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  SOLANA_DEVNET: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
} as const;

export type NetworkId = (typeof NETWORKS)[keyof typeof NETWORKS];
export type EvmNetworkId = 'eip155:8453' | 'eip155:84532' | 'eip155:42161';
export type SolanaNetworkId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' | 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

/**
 * Current active network
 * Priority: X402_NETWORK env > production detection > default to testnet
 */
export const CURRENT_NETWORK: NetworkId = (() => {
  // Explicit network override
  if (process.env.X402_NETWORK) {
    return process.env.X402_NETWORK as NetworkId;
  }
  // Production uses Arbitrum (USDs support)
  if (IS_PRODUCTION && !IS_TESTNET) {
    return NETWORKS.ARBITRUM;
  }
  // Default to testnet
  return NETWORKS.BASE_SEPOLIA;
})();

/**
 * List of all supported networks for multi-network support
 */
export const SUPPORTED_NETWORKS: NetworkId[] = [
  NETWORKS.BASE_MAINNET,
  NETWORKS.BASE_SEPOLIA,
  NETWORKS.ARBITRUM,
  NETWORKS.SOLANA_MAINNET,
  NETWORKS.SOLANA_DEVNET,
];

// =============================================================================
// FACILITATOR CONFIGURATION
// =============================================================================

/**
 * Known facilitator endpoints
 * Facilitators handle payment verification and settlement
 */
export const FACILITATORS = {
  /** x402.org - Testnet only, no setup required, free */
  X402_ORG: 'https://x402.org/facilitator',

  /** CDP (Coinbase Developer Platform) - Production ready */
  CDP: 'https://api.cdp.coinbase.com/platform/v2/x402',

  /** Sperax - Gasless USDC + USDs on Base, Arbitrum, Ethereum */
  SPERAX: 'https://x402.sperax.io',

  /** PayAI - Multi-chain support (Solana, Base, Polygon, Avalanche) */
  PAYAI: 'https://facilitator.payai.network',

  /** x402.rs - Community Rust implementation */
  X402_RS: 'https://facilitator.x402.rs',
} as const;

export type FacilitatorId = keyof typeof FACILITATORS;

/**
 * Active facilitator URL
 * - Production: CDP facilitator (requires CDP API keys)
 * - Development: x402.org public facilitator (free, no setup)
 */
export const FACILITATOR_URL: string = (() => {
  // Explicit override
  if (process.env.X402_FACILITATOR_URL) {
    return process.env.X402_FACILITATOR_URL;
  }
  // Production uses Sperax facilitator
  if (IS_PRODUCTION && !IS_TESTNET) {
    return FACILITATORS.SPERAX;
  }
  // Default to x402.org for testing
  return FACILITATORS.X402_ORG;
})();

// =============================================================================
// PAYMENT ADDRESS CONFIGURATION
// =============================================================================

/**
 * EVM payment receiving address (your wallet)
 * 
 * CRITICAL: Set X402_PAYMENT_ADDRESS in production environment!
 * Payments will fail if this is the zero address.
 */
export const PAYMENT_ADDRESS: `0x${string}` = (() => {
  const addr = process.env.X402_PAYMENT_ADDRESS;
  if (addr && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return addr as `0x${string}`;
  }
  return '0x40252CFDF8B20Ed757D61ff157719F33Ec332402' as `0x${string}`;
})();

/**
 * Solana payment receiving address
 */
export const SOLANA_PAYMENT_ADDRESS: string = 
  process.env.X402_SOLANA_PAYMENT_ADDRESS || '';

// Validate payment address in production at runtime only (not during build)
// We use a function that's called at request time, not module load time
export function validatePaymentConfig(): void {
  if (typeof window === 'undefined' && IS_PRODUCTION) {
    if (PAYMENT_ADDRESS === '0x40252CFDF8B20Ed757D61ff157719F33Ec332402') {
      const errorMessage = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '[x402] WARNING: X402_PAYMENT_ADDRESS not configured!',
        '[x402] All x402 payments would be LOST with zero address.',
        '[x402] Set X402_PAYMENT_ADDRESS to your wallet address.',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n');
      console.error(errorMessage);
    }
  }
}

// =============================================================================
// TOKEN CONFIGURATION
// =============================================================================

/**
 * USDC token addresses by network
 * USDC implements EIP-3009 (transferWithAuthorization) required for x402
 */
export const USDC_ADDRESSES: Record<EvmNetworkId, `0x${string}`> = {
  'eip155:8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base Mainnet
  'eip155:84532': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  'eip155:42161': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
};

/**
 * USDs (Sperax USD) token address on Arbitrum
 * Yield-bearing stablecoin using EIP-2612 (permit)
 */
export const USDS_ADDRESS: `0x${string}` = '0xD74f5255D557944cf7Dd0E45FF521520002D5748';

/**
 * Solana USDC addresses by network
 */
export const SOLANA_USDC_ADDRESSES: Record<SolanaNetworkId, string> = {
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',   // Devnet
};

/**
 * Get USDC address for current network
 */
export const USDC_ADDRESS: `0x${string}` = 
  USDC_ADDRESSES[CURRENT_NETWORK as EvmNetworkId] || USDC_ADDRESSES['eip155:84532'];

/**
 * Accepted payment assets configuration
 */
export interface PaymentAsset {
  symbol: string;
  address: string;
  decimals: number;
  network: NetworkId;
}

export const ACCEPTED_ASSETS: PaymentAsset[] = [
  {
    symbol: 'USDC',
    address: USDC_ADDRESSES['eip155:8453'],
    decimals: 6,
    network: NETWORKS.BASE_MAINNET,
  },
  {
    symbol: 'USDC',
    address: USDC_ADDRESSES['eip155:84532'],
    decimals: 6,
    network: NETWORKS.BASE_SEPOLIA,
  },
  {
    symbol: 'USDC',
    address: USDC_ADDRESSES['eip155:42161'],
    decimals: 6,
    network: NETWORKS.ARBITRUM,
  },
  {
    symbol: 'USDs',
    address: USDS_ADDRESS,
    decimals: 18,
    network: NETWORKS.ARBITRUM,
  },
];

// =============================================================================
// OWNERSHIP PROOF CONFIGURATION
// =============================================================================

/**
 * Ownership proof for x402scan discovery registration.
 *
 * Proves you control the payTo address by signing the origin URL
 * with the payTo wallet's private key (EIP-191 personal_sign).
 *
 * Generate with: bun run scripts/generate-ownership-proof.ts
 * Set via: X402_OWNERSHIP_PROOF environment variable
 */
export const OWNERSHIP_PROOF: string | undefined = process.env.X402_OWNERSHIP_PROOF;

/**
 * Get ownershipProofs array for discovery documents.
 * Returns undefined if no proof is configured (field is omitted from response).
 */
export function getOwnershipProofs(): string[] | undefined {
  if (!OWNERSHIP_PROOF) return undefined;
  return [OWNERSHIP_PROOF];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if x402 payments are properly configured
 */
export function isX402Enabled(): boolean {
  return PAYMENT_ADDRESS !== '0x40252CFDF8B20Ed757D61ff157719F33Ec332402';
}

/**
 * Check if a network ID is an EVM network
 */
export function isEvmNetwork(networkId: string): networkId is EvmNetworkId {
  return networkId.startsWith('eip155:');
}

/**
 * Check if a network ID is a Solana network
 */
export function isSolanaNetwork(networkId: string): networkId is SolanaNetworkId {
  return networkId.startsWith('solana:');
}

/**
 * Get human-readable network display name
 */
export function getNetworkDisplayName(networkId: NetworkId = CURRENT_NETWORK): string {
  const names: Record<NetworkId, string> = {
    'eip155:8453': 'Base Mainnet',
    'eip155:84532': 'Base Sepolia (Testnet)',
    'eip155:42161': 'Arbitrum One',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana Mainnet',
    'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'Solana Devnet',
  };
  return names[networkId] || networkId;
}

/**
 * Get accepted assets for a specific network
 */
export function getAcceptedAssets(networkId: NetworkId = CURRENT_NETWORK): PaymentAsset[] {
  return ACCEPTED_ASSETS.filter(asset => asset.network === networkId);
}

/**
 * Get payment address for a specific network
 */
export function getPaymentAddress(networkId: NetworkId = CURRENT_NETWORK): string {
  if (isSolanaNetwork(networkId)) {
    return SOLANA_PAYMENT_ADDRESS;
  }
  return PAYMENT_ADDRESS;
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    environment: IS_PRODUCTION ? 'production' : 'development',
    testnet: IS_TESTNET,
    network: CURRENT_NETWORK,
    networkName: getNetworkDisplayName(),
    facilitator: FACILITATOR_URL,
    paymentAddress: PAYMENT_ADDRESS,
    usdcAddress: USDC_ADDRESS,
    x402Enabled: isX402Enabled(),
  };
}
