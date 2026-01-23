/**
 * x402 Payment Protocol - Client Configuration
 *
 * Client-side utilities for making paid API requests with automatic
 * payment handling. Integrates with wagmi/viem for wallet signing.
 *
 * @module lib/x402-client
 * @see https://github.com/coinbase/x402
 *
 * @example
 * ```typescript
 * import { usePremiumFetch } from '@/lib/x402-client';
 *
 * function MyComponent() {
 *   const { premiumFetch, isReady } = usePremiumFetch();
 *
 *   const fetchData = async () => {
 *     const data = await premiumFetch('/api/premium/market/history?coinId=bitcoin');
 *     console.log(data);
 *   };
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { createWalletClient, custom, type WalletClient, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// ============================================================================
// Types
// ============================================================================

/**
 * Payment requirement returned in 402 response
 */
export interface PaymentRequirement {
  scheme: string;
  network: string;
  asset: string;
  payTo: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  paymentNonce: string;
  validAfter?: number;
  validBefore?: number;
}

/**
 * 402 Payment Required response
 */
export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentRequirement[];
  error?: string;
  message?: string;
  freeAlternative?: string;
  pricing?: Record<string, string>;
}

/**
 * Payment result from settlement
 */
export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  network?: string;
  settledAt?: string;
  error?: string;
}

/**
 * Options for premium fetch
 */
export interface PremiumFetchOptions extends RequestInit {
  /** Skip payment and just try the request */
  skipPayment?: boolean;
  /** Callback when payment is required */
  onPaymentRequired?: (requirements: PaymentRequirement[]) => Promise<boolean>;
  /** Callback when payment is processing */
  onPaymentProcessing?: () => void;
  /** Callback when payment succeeds */
  onPaymentSuccess?: (result: PaymentResult) => void;
  /** Callback when payment fails */
  onPaymentError?: (error: Error) => void;
}

/**
 * State for premium fetch hook
 */
