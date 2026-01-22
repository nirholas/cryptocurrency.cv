/**
 * PriceBox Component - Displays current price with change indicator and 24h range
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceBoxProps {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  priceInBtc?: number;
  priceInEth?: number;
  lastUpdated?: string;
  symbol: string;
}

type Currency = 'usd' | 'btc' | 'eth';

function formatPrice(price: number, currency: Currency = 'usd'): string {
  if (currency === 'btc') {
    return price.toFixed(8) + ' BTC';
  }
  if (currency === 'eth') {
    return price.toFixed(6) + ' ETH';
  }
  
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (price >= 1) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 0.01) {
    return '$' + price.toFixed(4);
  }
  return '$' + price.toFixed(8);
}

export default function PriceBox({
  price,
  change24h,
  high24h,
  low24h,
  priceInBtc,
  priceInEth,
  lastUpdated,
  symbol,
}: PriceBoxProps) {
  const [currency, setCurrency] = useState<Currency>('usd');
  const [lastPrice, setLastPrice] = useState(price);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  // Track price changes for flash effect
  useEffect(() => {
    if (price !== lastPrice) {
      setPriceFlash(price > lastPrice ? 'up' : 'down');
      setLastPrice(price);
      const timeout = setTimeout(() => setPriceFlash(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [price, lastPrice]);

  // Update time since last update
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTime = () => {
      const updated = new Date(lastUpdated);
      const now = new Date();
      const diff = Math.floor((now.getTime() - updated.getTime()) / 1000);

      if (diff < 60) {
        setTimeSinceUpdate(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeSinceUpdate(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(diff / 3600)}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Calculate price range position (0-100)
  const rangePosition = useMemo(() => {
    if (high24h === low24h) return 50;
    return Math.min(100, Math.max(0, ((price - low24h) / (high24h - low24h)) * 100));
  }, [price, high24h, low24h]);

  const isPositive = change24h >= 0;
  const displayPrice = currency === 'btc' && priceInBtc 
    ? priceInBtc 
    : currency === 'eth' && priceInEth 
      ? priceInEth 
      : price;

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 h-full">
      {/* Currency Selector */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {symbol} Price
        </span>
        <div className="flex bg-gray-900 rounded-lg p-0.5">
          {(['usd', 'btc', 'eth'] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                currency === c
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={displayPrice}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className={`text-3xl sm:text-4xl font-bold transition-colors duration-300 ${
              priceFlash === 'up'
                ? 'text-green-400'
                : priceFlash === 'down'
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            {formatPrice(displayPrice, currency)}
          </motion.div>
        </AnimatePresence>

        {/* Change Indicator */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`flex items-center gap-1 text-lg font-semibold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isPositive ? '' : 'rotate-180'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {isPositive ? '+' : ''}
            {change24h.toFixed(2)}%
          </span>
          <span className="text-gray-500 text-sm">(24h)</span>
        </div>
      </div>

      {/* 24h Range */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">24h Low</span>
          <span className="text-gray-500">24h High</span>
        </div>

        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          {/* Range bar */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30"
            style={{ width: '100%' }}
          />
          {/* Current position indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-gray-800"
            initial={{ left: '50%' }}
            animate={{ left: `${rangePosition}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ marginLeft: '-6px' }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-300">{formatPrice(low24h)}</span>
          <span className="text-gray-300">{formatPrice(high24h)}</span>
        </div>
      </div>

      {/* Last updated */}
      {timeSinceUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
          <span className="text-xs text-gray-500">Last updated</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {timeSinceUpdate}
          </span>
        </div>
      )}
    </div>
  );
}
