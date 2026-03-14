import { describe, it, expect, vi } from 'vitest';
import {
  NETWORKS,
  FACILITATORS,
  isEvmNetwork,
  isSolanaNetwork,
  getNetworkDisplayName,
  getConfigSummary,
  IS_TESTNET,
  IS_BUILD_TIME,
  USDC_ADDRESSES,
  PAYMENT_ADDRESS,
} from '@/lib/x402/config';

describe('NETWORKS', () => {
  it('should have Base Mainnet', () => {
    expect(NETWORKS.BASE_MAINNET).toBe('eip155:8453');
  });

  it('should have Base Sepolia', () => {
    expect(NETWORKS.BASE_SEPOLIA).toBe('eip155:84532');
  });

  it('should have Solana Mainnet', () => {
    expect(NETWORKS.SOLANA_MAINNET).toMatch(/^solana:/);
  });

  it('should have Solana Devnet', () => {
    expect(NETWORKS.SOLANA_DEVNET).toMatch(/^solana:/);
  });
});

describe('FACILITATORS', () => {
  it('should have X402_ORG endpoint', () => {
    expect(FACILITATORS.X402_ORG).toBe('https://x402.org/facilitator');
  });

  it('should have CDP endpoint', () => {
    expect(FACILITATORS.CDP).toContain('cdp.coinbase.com');
  });

  it('should have PAYAI endpoint', () => {
    expect(FACILITATORS.PAYAI).toContain('payai.network');
  });
});

describe('isEvmNetwork', () => {
  it('should return true for EVM networks', () => {
    expect(isEvmNetwork('eip155:8453')).toBe(true);
    expect(isEvmNetwork('eip155:84532')).toBe(true);
  });

  it('should return false for Solana networks', () => {
    expect(isEvmNetwork('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')).toBe(false);
  });

  it('should return false for invalid strings', () => {
    expect(isEvmNetwork('random')).toBe(false);
    expect(isEvmNetwork('')).toBe(false);
  });
});

describe('isSolanaNetwork', () => {
  it('should return true for Solana networks', () => {
    expect(isSolanaNetwork('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')).toBe(true);
    expect(isSolanaNetwork('solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')).toBe(true);
  });

  it('should return false for EVM networks', () => {
    expect(isSolanaNetwork('eip155:8453')).toBe(false);
  });

  it('should return false for invalid strings', () => {
    expect(isSolanaNetwork('bitcoin')).toBe(false);
  });
});

describe('getNetworkDisplayName', () => {
  it('should return "Base Mainnet" for Base mainnet', () => {
    expect(getNetworkDisplayName('eip155:8453')).toBe('Base Mainnet');
  });

  it('should return "Base Sepolia (Testnet)" for Base testnet', () => {
    expect(getNetworkDisplayName('eip155:84532')).toBe('Base Sepolia (Testnet)');
  });

  it('should return "Solana Mainnet" for Solana', () => {
    expect(getNetworkDisplayName('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')).toBe('Solana Mainnet');
  });

  it('should return "Solana Devnet" for Solana devnet', () => {
    expect(getNetworkDisplayName('solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')).toBe('Solana Devnet');
  });
});

describe('USDC_ADDRESSES', () => {
  it('should have Base Mainnet USDC address', () => {
    expect(USDC_ADDRESSES['eip155:8453']).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have Base Sepolia USDC address', () => {
    expect(USDC_ADDRESSES['eip155:84532']).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

describe('PAYMENT_ADDRESS', () => {
  it('should be a valid Ethereum address', () => {
    expect(PAYMENT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

describe('getConfigSummary', () => {
  it('should return an object with expected fields', () => {
    const summary = getConfigSummary();
    expect(summary.environment).toBeDefined();
    expect(summary.testnet).toBeDefined();
    expect(summary.network).toBeDefined();
    expect(summary.networkName).toBeDefined();
    expect(summary.facilitator).toBeDefined();
    expect(summary.paymentAddress).toBeDefined();
    expect(summary.x402Enabled).toBeDefined();
  });

  it('should have correct environment string', () => {
    const summary = getConfigSummary();
    expect(['production', 'development']).toContain(summary.environment);
  });
});
