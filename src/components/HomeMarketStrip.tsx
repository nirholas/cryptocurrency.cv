/**
 * Home Market Strip - CoinDesk-style ranked price table
 * Clean numbered list with prices, 24h change, and market cap
 * Inspired by CoinDesk homepage "Prices" section
 */

import Link from 'next/link';
import { getTopCoins } from '@/lib/market-data';

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`;
  return `$${mc.toLocaleString()}`;
}

export default async function HomeMarketStrip() {
  const coins = await getTopCoins(10);

  if (!coins || coins.length === 0) return null;

  return (
    <section className="mb-8" aria-label="Crypto Market Overview">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Prices
          </h2>
          <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:inline">
            Explore all 3000+ cryptocurrency prices
          </span>
        </div>
        <Link
          href="/markets"
          className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1"
        >
          View all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* CoinDesk-style ranked table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_100px_90px] sm:grid-cols-[40px_1fr_120px_100px_120px] px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          <span>#</span>
          <span>Name</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right hidden sm:block">Market Cap</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {coins.slice(0, 10).map((coin: any, index: number) => {
            const change = coin.price_change_percentage_24h ?? 0;
            const isPositive = change >= 0;

            return (
              <Link
                key={coin.id}
                href={`/coin/${coin.id}`}
                className="group grid grid-cols-[40px_1fr_100px_90px] sm:grid-cols-[40px_1fr_120px_100px_120px] px-4 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                {/* Rank */}
                <span className="text-sm font-bold text-gray-300 dark:text-slate-600 tabular-nums">
                  {index + 1}
                </span>

                {/* Coin info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {coin.image ? (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 rounded-full flex-shrink-0">
                      {coin.symbol?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {coin.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 uppercase">
                      {coin.symbol}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-right tabular-nums">
                  {formatPrice(coin.current_price ?? 0)}
                </span>

                {/* 24h change */}
                <span className={`text-sm font-semibold text-right tabular-nums ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{change.toFixed(2)}%
                </span>

                {/* Market cap - hidden on mobile */}
                <span className="text-sm text-gray-500 dark:text-slate-400 text-right hidden sm:block tabular-nums">
                  {coin.market_cap ? formatMarketCap(coin.market_cap) : '—'}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Footer link */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <Link
            href="/markets"
            className="text-xs font-semibold text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
          >
            Need more data? Explore CoinDesk Data API →
          </Link>
        </div>
      </div>
    </section>
  );
}
