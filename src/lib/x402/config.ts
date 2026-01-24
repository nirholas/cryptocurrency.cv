/**
 * x402 Configuration
 *
 * Central configuration for x402 payment protocol
 * @see https://docs.x402.org
 */

// =============================================================================
// NETWORK CONFIGURATION (CAIP-2 Standard)
// =============================================================================

export const NETWORKS = {
  // EVM Networks
  BASE_MAINNET: 'eip155:8453',
  BASE_SEPOLIA: 'eip155:84532',

  // Solana Networks
  SOLANA_MAINNET: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  SOLANA_DEVNET: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
} as const;

export type NetworkId = (typeof NETWORKS)[keyof typeof NETWORKS];

/**
 * Check if we're in production environment
 * Uses VERCEL_ENV (Vercel deployments) or falls back to NODE_ENV
 */
export const IS_PRODUCTION =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

/**
 * Check if we're explicitly in testnet mode
 */
export const IS_TESTNET = process.env.X402_TESTNET === 'true' || !IS_PRODUCTION;

/**
 * Current network based on environment
 * Priority: X402_NETWORK env var > VERCEL_ENV > NODE_ENV
 */
export const CURRENT_NETWORK: NetworkId =
  (process.env.X402_NETWORK as NetworkId) ||
  (IS_PRODUCTION && !process.env.X402_TESTNET ? NETWORKS.BASE_MAINNET : NETWORKS.BASE_SEPOLIA);

// =============================================================================
// FACILITATOR CONFIGURATION
// =============================================================================

export const FACILITATORS = {
  /** x402.org - Testnet only, no setup required */
  X402_ORG: 'https://x402.org/facilitator',

  /** CDP Facilitator - Production ready, requires CDP API keys */
  CDP: 'https://api.cdp.coinbase.com/platform/v2/x402',

  /** PayAI - Multi-chain support (Solana, Base, Polygon, etc.) */
  PAYAI: 'https://facilitator.payai.network',

  /** x402.rs - Community Rust implementation */
  X402_RS: 'https://facilitator.x402.rs',
} as const;

/**
 * Active facilitator URL
 * - Production: Uses CDP (Coinbase Developer Platform) facilitator
 * - Development/Testnet: Uses x402.org public facilitator (no setup required)
 */
export const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ||
  (IS_PRODUCTION ? FACILITATORS.CDP : FACILITATORS.X402_ORG);

// =============================================================================
// PAYMENT ADDRESS
// =============================================================================

/**
 * Payment receiving address (your wallet)
 * CRITICAL: Set X402_PAYMENT_ADDRESS in production!
 */
export const PAYMENT_ADDRESS =
  (process.env.X402_PAYMENT_ADDRESS as `0x${string}`) ||
  ('0x0000000000000000000000000000000000000000' as `0x${string}`);

// Warn if not configured in production
if (
  typeof window === 'undefined' &&
  IS_PRODUCTION &&
  PAYMENT_ADDRESS === '0x0000000000000000000000000000000000000000'
) {
  console.error('[x402] CRITICAL: X402_PAYMENT_ADDRESS not set! Configure your wallet address.');
  console.error('[x402] Payments will fail in production. Set X402_PAYMENT_ADDRESS in environment.');
}

// =============================================================================
// TOKEN CONFIGURATION
// =============================================================================

/**
 * USDC token addresses by network
 */
export const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  'eip155:8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet
  'eip155:84532': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  'eip155:137': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon Mainnet
  'eip155:1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet
};

/**
 * Get USDC address for current network
 */
export const USDC_ADDRESS = USDC_ADDRESSES[CURRENT_NETWORK];

// =============================================================================
// MULTI-CHAIN SUPPORT (x402 Best Practice)
// =============================================================================

/**
 * Solana payment addresses
 * For Solana networks, use base58 encoded addresses
 */
export const SOLANA_PAYMENT_ADDRESS =
  process.env.X402_SOLANA_PAYMENT_ADDRESS || '';

/**
 * Solana USDC mint addresses
 */
export const SOLANA_USDC_ADDRESSES = {
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet
} as const;

/**
 * Supported networks for payment acceptance
 * Top facilitators like Dexter support 40+ chains - we start with the most common
 */
export const SUPPORTED_NETWORKS: NetworkId[] = [
  NETWORKS.BASE_MAINNET,
  NETWORKS.BASE_SEPOLIA,
  ...(SOLANA_PAYMENT_ADDRESS ? [NETWORKS.SOLANA_MAINNET] : []),
];

/**
 * Payment configuration for multi-chain accepts
 * Used in 402 responses to advertise all accepted payment methods
 */
export interface PaymentAsset {
  network: NetworkId | string;
  asset: `0x${string}` | string;
  decimals: number;
  symbol: string;
  type: 'evm' | 'solana';
}

export const ACCEPTED_ASSETS: PaymentAsset[] = [
  // EVM Networks
  {
    network: NETWORKS.BASE_MAINNET,
    asset: USDC_ADDRESSES['eip155:8453'],
    decimals: 6,
    symbol: 'USDC',
    type: 'evm',
  },
  {
    network: NETWORKS.BASE_SEPOLIA,
    asset: USDC_ADDRESSES['eip155:84532'],
    decimals: 6,
    symbol: 'USDC',
    type: 'evm',
  },
  // Solana Networks (conditionally added)
  ...(SOLANA_PAYMENT_ADDRESS
    ? [
        {
          network: NETWORKS.SOLANA_MAINNET,
          asset: SOLANA_USDC_ADDRESSES['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
          decimals: 6,
          symbol: 'USDC',
          type: 'solana' as const,
        },
      ]
    : []),
];

/**
 * Get payment address for a specific network
 */
export function getPaymentAddress(network: string): string {
  if (network.startsWith('solana:')) {
    return SOLANA_PAYMENT_ADDRESS;
  }
  return PAYMENT_ADDRESS;
}

/**
 * Get all accepted assets for multi-chain 402 responses
 */
export function getAcceptedAssets(priceUSDC: number): Array<{
  scheme: string;
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
}> {
  return ACCEPTED_ASSETS.map((a) => ({
    scheme: 'exact',
    network: a.network,
    maxAmountRequired: priceUSDC.toString(),
    asset: a.asset,
    payTo: getPaymentAddress(a.network),
  }));
}

// =============================================================================
// NETWORK UTILITIES
// =============================================================================

/**
 * Check if a network is EVM-based
 */
export function isEvmNetwork(network: string): boolean {
  return network.startsWith('eip155:');
}

/**
 * Check if a network is Solana-based
 */
export function isSolanaNetwork(network: string): boolean {
  return network.startsWith('solana:');
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(network: string): string {
  const names: Record<string, string> = {
    'eip155:8453': 'Base',
    'eip155:84532': 'Base Sepolia',
    'eip155:137': 'Polygon',
    'eip155:1': 'Ethereum',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana',
    'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'Solana Devnet',
  };
  return names[network] || network;
}