export interface PremiumFetchState {
  isConnected: boolean;
  isReady: boolean;
  address: Address | null;
  chainId: number | null;
  isProcessingPayment: boolean;
  lastPayment: PaymentResult | null;
  error: Error | null;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported chains for payments
 */
export const supportedChains: Record<string, typeof base | typeof baseSepolia> = {
  'eip155:84532': baseSepolia,
  'eip155:8453': base,
};

/**
 * Default chain (Base Sepolia for testing)
 */
export const defaultChain = baseSepolia;

/**
 * USDC contract addresses
 */
export const usdcAddresses: Record<string, Address> = {
  'eip155:84532': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
  'eip155:8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
};

// ============================================================================
// EIP-3009 Signing
// ============================================================================

/**
 * EIP-3009 TransferWithAuthorization domain type
 */
const EIP3009_DOMAIN = {
  name: 'USD Coin',
  version: '2',
} as const;

/**
 * EIP-3009 TransferWithAuthorization types
 */
const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Sign an EIP-3009 transfer authorization
 */
async function signTransferAuthorization(
  walletClient: WalletClient,
  params: {
    from: Address;
    to: Address;
    value: bigint;
    validAfter: bigint;
    validBefore: bigint;
    nonce: `0x${string}`;
    chainId: number;
    usdcAddress: Address;
  }
): Promise<`0x${string}`> {
  const domain = {
    ...EIP3009_DOMAIN,
    chainId: params.chainId,
    verifyingContract: params.usdcAddress,
  };

  const message = {
    from: params.from,
    to: params.to,
    value: params.value,
    validAfter: params.validAfter,
    validBefore: params.validBefore,
    nonce: params.nonce,
  };

  const signature = await walletClient.signTypedData({
    account: params.from,
    domain,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: 'TransferWithAuthorization',
    message,
  });

  return signature;
}

// ============================================================================
// Payment Processing
// ============================================================================

/**
 * Create a payment payload for a 402 response
 */
async function createPaymentPayload(
  walletClient: WalletClient,
  requirement: PaymentRequirement,
  fromAddress: Address
): Promise<string> {
  const chainId = parseInt(requirement.network.split(':')[1]);
  const usdcAddress = usdcAddresses[requirement.network];

  if (!usdcAddress) {
    throw new Error(`Unsupported network: ${requirement.network}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const validAfter = BigInt(requirement.validAfter || now - 60);
  const validBefore = BigInt(requirement.validBefore || now + 3600); // 1 hour

  // Convert nonce to bytes32
  const nonce = requirement.paymentNonce.startsWith('0x')
    ? (requirement.paymentNonce as `0x${string}`)
    : (`0x${Buffer.from(requirement.paymentNonce).toString('hex').padStart(64, '0')}` as `0x${string}`);

  const signature = await signTransferAuthorization(walletClient, {
    from: fromAddress,
    to: requirement.payTo as Address,
    value: BigInt(requirement.maxAmountRequired),
    validAfter,
    validBefore,
    nonce,
    chainId,
    usdcAddress,
  });

  const payload = {
    x402Version: 2,
    scheme: 'exact',
    network: requirement.network,
    payload: {
      signature,
      authorization: {
        from: fromAddress,
        to: requirement.payTo,
        asset: usdcAddress,
        amount: requirement.maxAmountRequired,
        nonce: requirement.paymentNonce,
        validAfter: Number(validAfter),
        validBefore: Number(validBefore),
      },
    },
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Parse a 402 response to get payment requirements
 */
async function parsePaymentRequired(response: Response): Promise<PaymentRequiredResponse> {
  // Try to get requirements from header first (v2)
  const headerValue = response.headers.get('payment-required');
  if (headerValue) {
    try {
      return JSON.parse(atob(headerValue));
    } catch {
      // Fall through to body parsing
    }
  }

  // Parse from response body (v1 or fallback)
  const body = await response.json();
  return body as PaymentRequiredResponse;
}

// ============================================================================
// Premium Fetch Function
// ============================================================================

/**
 * Create a fetch function that handles 402 payments automatically
 *
 * @param walletClient - Viem wallet client for signing
 * @param address - Connected wallet address
 * @returns Fetch function with payment handling
 */
export function createPremiumFetch(walletClient: WalletClient, address: Address) {
  return async function premiumFetch<T = unknown>(
    url: string,
    options: PremiumFetchOptions = {}
  ): Promise<T> {
    const {
      skipPayment = false,
      onPaymentRequired,
      onPaymentProcessing,
      onPaymentSuccess,
      onPaymentError,
      ...fetchOptions
    } = options;

    // Make initial request
    let response = await fetch(url, fetchOptions);

    // If not 402 or skipping payment, return normally
    if (response.status !== 402 || skipPayment) {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }

    // Parse payment requirements
    const requirements = await parsePaymentRequired(response);

    // Let caller decide whether to proceed
    if (onPaymentRequired) {
      const shouldProceed = await onPaymentRequired(requirements.accepts);
      if (!shouldProceed) {
        throw new Error('Payment cancelled by user');
      }
    }

    // Find a requirement we can fulfill (prefer matching network)
    const requirement = requirements.accepts[0];
    if (!requirement) {
      throw new Error('No acceptable payment method found');
    }

    onPaymentProcessing?.();

    try {
      // Create signed payment
      const paymentSignature = await createPaymentPayload(walletClient, requirement, address);

      // Retry request with payment
      response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'payment-signature': paymentSignature,
        },
      });

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.status}`);
      }

      // Parse settlement receipt from response header
      const paymentResponse = response.headers.get('payment-response');
      if (paymentResponse) {
        const result = JSON.parse(atob(paymentResponse)) as PaymentResult;
        onPaymentSuccess?.(result);
      }

      return response.json();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onPaymentError?.(err);
      throw err;
    }
  };
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * React hook for premium fetch with wallet integration
 *
 * Provides a fetch function that automatically handles x402 payments
 * when connected to a wallet.
 *
 * @returns Premium fetch state and functions
 *
 * @example
 * ```typescript
 * function PremiumDataComponent() {
 *   const { premiumFetch, isReady, connect, address } = usePremiumFetch();
 *
 *   const handleFetch = async () => {
 *     if (!isReady) {
 *       await connect();
 *       return;
 *     }
 *
 *     const data = await premiumFetch('/api/premium/market/history', {
 *       onPaymentRequired: (reqs) => confirm(`Pay ${reqs[0].maxAmountRequired}?`),
 *     });
 *   };
 * }
 * ```
 */
