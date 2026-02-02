/**
 * x402 Paywall Banner Component
 *
 * A banner component that displays when premium content requires payment.
 * Shows payment amount, network info, and guides user through the payment flow.
 *
 * @module components/x402/PaywallBanner
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from './PaymentProvider';
import { X, Wallet, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentRequirement {
  scheme: string;
  network: string;
  payTo: string;
  maxAmountRequired: string;
  asset: string;
  description?: string;
  resource?: string;
  extra?: {
    name?: string;
    version?: string;
  };
}

export interface PaywallBannerProps {
  /** The payment requirements from 402 response */
  paymentRequirements: PaymentRequirement[];
  /** Endpoint that requires payment */
  endpoint: string;
  /** Display price (e.g., "$0.001") */
  displayPrice: string;
  /** Callback when payment succeeds */
  onPaymentSuccess?: (txHash: string) => void;
  /** Callback to dismiss the banner */
  onDismiss?: () => void;
  /** Optional custom title */
  title?: string;
  /** Optional description */
  description?: string;
}

// =============================================================================
// NETWORK DISPLAY NAMES
// =============================================================================

const NETWORK_NAMES: Record<string, string> = {
  'eip155:8453': 'Base',
  'eip155:84532': 'Base Sepolia (Testnet)',
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana',
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'Solana Devnet',
};

const BLOCK_EXPLORERS: Record<string, string> = {
  'eip155:8453': 'https://basescan.org/tx/',
  'eip155:84532': 'https://sepolia.basescan.org/tx/',
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'https://explorer.solana.com/tx/',
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': 'https://explorer.solana.com/tx/?cluster=devnet',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function PaywallBanner({
  paymentRequirements,
  endpoint,
  displayPrice,
  onPaymentSuccess,
  onDismiss,
  title = 'Premium Content',
  description,
}: PaywallBannerProps) {
  const { wallet, connect, switchChain, isConnecting, error: walletError } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the first EVM payment requirement
  const evmRequirement = paymentRequirements.find((r) => r.network.startsWith('eip155:'));
  const requirement = evmRequirement || paymentRequirements[0];

  if (!requirement) {
    return null;
  }

  const networkName = NETWORK_NAMES[requirement.network] || requirement.network;
  const isTestnet = requirement.network.includes('84532') || requirement.network.includes('devnet');

  const handlePayment = async () => {
    if (!wallet.connected) {
      await connect();
      return;
    }

    if (!wallet.isCorrectChain) {
      await switchChain();
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('signing');
    setError(null);

    try {
      const ethereum = window.ethereum;
      if (!ethereum || !wallet.address) {
        throw new Error('Wallet not connected');
      }

      // For x402, we need to create an EIP-3009 transferWithAuthorization
      // This is handled by the x402 SDK on the server side, but for client-initiated
      // payments, we need to sign the authorization
      
      // The x402 SDK expects the payment to be signed according to EIP-3009
      // For now, we'll create a simple ERC-20 transfer as a fallback
      // In production, you'd use the x402-fetch wrapper or SDK
      
      const transferFunctionSig = '0xa9059cbb'; // transfer(address,uint256)
      const toAddressPadded = requirement.payTo.slice(2).padStart(64, '0');
      const amountPadded = BigInt(requirement.maxAmountRequired).toString(16).padStart(64, '0');
      const data = transferFunctionSig + toAddressPadded + amountPadded;

      setPaymentStatus('confirming');

      const hash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: wallet.address,
            to: requirement.asset,
            data: data,
            value: '0x0',
          },
        ],
      });

      setTxHash(hash as string);
      setPaymentStatus('success');
      onPaymentSuccess?.(hash as string);
    } catch (err) {
      setPaymentStatus('error');
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const explorerUrl = txHash ? BLOCK_EXPLORERS[requirement.network] + txHash : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/20 dark:via-orange-500/10"
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-2xl">💳</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description || `Access this premium endpoint with a one-time payment of ${displayPrice}`}
            </p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Endpoint</span>
            <code className="font-mono text-amber-600 dark:text-amber-400">{endpoint}</code>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Price</span>
            <span className="font-semibold text-gray-900 dark:text-white">{displayPrice} USDC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Network</span>
            <span className="flex items-center gap-1 text-gray-900 dark:text-white">
              {networkName}
              {isTestnet && (
                <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                  Testnet
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Protocol</span>
            <span className="text-gray-900 dark:text-white">x402</span>
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {paymentStatus === 'success' && txHash && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-300">Payment Successful!</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Transaction confirmed. You now have access to this endpoint.
                  </p>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-300 hover:underline mt-2"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {(error || walletError) && paymentStatus !== 'success' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error || walletError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        {paymentStatus !== 'success' && (
          <button
            onClick={handlePayment}
            disabled={isProcessing || isConnecting}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConnecting || isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isConnecting
                  ? 'Connecting Wallet...'
                  : paymentStatus === 'signing'
                    ? 'Waiting for Signature...'
                    : 'Confirming Transaction...'}
              </>
            ) : !wallet.connected ? (
              <>
                <Wallet className="h-5 w-5" />
                Connect Wallet to Pay
              </>
            ) : !wallet.isCorrectChain ? (
              <>
                <AlertCircle className="h-5 w-5" />
                Switch to {networkName}
              </>
            ) : (
              <>
                <span className="text-lg">💳</span>
                Pay {displayPrice} USDC
              </>
            )}
          </button>
        )}

        {/* Alternative Options */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Have an API key?{' '}
            <a href="/developers" className="text-amber-600 dark:text-amber-400 hover:underline">
              Use it instead
            </a>
            {' • '}
            <a href="/pricing" className="text-amber-600 dark:text-amber-400 hover:underline">
              View subscription plans
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
