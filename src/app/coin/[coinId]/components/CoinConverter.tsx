/**
 * CoinConverter Component - Two-way coin <-> USD converter
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CoinConverterProps {
  coinId: string;
  symbol: string;
  name: string;
  price: number;
  image?: string;
}

const quickAmounts = [1, 10, 100, 1000];

export default function CoinConverter({
  coinId,
  symbol,
  name,
  price,
  image,
}: CoinConverterProps) {
  const [coinAmount, setCoinAmount] = useState<string>('1');
  const [usdAmount, setUsdAmount] = useState<string>((price).toFixed(2));
  const [lastChanged, setLastChanged] = useState<'coin' | 'usd'>('coin');
  const [copied, setCopied] = useState<'coin' | 'usd' | null>(null);

  const symbolUpper = symbol.toUpperCase();

  // Update USD when coin amount changes
  useEffect(() => {
    if (lastChanged === 'coin') {
      const amount = parseFloat(coinAmount) || 0;
      const usd = amount * price;
      setUsdAmount(formatUsdValue(usd));
    }
  }, [coinAmount, price, lastChanged]);

  // Update coin when USD amount changes
  useEffect(() => {
    if (lastChanged === 'usd') {
      const amount = parseFloat(usdAmount.replace(/,/g, '')) || 0;
      const coins = price > 0 ? amount / price : 0;
      setCoinAmount(formatCoinValue(coins));
    }
  }, [usdAmount, price, lastChanged]);

  const handleCoinChange = useCallback((value: string) => {
    // Allow only numbers and decimal
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimals
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned;
    
    setCoinAmount(formatted);
    setLastChanged('coin');
  }, []);

  const handleUsdChange = useCallback((value: string) => {
    // Allow only numbers, decimal, and commas
    const cleaned = value.replace(/[^0-9.,]/g, '');
    setUsdAmount(cleaned);
    setLastChanged('usd');
  }, []);

  const handleQuickAmount = useCallback((amount: number) => {
    setCoinAmount(amount.toString());
    setLastChanged('coin');
  }, []);

  const handleSwap = useCallback(() => {
    const currentCoin = parseFloat(coinAmount) || 0;
    const currentUsd = parseFloat(usdAmount.replace(/,/g, '')) || 0;
    
    setCoinAmount(formatCoinValue(currentUsd / price));
    setUsdAmount(formatUsdValue(currentCoin));
    setLastChanged('coin');
  }, [coinAmount, usdAmount, price]);

  const handleCopy = useCallback(async (type: 'coin' | 'usd') => {
    const value = type === 'coin' ? coinAmount : usdAmount;
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, [coinAmount, usdAmount]);

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {symbolUpper} Converter
      </h3>

      <div className="space-y-4">
        {/* Coin Input */}
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1.5">
            {name} ({symbolUpper})
          </label>
          <div className="flex items-center bg-gray-900 rounded-xl border border-gray-700 focus-within:border-amber-500/50 transition-colors">
            {image && (
              <div className="pl-3">
                <img src={image} alt={name} className="w-6 h-6 rounded-full" />
              </div>
            )}
            <input
              type="text"
              value={coinAmount}
              onChange={(e) => handleCoinChange(e.target.value)}
              className="flex-1 bg-transparent px-3 py-3 text-white text-lg font-medium focus:outline-none"
              placeholder="0"
            />
            <div className="flex items-center gap-1 pr-3">
              <span className="text-gray-400 font-medium">{symbolUpper}</span>
              <button
                onClick={() => handleCopy('coin')}
                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                title="Copy"
              >
                {copied === 'coin' ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <motion.button
            onClick={handleSwap}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </motion.button>
        </div>

        {/* USD Input */}
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1.5">
            US Dollar (USD)
          </label>
          <div className="flex items-center bg-gray-900 rounded-xl border border-gray-700 focus-within:border-amber-500/50 transition-colors">
            <div className="pl-3">
              <span className="text-xl text-gray-400">$</span>
            </div>
            <input
              type="text"
              value={usdAmount}
              onChange={(e) => handleUsdChange(e.target.value)}
              className="flex-1 bg-transparent px-3 py-3 text-white text-lg font-medium focus:outline-none"
              placeholder="0.00"
            />
            <div className="flex items-center gap-1 pr-3">
              <span className="text-gray-400 font-medium">USD</span>
              <button
                onClick={() => handleCopy('usd')}
                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                title="Copy"
              >
                {copied === 'usd' ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Amounts */}
        <div>
          <span className="text-xs text-gray-500 mb-2 block">Quick amounts</span>
          <div className="flex gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  coinAmount === amount.toString()
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                {amount} {symbolUpper}
              </button>
            ))}
          </div>
        </div>

        {/* Current Rate */}
        <div className="pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">1 {symbolUpper} =</span>
            <span className="text-white font-medium">{formatUsdDisplay(price)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-500">1 USD =</span>
            <span className="text-white font-medium">
              {formatCoinDisplay(1 / price)} {symbolUpper}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Formatting helpers
function formatCoinValue(value: number): string {
  if (value === 0) return '0';
  if (value >= 1) return value.toFixed(8).replace(/\.?0+$/, '');
  return value.toFixed(8);
}

function formatUsdValue(value: number): string {
  if (value === 0) return '0';
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(6);
}

function formatUsdDisplay(value: number): string {
  if (value >= 1000) {
    return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return '$' + value.toFixed(2);
  }
  return '$' + value.toFixed(6);
}

function formatCoinDisplay(value: number): string {
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(8);
}
