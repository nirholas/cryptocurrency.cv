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
 * Current network based on environment
 */
export const CURRENT_NETWORK: NetworkId =
  (process.env.X402_NETWORK as NetworkId) ||
  (process.env.NODE_ENV === 'production' ? NETWORKS.BASE_MAINNET : NETWORKS.BASE_SEPOLIA);

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
 */
export const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ||
  (process.env.NODE_ENV === 'production' ? FACILITATORS.CDP : FACILITATORS.X402_ORG);

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
  process.env.NODE_ENV === 'production' &&
  PAYMENT_ADDRESS === '0x0000000000000000000000000000000000000000'
) {
  console.error('[x402] CRITICAL: X402_PAYMENT_ADDRESS not set! Configure your wallet address.');
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
};

/**
 * Get USDC address for current network
 */
export const USDC_ADDRESS = USDC_ADDRESSES[CURRENT_NETWORK];
