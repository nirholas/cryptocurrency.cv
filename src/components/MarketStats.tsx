/**
 * Market Stats Widget
 * Premium glassmorphism market overview with animated elements
 */

import { getMarketOverview, formatNumber, formatPercent, getFearGreedColor, getFearGreedBgColor } from '@/lib/market-data';
import Link from 'next/link';

export default async function MarketStats() {
  const market = await getMarketOverview();
  const marketCapChange = market.global.market_cap_change_percentage_24h_usd;
  const isPositive = marketCapChange >= 0;
  const fearGreedValue = market.fearGreed ? Number(market.fearGreed.value) : 50;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900/80 rounded-2xl shadow-card dark:shadow-xl dark:border dark:border-slate-700/50 backdrop-blur-sm">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
        style={{
          background: `
            radial-gradient(ellipse at 0% 0%, rgba(245, 158, 11, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)
          `
        }}
        aria-hidden="true"
      />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <span 
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-500 flex items-center justify-center text-black shadow-lg shadow-gray-500/25"
              aria-hidden="true"
            >
              📊
            </span>
            Market Overview
          </h3>
          <Link 
            href="/markets" 
            className="group text-sm font-semibold text-brand-700 dark:text-gray-300 hover:text-brand-800 dark:hover:text-gray-200 transition-colors focus-ring rounded-lg px-3 py-1.5 -mr-3 hover:bg-brand-50 dark:hover:bg-gray-500/10 flex items-center gap-1"
          >
            View All
            <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="space-y-4">
          {/* Market Cap - Premium card style */}
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/80 dark:to-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Total Market Cap</span>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  ${formatNumber(market.global.total_market_cap?.usd)}
                </div>
              </div>
              <span 
                className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full ${
                  isPositive 
                    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40' 
                    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
                }`}
              >
                <svg 
                  className={`w-3.5 h-3.5 ${isPositive ? '' : 'rotate-180'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span aria-label={`${isPositive ? 'up' : 'down'} ${Math.abs(marketCapChange).toFixed(2)} percent`}>
                  {formatPercent(marketCapChange)}
                </span>
              </span>
            </div>
            {/* Mini sparkline placeholder */}
            <div className="mt-3 h-8 flex items-end gap-0.5" aria-hidden="true">
              {[40, 65, 45, 70, 55, 80, 60, 75, 85, 70, 90, 75].map((h, i) => (
                <div 
                  key={i}
                  className={`flex-1 rounded-t ${isPositive ? 'bg-emerald-400/60 dark:bg-emerald-500/40' : 'bg-red-400/60 dark:bg-red-500/40'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Volume & BTC Dominance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-gray-100 dark:border-slate-700/50">
              <span className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">24h Volume</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                ${formatNumber(market.global.total_volume?.usd)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-gray-100 dark:border-slate-700/50">
              <span className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">BTC Dom.</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-1 flex items-baseline gap-1">
                {market.global.market_cap_percentage?.btc?.toFixed(1)}
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* Fear & Greed - Premium gauge style */}
          {market.fearGreed && (
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-800/80 dark:to-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Fear & Greed Index</span>
                <span className={`text-2xl font-black ${getFearGreedColor(fearGreedValue)}`}>
                  {market.fearGreed.value}
                </span>
              </div>
              
              {/* Premium gradient progress bar */}
              <div className="relative">
                <div 
                  className="h-3 rounded-full overflow-hidden"
                  style={{
                    background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)'
                  }}
                  role="progressbar"
                  aria-valuenow={fearGreedValue}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Fear and Greed Index: ${market.fearGreed.value} - ${market.fearGreed.value_classification}`}
                >
                  <div 
                    className="absolute h-3 bg-gray-200 dark:bg-slate-700 right-0 top-0 transition-all duration-500"
                    style={{ width: `${100 - fearGreedValue}%` }}
                  />
                </div>
                {/* Indicator needle */}
                <div 
                  className="absolute -top-1 w-1 h-5 bg-gray-900 dark:bg-white rounded-full shadow-lg transition-all duration-500"
                  style={{ left: `calc(${fearGreedValue}% - 2px)` }}
                  aria-hidden="true"
                />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-3 text-center font-semibold">
                {market.fearGreed.value_classification}
              </p>
            </div>
          )}

          {/* Trending Coins - Premium pills */}
          {market.trending.length > 0 && (
            <div className="pt-2">
              <p className="text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-[10px]" aria-hidden="true">🔥</span>
                Trending Now
              </p>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Trending cryptocurrencies">
                {market.trending.slice(0, 5).map((coin, index) => (
                  <span 
                    key={coin.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-default ${
                      index === 0 
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/40 dark:to-gray-700/40 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50'
                        : 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600/50'
                    }`}
                    role="listitem"
                  >
                    {index === 0 && <span className="text-gray-400" aria-hidden="true">👑</span>}
                    <img 
                      src={coin.thumb} 
                      alt="" 
                      className="w-4 h-4 rounded-full" 
                      aria-hidden="true"
                    />
                    <span>{coin.symbol.toUpperCase()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