export function usePremiumFetch() {
  const [state, setState] = useState<PremiumFetchState>({
    isConnected: false,
    isReady: false,
    address: null,
    chainId: null,
    isProcessingPayment: false,
    lastPayment: null,
    error: null,
  });

  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  /**
   * Connect to wallet
   */
  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setState((s) => ({
        ...s,
        error: new Error('No wallet found. Please install MetaMask or Coinbase Wallet.'),
      }));
      return false;
    }

    try {
      // Request accounts
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as Address[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Get chain ID
      const chainIdHex = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      const chainId = parseInt(chainIdHex, 16);

      // Create wallet client
      const client = createWalletClient({
        account: address,
        chain: supportedChains[`eip155:${chainId}`] || defaultChain,
        transport: custom(window.ethereum),
      });

      setWalletClient(client);
      setState({
        isConnected: true,
        isReady: true,
        address,
        chainId,
        isProcessingPayment: false,
        lastPayment: null,
        error: null,
      });

      return true;
    } catch (error) {
      setState((s) => ({
        ...s,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
      return false;
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setWalletClient(null);
    setState({
      isConnected: false,
      isReady: false,
      address: null,
      chainId: null,
      isProcessingPayment: false,
      lastPayment: null,
      error: null,
    });
  }, []);

  /**
   * Switch to a supported chain
   */
  const switchChain = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      setState((s) => ({ ...s, chainId: targetChainId }));
      return true;
    } catch (error) {
      // Chain not added, try to add it
      const chain = Object.values(supportedChains).find((c) => c.id === targetChainId);
      if (chain) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: [chain.rpcUrls.default.http[0]],
                blockExplorerUrls: [chain.blockExplorers?.default.url],
              },
            ],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, []);

  /**
   * Premium fetch with payment handling
   */
  const premiumFetch = useMemo(() => {
    if (!walletClient || !state.address) {
      // Return a fetch that prompts connection
      return async <T = unknown>(url: string, options?: PremiumFetchOptions): Promise<T> => {
        const connected = await connect();
        if (!connected) {
          throw new Error('Wallet connection required for premium features');
        }
        // After connection, retry will be handled by caller
        throw new Error('Please retry after wallet connection');
      };
    }

    return createPremiumFetch(walletClient, state.address);
  }, [walletClient, state.address, connect]);

  /**
   * Check if user has a valid access pass
   */
  const checkAccessPass = useCallback(async (): Promise<{
    hasPass: boolean;
    expiresAt?: Date;
    type?: 'hour' | 'day';
  }> => {
    // This would check localStorage or a server endpoint
    const stored = localStorage.getItem('x402_access_pass');
    if (!stored) return { hasPass: false };

    try {
      const pass = JSON.parse(stored);
      const expiresAt = new Date(pass.expiresAt);
      if (expiresAt > new Date()) {
        return { hasPass: true, expiresAt, type: pass.type };
      }
    } catch {
      // Invalid stored data
    }

    localStorage.removeItem('x402_access_pass');
    return { hasPass: false };
  }, []);

  /**
   * Store an access pass after purchase
   */
  const storeAccessPass = useCallback((type: 'hour' | 'day', token: string) => {
    const duration = type === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + duration);

    localStorage.setItem(
      'x402_access_pass',
      JSON.stringify({ type, token, expiresAt: expiresAt.toISOString() })
    );
  }, []);

  return {
    // State
    ...state,

    // Wallet actions
    connect,
    disconnect,
    switchChain,

    // Fetch
    premiumFetch,

    // Access passes
    checkAccessPass,
    storeAccessPass,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format price for display
 * Converts atomic USDC amount to human-readable format
 */
export function formatUsdcAmount(atomicAmount: string | number): string {
  const amount = typeof atomicAmount === 'string' ? parseInt(atomicAmount) : atomicAmount;
  const usdAmount = amount / 1_000_000; // USDC has 6 decimals
  return `$${usdAmount.toFixed(usdAmount < 0.01 ? 4 : 2)}`;
}

/**
 * Parse dollar amount to atomic USDC
 */
export function parseUsdcAmount(dollarAmount: string): bigint {
  const cleaned = dollarAmount.replace('$', '').trim();
  const amount = parseFloat(cleaned);
  return BigInt(Math.round(amount * 1_000_000));
}

/**
 * Check if the current network is supported
 */
export function isSupportedNetwork(chainId: number): boolean {
  return Object.keys(supportedChains).some(
    (network) => parseInt(network.split(':')[1]) === chainId
  );
}

/**
 * Get network identifier from chain ID
 */
export function getNetworkFromChainId(chainId: number): string {
  return `eip155:${chainId}`;
}

// ============================================================================
// Window Type Extensions
// ============================================================================

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
    };
  }
}
