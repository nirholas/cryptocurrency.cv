/**
 * x402 Payment Provider
 *
 * React context provider for x402 payment functionality.
 * Wraps the application to provide wallet connection and payment capabilities.
 *
 * @module components/x402/PaymentProvider
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { Address } from 'viem';

// =============================================================================
// TYPES
// =============================================================================

interface WalletState {
  connected: boolean;
  address: Address | null;
  chainId: number | null;
  isCorrectChain: boolean;
  balance: string | null;
  usdcBalance: string | null;
}

interface PaymentRecord {
  id: string;
  route: string;
  amount: string;
  currency: string;
  txHash: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

interface AccessPass {
  route: string;
  expiresAt: number;
  paymentId: string;
}

interface PaymentContextValue {
  // Wallet state
  wallet: WalletState;
  isConnecting: boolean;
  error: string | null;

  // Wallet actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;

  // Payment state
  payments: PaymentRecord[];
  accessPasses: AccessPass[];
  isPremium: boolean;

  // Payment actions
  checkAccess: (route: string) => boolean;
  getAccessExpiry: (route: string) => number | null;

  // Config
  targetChainId: number;
  isTestnet: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_MAINNET_ID = 8453;
const BASE_SEPOLIA_ID = 84532;

const USDC_ADDRESSES: Record<number, Address> = {
  [BASE_MAINNET_ID]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [BASE_SEPOLIA_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

const CHAIN_PARAMS: Record<number, { chainName: string; rpcUrl: string; blockExplorer: string }> = {
  [BASE_MAINNET_ID]: {
    chainName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
  },
  [BASE_SEPOLIA_ID]: {
    chainName: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
  },
};

const STORAGE_KEY = 'x402_payment_state';

// =============================================================================
// CONTEXT
// =============================================================================

const PaymentContext = createContext<PaymentContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface PaymentProviderProps {
  children: ReactNode;
  testnet?: boolean;
}

export function PaymentProvider({ children, testnet = true }: PaymentProviderProps) {
  const targetChainId = testnet ? BASE_SEPOLIA_ID : BASE_MAINNET_ID;

  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    isCorrectChain: false,
    balance: null,
    usdcBalance: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [accessPasses, setAccessPasses] = useState<AccessPass[]>([]);

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.accessPasses) {
          // Filter out expired passes
          const now = Date.now();
          const valid = parsed.accessPasses.filter((pass: AccessPass) => pass.expiresAt > now);
          setAccessPasses(valid);
        }
      }
    } catch (e) {
      console.error('Failed to load payment state:', e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ payments, accessPasses }));
    } catch (e) {
      console.error('Failed to save payment state:', e);
    }
  }, [payments, accessPasses]);

  // Check if already connected on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const checkConnection = async () => {
      const ethereum = window.ethereum;
      if (!ethereum) return;
      try {
        const accounts = (await ethereum.request({
          method: 'eth_accounts',
        })) as string[];

        if (accounts.length > 0) {
          const chainId = (await ethereum.request({
            method: 'eth_chainId',
          })) as string;

          const chainIdNum = parseInt(chainId, 16);

          setWallet({
            connected: true,
            address: accounts[0] as Address,
            chainId: chainIdNum,
            isCorrectChain: chainIdNum === targetChainId,
            balance: null,
            usdcBalance: null,
          });

          // Fetch balances
          await updateBalances(accounts[0] as Address, chainIdNum);
        }
      } catch (e) {
        console.error('Failed to check wallet connection:', e);
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setWallet({
          connected: false,
          address: null,
          chainId: null,
          isCorrectChain: false,
          balance: null,
          usdcBalance: null,
        });
      } else {
        setWallet((prev) => ({
          ...prev,
          connected: true,
          address: accounts[0] as Address,
        }));
      }
    };

    // Listen for chain changes
    const handleChainChanged = (...args: unknown[]) => {
      const chainId = args[0] as string;
      const chainIdNum = parseInt(chainId, 16);
      setWallet((prev) => ({
        ...prev,
        chainId: chainIdNum,
        isCorrectChain: chainIdNum === targetChainId,
      }));
    };

    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [targetChainId]);

  // Update ETH and USDC balances
  const updateBalances = async (address: Address, chainId: number) => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    try {
      // Get ETH balance
      const balance = (await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;

      const ethBalance = (parseInt(balance, 16) / 1e18).toFixed(4);

      // Get USDC balance (ERC-20)
      const usdcAddress = USDC_ADDRESSES[chainId];
      let usdcBalance = '0';

      if (usdcAddress) {
        const balanceOfData = `0x70a08231000000000000000000000000${address.slice(2)}`;
        const usdcResult = (await ethereum.request({
          method: 'eth_call',
          params: [{ to: usdcAddress, data: balanceOfData }, 'latest'],
        })) as string;

        const usdcRaw = BigInt(usdcResult);
        usdcBalance = (Number(usdcRaw) / 1e6).toFixed(2);
      }

      setWallet((prev) => ({
        ...prev,
        balance: ethBalance,
        usdcBalance,
      }));
    } catch (e) {
      console.error('Failed to fetch balances:', e);
    }
  };

  // Connect wallet
  const connect = useCallback(async () => {
    const ethereum = window.ethereum;
    if (typeof window === 'undefined' || !ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask or Coinbase Wallet.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      const chainId = (await ethereum.request({
        method: 'eth_chainId',
      })) as string;

      const chainIdNum = parseInt(chainId, 16);

      setWallet({
        connected: true,
        address: accounts[0] as Address,
        chainId: chainIdNum,
        isCorrectChain: chainIdNum === targetChainId,
        balance: null,
        usdcBalance: null,
      });

      await updateBalances(accounts[0] as Address, chainIdNum);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [targetChainId]);

  // Disconnect wallet (clear local state)
  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      address: null,
      chainId: null,
      isCorrectChain: false,
      balance: null,
      usdcBalance: null,
    });
  }, []);

  // Switch to correct chain
  const switchChain = useCallback(async () => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    const hexChainId = `0x${targetChainId.toString(16)}`;
    const params = CHAIN_PARAMS[targetChainId];

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (e) {
      const err = e as { code: number };
      // Chain not added, try to add it
      if (err.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: params.chainName,
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [params.rpcUrl],
              blockExplorerUrls: [params.blockExplorer],
            },
          ],
        });
      } else {
        throw e;
      }
    }
  }, [targetChainId]);

  // Check if user has access to a route
  const checkAccess = useCallback(
    (route: string): boolean => {
      const now = Date.now();
      return accessPasses.some((pass) => pass.route === route && pass.expiresAt > now);
    },
    [accessPasses]
  );

  // Get access expiry for a route
  const getAccessExpiry = useCallback(
    (route: string): number | null => {
      const now = Date.now();
      const pass = accessPasses.find((p) => p.route === route && p.expiresAt > now);
      return pass?.expiresAt || null;
    },
    [accessPasses]
  );

  // Check if user has any active premium access
  const isPremium = accessPasses.some((pass) => pass.expiresAt > Date.now());

  const value: PaymentContextValue = {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
    payments,
    accessPasses,
    isPremium,
    checkAccess,
    getAccessExpiry,
    targetChainId,
    isTestnet: testnet,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}

// =============================================================================
// TYPE AUGMENTATION FOR WINDOW.ETHEREUM
// =============================================================================

// Types are declared in @/lib/x402-client.ts
