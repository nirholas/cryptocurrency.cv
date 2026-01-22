/**
 * PriceStatistics Component - ATH, ATL, price ranges with visual bars
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PriceStatisticsProps {
  currentPrice: number;
  ath: number;
  athDate: string;
  athChangePercentage: number;
  atl: number;
  atlDate: string;
  atlChangePercentage: number;
  high24h: number;
  low24h: number;
  priceChange1h?: number;
  priceChange24h: number;
  priceChange7d?: number;
  priceChange14d?: number;
  priceChange30d?: number;
  priceChange1y?: number;
}

function formatPrice(price: number): string {
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPercent(num: number | null | undefined): string {
  if (num == null) return '-';
  const sign = num >= 0 ? '+' : '';
  return sign + num.toFixed(2) + '%';
}

interface RangeBarProps {
  low: number;
  high: number;
  current: number;
  label: string;
}

function RangeBar({ low, high, current, label }: RangeBarProps) {
  const position = useMemo(() => {
    if (high === low) return 50;
    return Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
  }, [current, high, low]);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-400 w-24">{label}</span>
      <div className="flex-1 mx-4">
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-green-500/30"
            style={{ width: '100%' }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-500 rounded-full shadow-lg"
            initial={{ left: '50%' }}
            animate={{ left: `${position}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ marginLeft: '-5px' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{formatPrice(low)}</span>
          <span className="text-xs text-gray-500">{formatPrice(high)}</span>
        </div>
      </div>
    </div>
  );
}

interface PriceChangeRowProps {
  periods: { label: string; value: number | null | undefined }[];
}

function PriceChangeRow({ periods }: PriceChangeRowProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {periods.map(({ label, value }) => (
        <div key={label} className="text-center">
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div
            className={`text-sm font-medium ${
              value == null
                ? 'text-gray-500'
                : value >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {formatPercent(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PriceStatistics({
  currentPrice,
  ath,
  athDate,
  athChangePercentage,
  atl,
  atlDate,
  atlChangePercentage,
  high24h,
  low24h,
  priceChange1h,
  priceChange24h,
  priceChange7d,
  priceChange14d,
  priceChange30d,
  priceChange1y,
}: PriceStatisticsProps) {
  // Calculate 7d and 30d ranges (approximation based on current price and change)
  const price7dAgo = priceChange7d ? currentPrice / (1 + priceChange7d / 100) : currentPrice;
  const price30dAgo = priceChange30d ? currentPrice / (1 + priceChange30d / 100) : currentPrice;
  
  const low7d = Math.min(price7dAgo * 0.95, currentPrice * 0.95);
  const high7d = Math.max(price7dAgo * 1.05, currentPrice * 1.05);
  
  const low52w = Math.min(atl * 1.1, currentPrice * 0.5);
  const high52w = Math.max(ath, currentPrice);

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Price Statistics</h3>

      <div className="space-y-6">
        {/* ATH / ATL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* All-Time High */}
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">All-Time High</span>
              <span className="text-xs text-gray-500">{formatDate(athDate)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{formatPrice(ath)}</span>
              <span className="text-sm text-red-400">
                {formatPercent(athChangePercentage)}
              </span>
            </div>
            {/* Distance to ATH bar */}
            <div className="mt-3">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (currentPrice / ath) * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((currentPrice / ath) * 100).toFixed(1)}% of ATH
              </p>
            </div>
          </div>

          {/* All-Time Low */}
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">All-Time Low</span>
              <span className="text-xs text-gray-500">{formatDate(atlDate)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{formatPrice(atl)}</span>
              <span className="text-sm text-green-400">
                {formatPercent(atlChangePercentage)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {((currentPrice / atl - 1) * 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}x from ATL
            </p>
          </div>
        </div>

        {/* Price Ranges */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Price Ranges</h4>
          <RangeBar low={low24h} high={high24h} current={currentPrice} label="24h Range" />
          <RangeBar low={low7d} high={high7d} current={currentPrice} label="7d Range" />
          <RangeBar low={low52w} high={high52w} current={currentPrice} label="52w Range" />
        </div>

        {/* Price Changes */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">Price Change</h4>
          <PriceChangeRow
            periods={[
              { label: '1h', value: priceChange1h },
              { label: '24h', value: priceChange24h },
              { label: '7d', value: priceChange7d },
              { label: '14d', value: priceChange14d },
              { label: '30d', value: priceChange30d },
              { label: '1y', value: priceChange1y },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
