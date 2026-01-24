/**
 * x402 Server Setup
 *
 * Creates and configures the x402 resource server
 * for payment verification and settlement
 */

import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import {
  FACILITATOR_URL,
  CURRENT_NETWORK,
  PAYMENT_ADDRESS,
  IS_PRODUCTION,
  IS_TESTNET,
  getNetworkDisplayName,
} from './config';

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
// CONFIGURATION VALIDATION
// =============================================================================

export interface ConfigValidation {
  valid: boolean;
  isProduction: boolean;
  isTestnet: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate x402 configuration for production readiness
 */
export function validateConfig(): ConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check payment address
  if (!PAYMENT_ADDRESS || PAYMENT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    if (IS_PRODUCTION) {
      errors.push('X402_PAYMENT_ADDRESS not set - payments will fail in production!');
    } else {
      warnings.push('X402_PAYMENT_ADDRESS not set - using zero address (development mode)');
    }
  }

  // Check if production is using testnet
  if (IS_PRODUCTION && IS_TESTNET) {
    warnings.push('Production deployment using testnet - set X402_TESTNET=false or remove it');
  }

  // Check facilitator URL
  if (!FACILITATOR_URL) {
    warnings.push('X402_FACILITATOR_URL not set - using default facilitator');
  }

  // Validate payment address format
  if (PAYMENT_ADDRESS && !PAYMENT_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push(`Invalid payment address format: ${PAYMENT_ADDRESS}`);
  }

  return {
    valid: errors.length === 0,
    isProduction: IS_PRODUCTION,
    isTestnet: IS_TESTNET,
    errors,
    warnings,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if the server is properly configured
 */
export function isServerConfigured(): boolean {
  const validation = validateConfig();
  return validation.valid;
}

/**
 * Get server status for health checks and debugging
 */
export function getServerStatus() {
  const validation = validateConfig();
  return {
    configured: validation.valid,
    isProduction: validation.isProduction,
    isTestnet: validation.isTestnet,
    network: CURRENT_NETWORK,
    networkName: getNetworkDisplayName(CURRENT_NETWORK),
    facilitator: FACILITATOR_URL,
    paymentAddress: PAYMENT_ADDRESS
      ? `${PAYMENT_ADDRESS.slice(0, 6)}...${PAYMENT_ADDRESS.slice(-4)}`
      : 'not set',
    supportedSchemes: ['exact'],
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

// =============================================================================
// STARTUP VALIDATION
// =============================================================================

// Log configuration status at startup (server-side only)
if (typeof window === 'undefined') {
  const validation = validateConfig();

  if (validation.errors.length > 0) {
    console.error('[x402] ❌ Configuration errors:');
    validation.errors.forEach((e) => console.error(`  - ${e}`));
  }

  if (validation.warnings.length > 0 && !IS_PRODUCTION) {
    console.warn('[x402] ⚠️  Configuration warnings:');
    validation.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (validation.valid) {
    console.log(
      `[x402] ✅ Server configured for ${getNetworkDisplayName(CURRENT_NETWORK)} (${IS_PRODUCTION ? 'production' : 'development'})`
    );
  }
}
