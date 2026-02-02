'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Zap, Crown, Shield, Loader2, Wallet, ExternalLink } from 'lucide-react';
import { PaymentProvider, usePayment } from '@/components/x402/PaymentProvider';

interface KeyInfo {
  id: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimit: number;
  usageToday: number;
  expiresAt?: string;
}

interface UpgradeOption {
  type: string;
  name: string;
  price: string;
  tier: string;
  duration: string;
  features: string[];
  requestsPerDay: number;
}

interface PaymentRequirement {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: { description?: string };
}

const tierIcons = {
  free: Shield,
  pro: Zap,
  enterprise: Crown,
};

const tierColors = {
  free: 'text-neutral-500',
  pro: 'text-blue-500',
  enterprise: 'text-purple-500',
};

function UpgradeContent() {
  const {
    wallet,
    isConnecting,
    connect,
    disconnect,
    switchChain,
    isTestnet,
    error: walletError,
  } = usePayment();

  const [apiKey, setApiKey] = useState('');
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [upgrades, setUpgrades] = useState<UpgradeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentRequirement | null>(null);

  // Load key info when API key is provided
  const loadKeyInfo = async () => {
    if (!apiKey || !apiKey.startsWith('cda_')) {
      setError('Please enter a valid API key (starts with cda_)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/upgrade', {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const data = await response.json();

      if (data.currentKey) {
        setKeyInfo(data.currentKey);
        setUpgrades(data.upgrades || []);
      } else {
        setError('API key not found or invalid');
      }
    } catch {
      setError('Failed to load key information');
    } finally {
      setLoading(false);
    }
  };

  // Handle upgrade with x402 payment
  const handleUpgrade = async (upgradeType: string) => {
    if (!apiKey) {
      setError('API key required');
      return;
    }

    // Check wallet connection
    if (!wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!wallet.isCorrectChain) {
      setError('Please switch to the correct network (Base)');
      return;
    }

    setUpgrading(true);
    setError(null);
    setSuccess(null);
    setPaymentDetails(null);

    try {
      // First, get payment requirements by making request without payment
      const requirementResponse = await fetch('/api/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ upgradeType }),
      });

      if (requirementResponse.status === 402) {
        // Need to initiate x402 payment
        const paymentRequired = await requirementResponse.json();
        const requirement = paymentRequired.accepts?.[0] as PaymentRequirement;

        if (!requirement) {
          setError('Invalid payment requirements received');
          setUpgrading(false);
          return;
        }

        setPaymentDetails(requirement);

        // Use ethereum provider to send payment
        if (typeof window !== 'undefined' && window.ethereum && wallet.address) {
          try {
            // ERC-20 transfer function signature: transfer(address,uint256)
            const transferFunctionSig = '0xa9059cbb';
            const toAddressPadded = requirement.payTo.slice(2).padStart(64, '0');
            const amountPadded = BigInt(requirement.amount).toString(16).padStart(64, '0');
            const data = transferFunctionSig + toAddressPadded + amountPadded;

            // Send the transaction
            const txHash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [
                {
                  from: wallet.address,
                  to: requirement.asset, // USDC contract address
                  data: data,
                  value: '0x0', // No ETH value for ERC-20 transfer
                },
              ],
            });

            // Create payment proof header
            const paymentProof = {
              scheme: requirement.scheme,
              network: requirement.network,
              txHash: txHash,
              accepted: {
                scheme: requirement.scheme,
                network: requirement.network,
              },
            };

            const paymentHeader = Buffer.from(JSON.stringify(paymentProof)).toString('base64');

            // Retry with payment proof
            const upgradeResponse = await fetch('/api/upgrade', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
                'X-Payment': paymentHeader,
              },
              body: JSON.stringify({ upgradeType }),
            });

            const result = await upgradeResponse.json();

            if (upgradeResponse.ok) {
              setSuccess(
                `Successfully upgraded to ${result.key.tier}! Expires: ${new Date(result.subscription.expiresAt).toLocaleDateString()}`
              );
              setKeyInfo(result.key);
              setPaymentDetails(null);
            } else {
              setError(result.error || 'Upgrade failed after payment');
            }
          } catch (payError) {
            console.error('Payment error:', payError);
            if ((payError as { code?: number }).code === 4001) {
              setError('Transaction was rejected');
            } else {
              setError('Payment failed. Please try again.');
            }
          }
        } else {
          setError('No wallet detected. Please install MetaMask or another Web3 wallet.');
        }
      } else {
        const result = await requirementResponse.json();
        if (requirementResponse.ok) {
          setSuccess(`Successfully upgraded to ${result.key.tier}!`);
          setKeyInfo(result.key);
        } else {
          setError(result.error || 'Upgrade failed');
        }
      }
    } catch {
      setError('Failed to process upgrade');
    } finally {
      setUpgrading(false);
    }
  };

  // Calculate usage percentage
  const usagePercentage = keyInfo
    ? Math.min((keyInfo.usageToday / keyInfo.rateLimit) * 100, 100)
    : 0;

  // Check if subscription is expiring soon
  const isExpiringSoon = keyInfo?.expiresAt
    ? new Date(keyInfo.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const TierIcon = keyInfo ? tierIcons[keyInfo.tier] : Shield;

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-white">Upgrade Your Plan</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Upgrade to Pro for more requests and premium features
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="border-2 border-neutral-200 dark:border-neutral-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Wallet Connection
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {wallet.connected
                    ? `Connected: ${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}`
                    : 'Connect your wallet to pay with USDC'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {wallet.connected && !wallet.isCorrectChain && (
                <button
                  onClick={switchChain}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400"
                >
                  Switch to Base
                </button>
              )}
              {wallet.connected ? (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 border-2 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Connect Wallet
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {wallet.connected && wallet.isCorrectChain && wallet.usdcBalance && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                USDC Balance:{' '}
                <span className="text-black dark:text-white font-mono">{wallet.usdcBalance}</span>
              </p>
            </div>
          )}
          {walletError && <p className="mt-2 text-sm text-red-500">{walletError}</p>}
          {isTestnet && (
            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Testnet mode - using Base Sepolia
            </p>
          )}
        </div>

        {/* API Key Input */}
        <div className="border-2 border-neutral-200 dark:border-neutral-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
            Enter Your API Key
          </h2>
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="cda_free_..."
              className="flex-1 min-w-[200px] px-4 py-2 border-2 border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:border-black dark:focus:border-white outline-none font-mono"
            />
            <button
              onClick={loadKeyInfo}
              disabled={loading}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Loading...' : 'Load Key'}
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Payment Details (when awaiting payment) */}
        {paymentDetails && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Payment Required
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1 font-mono">
              <p>Amount: ${(parseInt(paymentDetails.amount) / 1_000_000).toFixed(2)} USDC</p>
              <p>Network: Base {isTestnet ? 'Sepolia (Testnet)' : 'Mainnet'}</p>
              <p>
                To: {paymentDetails.payTo.slice(0, 10)}...{paymentDetails.payTo.slice(-8)}
              </p>
            </div>
          </div>
        )}

        {/* Current Tier Info */}
        {keyInfo && (
          <div className="border-2 border-neutral-200 dark:border-neutral-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 ${tierColors[keyInfo.tier]}`}
                >
                  <TierIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Current Plan: {keyInfo.tier.charAt(0).toUpperCase() + keyInfo.tier.slice(1)}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Key ID: {keyInfo.id}
                  </p>
                </div>
              </div>
              {keyInfo.expiresAt && (
                <div
                  className={`text-sm ${isExpiringSoon ? 'text-red-500' : 'text-neutral-600 dark:text-neutral-400'}`}
                >
                  {isExpiringSoon ? '⚠️ ' : ''}
                  Expires: {new Date(keyInfo.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Usage Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">Today&apos;s Usage</span>
                <span className="text-black dark:text-white">
                  {keyInfo.usageToday.toLocaleString()} /{' '}
                  {keyInfo.rateLimit === -1 ? 'Unlimited' : keyInfo.rateLimit.toLocaleString()}{' '}
                  requests
                </span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usagePercentage > 80
                      ? 'bg-red-500'
                      : usagePercentage > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${keyInfo.rateLimit === -1 ? 10 : usagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Options */}
        {keyInfo && keyInfo.tier !== 'enterprise' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-black dark:text-white">
              {keyInfo.tier === 'pro' ? 'Renew or Extend' : 'Upgrade Options'}
            </h2>

            {upgrades.map((upgrade) => (
              <div
                key={upgrade.type}
                className="border-2 border-black dark:border-white rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      {upgrade.name}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                      {upgrade.duration} • {upgrade.requestsPerDay.toLocaleString()} requests/day
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-black dark:text-white">
                      {upgrade.price}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      one-time payment
                    </div>
                  </div>
                </div>

                <ul className="grid grid-cols-2 gap-2 mb-6">
                  {upgrade.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-neutral-700 dark:text-neutral-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(upgrade.type)}
                  disabled={upgrading || !wallet.connected || !wallet.isCorrectChain}
                  className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : !wallet.connected ? (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet to Pay
                    </>
                  ) : !wallet.isCorrectChain ? (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Switch to Base Network
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Pay {upgrade.price} USDC
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-neutral-500 mt-3">
                  Powered by x402 protocol • Pay with USDC on Base
                </p>
              </div>
            ))}

            {/* Enterprise CTA */}
            <div className="border-2 border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-6 h-6 text-purple-500" />
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Need Enterprise?
                </h3>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                For unlimited requests, custom endpoints, and dedicated support, contact our sales
                team.
              </p>
              <a
                href="mailto:enterprise@freecryptonews.org"
                className="inline-block px-6 py-2 border-2 border-black dark:border-white text-black dark:text-white rounded-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                Contact Sales
              </a>
            </div>
          </div>
        )}

        {/* Enterprise Message */}
        {keyInfo?.tier === 'enterprise' && (
          <div className="border-2 border-purple-500 rounded-lg p-6 text-center">
            <Crown className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">
              You&apos;re on Enterprise
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              You have unlimited access to all API endpoints. Contact your account manager for any
              changes.
            </p>
          </div>
        )}

        {/* x402 Info */}
        <div className="mt-12 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">About x402 Payments</h3>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>• Payments are processed using USDC on Base network</li>
            <li>• Connect any Web3 wallet (MetaMask, Coinbase Wallet, etc.)</li>
            <li>• Instant activation upon payment confirmation</li>
            <li>• Subscriptions do not auto-renew - you control when to pay</li>
            <li>
              •{' '}
              {isTestnet
                ? 'Currently in testnet mode - use Base Sepolia test USDC'
                : 'Payments are on Base mainnet'}
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function UpgradePage() {
  const isTestnet = process.env.NODE_ENV !== 'production';

  return (
    <PaymentProvider testnet={isTestnet}>
      <UpgradeContent />
    </PaymentProvider>
  );
}
