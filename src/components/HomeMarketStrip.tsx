/**
 * Home Market Strip - CoinDesk-style ranked price table
 * Clean numbered list with prices, 24h change, volume, sparkline, and market cap
 * Inspired by CoinDesk homepage "Prices" section
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { getTopCoins } from '@/lib/market-data';

// Fallback data so the table never appears empty when CoinGecko fails
const FALLBACK_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 1, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: 21000000, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'eth', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 2, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: null, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'solana', name: 'Solana', symbol: 'sol', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 3, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: null, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'binancecoin', name: 'BNB', symbol: 'bnb', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 4, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: null, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { id: 'ripple', name: 'XRP', symbol: 'xrp', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 5, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: null, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { id: 'cardano', name: 'Cardano', symbol: 'ada', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 6, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: 45000000000, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'doge', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 7, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: null, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'dot', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 8, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: null, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'avax', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 9, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: null, max_supply: 720000000, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'link', current_price: 0, price_change_percentage_24h: 0, market_cap: 0, market_cap_rank: 10, total_volume: 0, price_change_24h: 0, circulating_supply: 0, total_supply: 1000000000, max_supply: 1000000000, ath: 0, ath_change_percentage: 0, last_updated: '', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
];

function formatPrice(price: number): string {
  if (price === 0) return '—';
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatMarketCap(mc: number): string {
  if (!mc) return '—';
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(1)}M`;
  return `$${mc.toLocaleString()}`;
}

function formatVolume(vol: number): string {
  if (!vol) return '—';
  if (vol >= 1e12) return `$${(vol / 1e12).toFixed(1)}T`;
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

/** Build an SVG polyline points string from sparkline price data */
function buildSparklinePath(prices: number[], width: number, height: number): string {
  if (!prices || prices.length < 2) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = width / (prices.length - 1);
  return prices
    .map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`)
    .join(' ');
}

export default async function HomeMarketStrip() {
  let coins = await getTopCoins(10);

  if (!coins || coins.length === 0) {
    coins = FALLBACK_COINS as any;
  }

  const isFallback = coins === (FALLBACK_COINS as any);

  const t = useTranslations('common');
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
          {t('viewAll')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* CoinDesk-style ranked table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_100px_90px] sm:grid-cols-[40px_1fr_120px_100px_100px_80px_120px] px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          <span>#</span>
          <span>Name</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right hidden sm:block">Volume</span>
          <span className="text-center hidden sm:block">7d</span>
          <span className="text-right hidden sm:block">Market Cap</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {coins.slice(0, 10).map((coin: any, index: number) => {
            const change = coin.price_change_percentage_24h ?? 0;
            const isPositive = change >= 0;
            const sparkPrices: number[] | undefined = coin.sparkline_in_7d?.price;
            const sparkColor = sparkPrices && sparkPrices.length >= 2
              ? sparkPrices[sparkPrices.length - 1] >= sparkPrices[0]
                ? '#10b981'  // emerald-500
                : '#ef4444'  // red-500
              : '#9ca3af';   // gray-400

            return (
              <Link
                key={coin.id}
                href={`/coin/${coin.id}`}
                className="group grid grid-cols-[40px_1fr_100px_90px] sm:grid-cols-[40px_1fr_120px_100px_100px_80px_120px] px-4 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                {/* Rank */}
                <span className="text-sm font-bold text-gray-300 dark:text-slate-600 tabular-nums">
                  {index + 1}
                </span>

                {/* Coin info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {coin.image ? (
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={28}
                      height={28}
                      className="rounded-full flex-shrink-0"
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
                  {isFallback ? '—' : `${isPositive ? '+' : ''}${change.toFixed(2)}%`}
                </span>

                {/* Volume - hidden on mobile */}
                <span className="text-sm text-gray-500 dark:text-slate-400 text-right hidden sm:block tabular-nums">
                  {formatVolume(coin.total_volume ?? 0)}
                </span>

                {/* 7d Sparkline - hidden on mobile */}
                <span className="hidden sm:flex items-center justify-center">
                  {sparkPrices && sparkPrices.length >= 2 ? (
                    <svg width="60" height="24" viewBox="0 0 60 24" className="overflow-visible">
                      <polyline
                        fill="none"
                        stroke={sparkColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={buildSparklinePath(sparkPrices, 60, 22)}
                      />
                    </svg>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
                  )}
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
