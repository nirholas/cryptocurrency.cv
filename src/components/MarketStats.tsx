/**
 * Market Stats Widget
 * Displays key market statistics in a compact widget
 */

import { getMarketOverview, formatNumber, formatPercent, getFearGreedColor, getFearGreedBgColor } from '@/lib/market-data';
import Link from 'next/link';

export default async function MarketStats() {
  const market = await getMarketOverview();
  const marketCapChange = market.global.market_cap_change_percentage_24h_usd;
  const isPositive = marketCapChange >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-gray-900">
          <span aria-hidden="true">📊</span> Market Overview
        </h3>
        <Link 
          href="/markets" 
          className="text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors focus-ring rounded px-2 py-1 -mr-2"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {/* Market Cap */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">Total Market Cap</span>
          <div className="text-right flex items-center gap-2">
            <span className="font-semibold text-gray-900">${formatNumber(market.global.total_market_cap?.usd)}</span>
            <span 
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                isPositive 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-red-700 bg-red-50'
              }`}
            >
              {/* Arrow indicator for accessibility (not color-only) */}
              <svg 
                className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} 
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
        </div>

        {/* 24h Volume */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">24h Volume</span>
          <span className="font-semibold text-gray-900">${formatNumber(market.global.total_volume?.usd)}</span>
        </div>

        {/* BTC Dominance */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">BTC Dominance</span>
          <span className="font-semibold text-gray-900">{market.global.market_cap_percentage?.btc?.toFixed(1)}%</span>
        </div>

        {/* Fear & Greed */}
        {market.fearGreed && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Fear & Greed Index</span>
              <span className={`font-bold ${getFearGreedColor(Number(market.fearGreed.value))}`}>
                {market.fearGreed.value}
              </span>
            </div>
            <div 
              className="h-2.5 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Number(market.fearGreed.value)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Fear and Greed Index: ${market.fearGreed.value} - ${market.fearGreed.value_classification}`}
            >
              <div 
                className={`h-full ${getFearGreedBgColor(Number(market.fearGreed.value))} transition-all duration-500 rounded-full`}
                style={{ width: `${market.fearGreed.value}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 text-right font-medium">
              {market.fearGreed.value_classification}
            </p>
          </div>
        )}

        {/* Trending */}
        {market.trending.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm mb-3">
              <span aria-hidden="true">🔥</span> Trending
            </p>
            <div className="flex flex-wrap gap-2" role="list" aria-label="Trending cryptocurrencies">
              {market.trending.slice(0, 5).map((coin) => (
                <span 
                  key={coin.id}
                  className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 rounded-full px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors"
                  role="listitem"
                >
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
  );
}
