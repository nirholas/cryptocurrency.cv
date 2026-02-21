'use client';

/**
 * Trending Section Component — pure black & white
 * 3-card layout: Market Overview + Trending + Top Gainers/Losers
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { TrendingCoin, TokenPrice, GlobalMarketData, FearGreedIndex } from '@/lib/market-data';
import { formatPrice, formatNumber } from '@/lib/market-data';

interface TrendingSectionProps {
  trending: TrendingCoin[];
  coins: TokenPrice[];
  global?: GlobalMarketData | null;
  fearGreed?: FearGreedIndex | null;
}

/** Tiny inline sparkline SVG */
function MiniSparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const step = w / (prices.length - 1);
  const pts = prices
    .map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="sfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#sfGrad)" points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" points={pts} />
    </svg>
  );
}

/** Single trending coin row */
function TrendingRow({ coin, rank }: { coin: TrendingCoin; rank: number }) {
  const change = coin.data?.price_change_percentage_24h?.usd;
  const price = coin.data?.price;
  return (
    <Link
      href={`/coin/${coin.id}`}
      className="flex items-center justify-between hover:bg-white/5 rounded-lg px-2 py-2 -mx-2 transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-white/30 w-4 shrink-0">{rank}</span>
        <div className="relative w-6 h-6 shrink-0">
          {coin.thumb && (
            <Image src={coin.thumb} alt={coin.name} fill className="rounded-full object-cover" unoptimized />
          )}
        </div>
        <span className="font-medium text-sm text-white truncate">
          {coin.symbol?.toUpperCase() || coin.name}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {price != null && (
          <span className="text-xs text-white/50">{formatPrice(price)}</span>
        )}
        {change != null && (
          <span className="text-xs font-semibold w-[54px] text-right text-white/60">
            {(change ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
    </Link>
  );
}

/** Single coin row for gainers/losers */
function CoinRow({ coin }: { coin: TokenPrice }) {
  const change = coin.price_change_percentage_24h;
  return (
    <Link
      href={`/coin/${coin.id}`}
      className="flex items-center justify-between hover:bg-white/5 rounded-lg px-2 py-2 -mx-2 transition-colors group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative w-6 h-6 shrink-0">
          {coin.image && (
            <Image src={coin.image} alt={coin.name} fill className="rounded-full object-cover" unoptimized />
          )}
        </div>
        <div className="min-w-0">
          <span className="font-medium text-sm text-white">
            {coin.symbol?.toUpperCase()}
          </span>
          <span className="text-xs text-white/40 ml-1.5 hidden sm:inline">{coin.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-xs text-white/50">{formatPrice(coin.current_price)}</span>
        <span className="text-xs font-semibold w-[58px] text-right text-white/60">
          {(change ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(change ?? 0).toFixed(2)}%
        </span>
      </div>
    </Link>
  );
}

export default function TrendingSection({ trending, coins, global, fearGreed }: TrendingSectionProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  const topGainers = sorted.slice(0, 3);
  const topLosers = sorted.slice(-3).reverse();

  const mcap = global?.total_market_cap?.usd;
  const mcapChange = global?.market_cap_change_percentage_24h_usd;
  const vol = global?.total_volume?.usd;
  const btcDom = global?.market_cap_percentage?.btc;
  const ethDom = global?.market_cap_percentage?.eth;
  const fearVal = fearGreed ? Number(fearGreed.value) : null;
  const upMarket = (mcapChange ?? 0) >= 0;

  // Use BTC spark as market proxy
  const btcCoin = coins.find(c => c.id === 'bitcoin');
  const sparkPrices = btcCoin?.sparkline_in_7d?.price?.slice(-48) ?? [];

  return (
    <div className="grid md:grid-cols-3 gap-3 mb-6">

      {/* ── Card 1: Market Overview ────────────────────────────── */}
      <div className="bg-black rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <span className="text-sm font-semibold text-white">Global Market</span>
          <Link href="/markets" className="text-xs text-white/40 hover:text-white transition-colors font-medium">View chart →</Link>
        </div>

        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-[11px] text-white/40 mb-0.5 uppercase tracking-wide font-medium">Total Market Cap</p>
            <p className="text-[22px] font-bold text-white leading-none">
              {mcap ? `$${formatNumber(mcap)}` : '—'}
            </p>
          </div>
          {mcapChange != null && (
            <span className="text-sm font-bold flex items-center gap-0.5 mb-0.5 text-white/70">
              {upMarket ? '▲' : '▼'} {Math.abs(mcapChange).toFixed(2)}%
            </span>
          )}
        </div>

        {mounted && sparkPrices.length > 1 && (
          <div className="mt-1 mb-3">
            <MiniSparkline prices={sparkPrices} />
          </div>
        )}

        <div className="space-y-2 mt-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">24h Volume</span>
            <span className="font-semibold text-white/70">
              {vol ? `$${formatNumber(vol)}` : '—'}
            </span>
          </div>
          {btcDom != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40 flex items-center gap-1">₿ BTC Dominance</span>
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full" style={{ width: `${btcDom}%` }} />
                </div>
                <span className="font-semibold text-white/70">{btcDom.toFixed(1)}%</span>
              </div>
            </div>
          )}
          {ethDom != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40 flex items-center gap-1">Ξ ETH Dominance</span>
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full" style={{ width: `${ethDom}%` }} />
                </div>
                <span className="font-semibold text-white/70">{ethDom.toFixed(1)}%</span>
              </div>
            </div>
          )}
          {mounted && fearVal != null && fearGreed && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Fear &amp; Greed</span>
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/50"
                    style={{ width: `${fearVal}%` }}
                  />
                </div>
                <span className="font-semibold text-white/70">
                  {fearVal}
                </span>
                <span className="text-white/40 hidden sm:inline">{fearGreed.value_classification}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Card 2: Trending ──────────────────────────────────── */}
      <div className="bg-black rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <span className="text-sm font-semibold text-white flex items-center gap-1.5">
            🔥 Trending
          </span>
          <Link href="/markets/trending" className="text-xs text-white/40 hover:text-white transition-colors font-medium">View more →</Link>
        </div>
        <div className="space-y-0.5">
          {trending.slice(0, 5).map((coin, i) => (
            <TrendingRow key={coin.id} coin={coin} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* ── Card 3: Top Gainers + Losers ─────────────────────── */}
      <div className="bg-black rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <span className="text-sm font-semibold text-white flex items-center gap-1.5">
            🚀 Top Gainers
          </span>
          <Link href="/markets/gainers" className="text-xs text-white/40 hover:text-white transition-colors font-medium">View more →</Link>
        </div>
        <div className="space-y-0.5 mb-2">
          {mounted
            ? topGainers.map(c => <CoinRow key={c.id} coin={c} />)
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 bg-white/5 rounded-lg animate-pulse" />
              ))}
        </div>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] text-white/30 font-medium flex items-center gap-1">📉 Top Losers</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="space-y-0.5">
          {mounted
            ? topLosers.map(c => <CoinRow key={c.id} coin={c} />)
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 bg-white/5 rounded-lg animate-pulse" />
              ))}
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          <Link href="/markets/losers" className="text-xs text-white/40 hover:text-white transition-colors font-medium">View all losers →</Link>
        </div>
      </div>

    </div>
  );
}
