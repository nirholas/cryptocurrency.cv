/**
 * x402 Server Setup
 *
 * Creates and configures the x402 resource server
 * for payment verification and settlement
 */

import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { FACILITATOR_URL, CURRENT_NETWORK } from './config';

// =============================================================================
// FACILITATOR CLIENT
// =============================================================================

/**
 * HTTP Facilitator Client
 * Connects to the facilitator service for payment verification and settlement
 */
export const facilitatorClient = new HTTPFacilitatorClient({
  url: FACILITATOR_URL,
});

// =============================================================================
// RESOURCE SERVER
// =============================================================================

/**
 * x402 Resource Server
 * Handles payment verification and resource access control
 */
export const x402Server = new x402ResourceServer(facilitatorClient);

// Register EVM payment scheme for Base network
registerExactEvmScheme(x402Server);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if the server is properly configured
 */
export function isServerConfigured(): boolean {
  return Boolean(FACILITATOR_URL && CURRENT_NETWORK);
}

/**
 * Get server status for health checks
 */
export function getServerStatus() {
  return {
    configured: isServerConfigured(),
    facilitator: FACILITATOR_URL,
    network: CURRENT_NETWORK,
    supportedSchemes: ['exact'],
  };
}
