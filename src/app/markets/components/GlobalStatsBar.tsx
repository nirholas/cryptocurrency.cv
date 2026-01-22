'use client';

/**
 * Global Market Stats Bar
 * Displays key market metrics in a horizontal ticker
 */

import { useEffect, useState } from 'react';
import type { GlobalMarketData, FearGreedIndex } from '@/lib/market-data';
import { formatNumber, formatPercent, getFearGreedColor } from '@/lib/market-data';

interface GlobalStatsBarProps {
  global: GlobalMarketData | null;
  fearGreed: FearGreedIndex | null;
}

interface StatItemProps {
  label: string;
  value: string;
  change?: number | null;
  icon?: string;
  color?: string;
}

function StatItem({ label, value, change, icon, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
      {icon && <span className="text-sm">{icon}</span>}
      <span className="text-gray-500 dark:text-gray-400 text-sm">{label}:</span>
      <span className={`font-semibold ${color || 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
      {change != null && (
        <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatPercent(change)}
        </span>
      )}
    </div>
  );
}

export default function GlobalStatsBar({ global, fearGreed }: GlobalStatsBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!global) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const fearGreedValue = fearGreed ? Number(fearGreed.value) : 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 py-1 overflow-x-auto scrollbar-hide">
          <StatItem
            label="Market Cap"
            value={`$${formatNumber(global.total_market_cap?.usd)}`}
            change={global.market_cap_change_percentage_24h_usd}
            icon="📊"
          />
          
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          
          <StatItem
            label="24h Volume"
            value={`$${formatNumber(global.total_volume?.usd)}`}
            icon="📈"
          />
          
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          
          <StatItem
            label="BTC Dominance"
            value={`${global.market_cap_percentage?.btc?.toFixed(1)}%`}
            icon="₿"
          />
          
          {global.market_cap_percentage?.eth && (
            <>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
              <StatItem
                label="ETH Dominance"
                value={`${global.market_cap_percentage.eth.toFixed(1)}%`}
                icon="Ξ"
              />
            </>
          )}
          
          {fearGreed && mounted && (
            <>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
              <div className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <span className="text-sm">😱</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Fear & Greed:</span>
                <span className={`font-semibold ${getFearGreedColor(fearGreedValue)}`}>
                  {fearGreed.value}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  ({fearGreed.value_classification})
                </span>
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      fearGreedValue <= 25
                        ? 'bg-red-500'
                        : fearGreedValue <= 45
                        ? 'bg-orange-500'
                        : fearGreedValue <= 55
                        ? 'bg-yellow-500'
                        : fearGreedValue <= 75
                        ? 'bg-lime-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${fearGreedValue}%` }}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          
          <StatItem
            label="Active Cryptos"
            value={global.active_cryptocurrencies?.toLocaleString() || '0'}
            icon="🪙"
          />
          
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
          
          <StatItem
            label="Markets"
            value={global.markets?.toLocaleString() || '0'}
            icon="🏛️"
          />
        </div>
      </div>
    </div>
  );
}
