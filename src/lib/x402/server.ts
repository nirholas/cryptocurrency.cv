/**
 * x402 Resource Server - SINGLE SOURCE OF TRUTH
 * 
 * Handles payment verification and settlement for protected API routes.
 * Uses the official @x402 SDK from Coinbase.
 * 
 * @module lib/x402/server
 * @see https://docs.x402.org
 * @see https://github.com/coinbase/x402
 */

import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import {
  FACILITATOR_URL,
  CURRENT_NETWORK,
  NETWORKS,
  IS_TESTNET,
  IS_PRODUCTION,
  IS_BUILD_TIME,
  PAYMENT_ADDRESS,
  isEvmNetwork,
  getNetworkDisplayName,
  type NetworkId,
} from './config';

// Track if we've already logged initialization
let _hasLoggedInit = false;

// =============================================================================
// FACILITATOR CLIENT
// =============================================================================

/**
 * HTTP client for communicating with the facilitator service
 * The facilitator handles payment verification and on-chain settlement
 */
export const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
});

// =============================================================================
// RESOURCE SERVER
// =============================================================================

/**
 * x402 Resource Server singleton
 * 
 * This server instance handles:
 * - Payment verification (checking payment signatures)
 * - Settlement (submitting payments to blockchain via facilitator)
 * - Scheme registration (EVM, Solana, etc.)
 */
let _serverInstance: x402ResourceServer | null = null;

/**
 * Get or create the x402 resource server instance
 */
export function getX402Server(): x402ResourceServer {
  if (!_serverInstance) {
    _serverInstance = createX402Server();
  }
  return _serverInstance;
}

/**
 * Create a new x402 resource server
 * This is called once on first access and cached
 */
function createX402Server(): x402ResourceServer {
  const server = new x402ResourceServer(facilitatorClient);
  
  // Register EVM payment scheme for current network
  if (isEvmNetwork(CURRENT_NETWORK)) {
    registerExactEvmScheme(server);
  }
  
  // In testnet mode, also register mainnet scheme for future-proofing
  if (IS_TESTNET && CURRENT_NETWORK === NETWORKS.BASE_SEPOLIA && !IS_BUILD_TIME && !_hasLoggedInit) {
    // Mainnet scheme is already registered by registerExactEvmScheme
    console.log('[x402] Testnet mode: Base Sepolia scheme registered');
  }
  
  // Log server initialization (only once, not during build)
  if (IS_PRODUCTION && !IS_BUILD_TIME && !_hasLoggedInit) {
    _hasLoggedInit = true;
    console.log('[x402] Production server initialized');
    console.log('[x402] Network:', CURRENT_NETWORK);
    console.log('[x402] Facilitator:', FACILITATOR_URL);
  }
  
  return server;
}

// Export lazy singleton (backward compatibility) - avoids initialization during build
export const x402Server = new Proxy({} as x402ResourceServer, {
  get(_, prop) {
    return (getX402Server() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// =============================================================================
// SERVER UTILITIES
// =============================================================================

/**
 * Validate that the server is properly configured
 */
export function validateConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!FACILITATOR_URL) {
    errors.push('FACILITATOR_URL is not configured');
  }
  
  // Check facilitator is reachable (async check, just validate URL format here)
  try {
    new URL(FACILITATOR_URL);
  } catch {
    errors.push(`FACILITATOR_URL is not a valid URL: ${FACILITATOR_URL}`);
  }

  // Add warnings for non-critical issues
  if (!PAYMENT_ADDRESS || PAYMENT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    warnings.push('PAYMENT_ADDRESS is not set - payments will not work');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get server status for health checks
 */
export function getServerStatus(): {
  initialized: boolean;
  network: NetworkId;
  facilitator: string;
  testnet: boolean;
} {
  return {
    initialized: _serverInstance !== null,
    network: CURRENT_NETWORK,
    facilitator: FACILITATOR_URL,
    testnet: IS_TESTNET,
  };
}

/**
 * Reset server instance (for testing only)
 */
export function resetServer(): void {
  if (process.env.NODE_ENV === 'test') {
    _serverInstance = null;
  }
}
