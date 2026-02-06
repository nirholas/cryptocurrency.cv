'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from './x402/PaymentProvider';

interface X402PaymentButtonProps {
  endpoint: string;
  price: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

interface PaymentDetails {
  payTo: string;
  price: string;
  network: string;
  accepts: string;
  resource: string;
  /** Maximum amount in minor units (e.g., 6 decimals for USDC) */
  maxAmountRequired?: string;
  /** Deadline for payment validity */
  validUntil?: string;
}

/**
 * x402 Payment Button Component
 * 
 * Enables pay-per-request functionality using the x402 protocol.
 * When clicked, it initiates a payment flow and returns the API response.
 * 
 * @example
 * ```tsx
 * <X402PaymentButton
 *   endpoint="/api/v1/coins"
 *   price="$0.001"
 *   onSuccess={(data) => console.log(data)}
 * >
 *   Get Market Data
 * </X402PaymentButton>
 * ```
 */
export default function X402PaymentButton({
  endpoint,
  price,
  onSuccess,
  onError,
  children,
  className = '',
  variant = 'primary',
  size = 'md',
}: X402PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [showModal, setShowModal] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleClick = useCallback(async () => {
    setLoading(true);

    try {
      // First, make a request to get payment details (will return 402)
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status === 402) {
        // Parse payment details from 402 response
        const details = await response.json();
        setPaymentDetails({
          payTo: details.payTo || details.paymentAddress,
          price: details.price || price,
          network: details.network || 'eip155:8453',
          accepts: details.accepts || 'x402',
          resource: endpoint,
        });
        setShowModal(true);
      } else if (response.ok) {
        // Already authorized (maybe has API key)
        const data = await response.json();
        onSuccess?.(data);
      } else {
        throw new Error(`Request failed: ${response.status}`);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setLoading(false);
    }
  }, [endpoint, price, baseUrl, onSuccess, onError]);

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-white hover:bg-gray-100 text-black',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white',
    outline: 'border-2 border-gray-300 text-gray-300 hover:bg-white hover:text-black',
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <span className="text-lg">💳</span>
            {children || `Pay ${price}`}
          </>
        )}
      </button>

      {/* Payment Modal */}
      {showModal && paymentDetails && (
        <X402PaymentModal
          details={paymentDetails}
          onClose={() => setShowModal(false)}
          onPaymentComplete={async (signature) => {
            setLoading(true);
            try {
              // Make the actual request with payment signature
              const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                  Accept: 'application/json',
                  'X-PAYMENT': signature,
                },
              });

              if (response.ok) {
                const data = await response.json();
                onSuccess?.(data);
                setShowModal(false);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (error) {
              onError?.(error instanceof Error ? error : new Error('Payment failed'));
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </>
  );
}

interface X402PaymentModalProps {
  details: PaymentDetails;
  onClose: () => void;
  onPaymentComplete: (signature: string, txHash?: string) => void;
}

function X402PaymentModal({ details, onClose, onPaymentComplete }: X402PaymentModalProps) {
  const [step, setStep] = useState<'details' | 'connect' | 'sign' | 'processing' | 'complete'>('details');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Use the PaymentProvider for wallet interactions
  const { wallet, connect, executePayment } = usePayment();
  const isConnected = wallet.connected;
  const address = wallet.address;

  const networkNames: Record<string, string> = {
    'eip155:8453': 'Base Mainnet',
    'eip155:84532': 'Base Sepolia',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana Mainnet',
  };
  
  const blockExplorers: Record<string, string> = {
    'eip155:8453': 'https://basescan.org/tx/',
    'eip155:84532': 'https://sepolia.basescan.org/tx/',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'https://explorer.solana.com/tx/',
  };

  const handleConnectWallet = async () => {
    setError(null);
    try {
      await connect();
      if (isConnected) {
        setStep('sign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }
  };

  const handleSign = async () => {
    setError(null);
    setStep('processing');
    
    try {
      // Parse amount in proper format for x402 payment
      const priceNum = parseFloat(details.price.replace(/[^0-9.]/g, ''));
      const amountInMinorUnits = Math.round(priceNum * 1_000_000).toString(); // USDC has 6 decimals
      
      // Execute actual ERC-20 transfer using PaymentProvider
      // This should use EIP-3009 transferWithAuthorization in production
      const result = await executePayment({
        to: details.payTo,
        amount: amountInMinorUnits,
        network: details.network,
      });
      
      if (result.success && result.txHash) {
        setTxHash(result.txHash);
        setStep('complete');
        
        // Create x402 payment header with transaction proof
        const x402Payment = `x402:${result.txHash}:${Date.now()}`;
        
        setTimeout(() => {
          onPaymentComplete(x402Payment, result.txHash);
        }, 1500);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('sign');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              x402 Payment
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Resource</span>
                  <code className="text-sm font-mono text-amber-500">{details.resource}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{details.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Network</span>
                  <span className="text-gray-900 dark:text-white">
                    {networkNames[details.network] || details.network}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Token</span>
                  <span className="text-gray-900 dark:text-white">USDC</span>
                </div>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Pay with cryptocurrency to access this premium endpoint
              </div>

              <button
                onClick={() => setStep('connect')}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-xl transition-all"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'connect' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🔗</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connect your wallet to sign the payment
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🦊</span>
                    <span className="font-medium text-gray-900 dark:text-white">MetaMask</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={handleConnectWallet}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💼</span>
                    <span className="font-medium text-gray-900 dark:text-white">Coinbase Wallet</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={handleConnectWallet}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌈</span>
                    <span className="font-medium text-gray-900 dark:text-white">Rainbow</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setStep('details')}
                className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                ← Back
              </button>
            </div>
          )}

          {step === 'sign' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4">✍️</div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sign Payment
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sign the transaction in your wallet to complete the payment
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Payment Details</span>
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  You are about to pay <strong>{details.price}</strong> USDC for access to{' '}
                  <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">{details.resource}</code>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSign}
                className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-xl transition-all"
              >
                Sign & Pay
              </button>

              <button
                onClick={() => setStep('connect')}
                className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                ← Back
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <svg className="animate-spin h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Processing Payment...
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please confirm the transaction in your wallet
                </p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">✅</div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Complete!
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {txHash ? 'Transaction confirmed. Fetching your data...' : 'Fetching your data...'}
                </p>
              </div>
              {txHash && blockExplorers[details.network] && (
                <a
                  href={`${blockExplorers[details.network]}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm"
                >
                  View on Block Explorer
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Powered by</span>
            <a
              href="https://x402.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-500 hover:text-blue-400"
            >
              x402 Protocol
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Hook to check x402 payment status
 */
export function useX402Payment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    endpoint: string;
    price: string;
    timestamp: Date;
  } | null>(null);

  const makePayment = useCallback(async (endpoint: string) => {
    setIsProcessing(true);
    // Payment logic here
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    lastPayment,
    makePayment,
  };
}
