/**
 * x402 Payment Success Toast
 *
 * A toast notification component that displays after successful payment.
 * Shows transaction hash with link to block explorer.
 *
 * @module components/x402/PaymentSuccessToast
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ExternalLink, X, Copy, Check } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentSuccessToastProps {
  /** Transaction hash */
  txHash: string;
  /** Network ID (CAIP-2 format) */
  network: string;
  /** Amount paid (display format) */
  amount: string;
  /** Auto-dismiss after ms (0 = no auto-dismiss) */
  autoDismissMs?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BLOCK_EXPLORERS: Record<string, { name: string; url: string }> = {
  'eip155:8453': { name: 'Basescan', url: 'https://basescan.org/tx/' },
  'eip155:84532': { name: 'Basescan', url: 'https://sepolia.basescan.org/tx/' },
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': { name: 'Solana Explorer', url: 'https://explorer.solana.com/tx/' },
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': { name: 'Solana Explorer', url: 'https://explorer.solana.com/tx/?cluster=devnet' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function PaymentSuccessToast({
  txHash,
  network,
  amount,
  autoDismissMs = 10000,
  onDismiss,
}: PaymentSuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const explorer = BLOCK_EXPLORERS[network] || { name: 'Explorer', url: '' };
  const explorerUrl = explorer.url + txHash;
  const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-6)}`;

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="fixed bottom-4 right-4 z-50 max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-green-200 dark:border-green-800 overflow-hidden">
            {/* Success header */}
            <div className="bg-green-500 px-4 py-3 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-white" />
              <div className="flex-1">
                <h4 className="text-white font-semibold">Payment Successful!</h4>
                <p className="text-green-100 text-sm">{amount} USDC paid via x402</p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Transaction details */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Transaction</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {shortHash}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy transaction hash"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {explorer.url && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  View on {explorer.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Progress bar for auto-dismiss */}
            {autoDismissMs > 0 && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
                className="h-1 bg-green-500"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// HOOK FOR MANAGING TOASTS
// =============================================================================

interface ToastState {
  id: string;
  txHash: string;
  network: string;
  amount: string;
}

export function usePaymentToasts() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showSuccess = (txHash: string, network: string, amount: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, txHash, network, amount }]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ bottom: `${1 + index * 8}rem` }}
          className="fixed right-4 z-50"
        >
          <PaymentSuccessToast
            txHash={toast.txHash}
            network={toast.network}
            amount={toast.amount}
            onDismiss={() => dismiss(toast.id)}
          />
        </div>
      ))}
    </>
  );

  return { showSuccess, ToastContainer };
}
