'use client';

/**
 * Market Overview Cards — pure black & white
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { GlobalMarketData, FearGreedIndex, TrendingCoin, TokenPrice } from '@/lib/market-data';
import { formatPrice, formatPercent } from '@/lib/market-data';

interface MarketOverviewCardsProps {
  global: GlobalMarketData | null;
  fearGreed: FearGreedIndex | null;
  trending: TrendingCoin[];
  coins: TokenPrice[];
}

function fmtBig(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(3)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 120; const H = 48;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`).join(' ');
  const stroke = positive ? '#34d399' : '#f87171';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-28 h-12 overflow-visible" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
    </svg>
  );
}

export default function MarketOverviewCards({ global, fearGreed, trending, coins }: MarketOverviewCardsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!global) return <Skeleton />;

  const mcap = global.total_market_cap?.usd ?? 0;
  const mcapChange = global.market_cap_change_percentage_24h_usd ?? 0;
  const volume = global.total_volume?.usd ?? 0;
  const btcDom = global.market_cap_percentage?.btc ?? 0;
  const ethDom = global.market_cap_percentage?.eth ?? 0;
  const fgVal = fearGreed ? Number(fearGreed.value) : 0;

  const btcCoin = coins.find(c => c.id === 'bitcoin');
  const spark = btcCoin?.sparkline_in_7d?.price?.slice(-30) ?? [];

  const sortedGainers = [...coins]
    .filter(c => (c.price_change_percentage_24h ?? 0) > 0)
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, 3);

  const trendingWithData = trending.slice(0, 5).map(t => {
    const match = coins.find(c => c.id === t.id);
    return { ...t, price: match?.current_price, change: match?.price_change_percentage_24h };
  });

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">

      {/* LEFT: Market Cap + Volume + F&G */}
      <div className="flex flex-col gap-3">
        <div className="bg-black border border-white/10 rounded-xl p-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[22px] font-bold text-white leading-none">{fmtBig(mcap)}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-white/50">Market Cap</span>
                {mounted && <span className="text-xs font-semibold text-white/70">{mcapChange >= 0 ? '▲' : '▼'} {Math.abs(mcapChange).toFixed(2)}%</span>}
              </div>
              {mounted && btcDom > 0 && (
                <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40">
                  <span>BTC <span className="font-semibold text-white/60">{btcDom.toFixed(1)}%</span></span>
                  <span>ETH <span className="font-semibold text-white/60">{ethDom.toFixed(1)}%</span></span>
                </div>
              )}
            </div>
            {mounted && spark.length > 2 && <Sparkline data={spark} positive={mcapChange >= 0} />}
          </div>
        </div>

        <div className="bg-black border border-white/10 rounded-xl p-4 flex-1">
          <p className="text-[22px] font-bold text-white leading-none">{fmtBig(volume)}</p>
          <p className="text-xs text-white/50 mt-1.5">24h Trading Volume</p>
        </div>

        {fearGreed && mounted && (
          <div className="bg-black border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-2xl font-bold text-white">{fgVal}</span>
              <span className="text-[10px] text-white/40">/100</span>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-0.5">Fear &amp; Greed Index</p>
              <p className="text-base font-bold text-white">{fearGreed.value_classification}</p>
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE: Trending */}
      <div className="bg-black border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <span className="font-bold text-white text-sm">🔥 Trending</span>
          <Link href="/markets/trending" className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-0.5">
            View more <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="space-y-1">
          {trendingWithData.map((coin, i) => (
            <Link key={coin.id} href={`/coin/${coin.id}`}
              className="flex items-center justify-between py-1.5 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs text-white/30 w-4 shrink-0 font-medium">{i + 1}</span>
                <div className="relative w-7 h-7 shrink-0">
                  {coin.thumb && <Image src={coin.thumb} alt={coin.name} fill className="rounded-full object-cover" unoptimized />}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-white">{coin.name}</span>
                  {coin.market_cap_rank && <span className="text-xs text-white/30 ml-1.5">#{coin.market_cap_rank}</span>}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                {coin.price != null && <p className="text-sm font-semibold text-white">{formatPrice(coin.price)}</p>}
                {coin.change != null && <p className={`text-xs font-semibold ${(coin.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(coin.change ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(coin.change ?? 0).toFixed(2)}%</p>}
              </div>
            </Link>
          ))}
        </div>
        {trending.length > 5 && (
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
            {trending.slice(5, 9).map((coin, idx) => (
              <Link key={coin.id} href={`/coin/${coin.id}`}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 rounded-full px-2.5 py-1 transition-colors">
                <span className="text-[10px] text-white/30 font-medium">{idx + 6}</span>
                {coin.thumb && <div className="relative w-4 h-4"><Image src={coin.thumb} alt={coin.name} fill className="rounded-full object-cover" unoptimized /></div>}
                <span className="text-xs font-semibold text-white/70">{coin.symbol.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Top Gainers */}
      <div className="bg-black border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
          <span className="font-bold text-white text-sm">🚀 Top Gainers</span>
          <Link href="/markets?change=gainers&sort=price_change_percentage_24h&order=desc"
            className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-0.5">
            View more <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="space-y-1">
          {mounted
            ? sortedGainers.map(coin => (
              <Link key={coin.id} href={`/coin/${coin.id}`}
                className="flex items-center justify-between py-1.5 hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-7 h-7 shrink-0">
                    {coin.image && <Image src={coin.image} alt={coin.name} fill className="rounded-full object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-white">{coin.name}</span>
                    <span className="text-xs text-white/30 ml-1.5">{coin.symbol.toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-semibold text-white">{formatPrice(coin.current_price)}</p>
                  <p className={`text-xs font-semibold ${(coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>▲ {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%</p>
                </div>
              </Link>
            ))
            : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-11 bg-white/5 rounded-lg animate-pulse" />
            ))
          }
        </div>
        <div className="mt-3 pt-2.5 border-t border-white/10 flex gap-4">
          <Link href="/markets/gainers" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">All Gainers →</Link>
          <Link href="/markets/losers" className="text-xs font-semibold text-white/60 hover:text-white transition-colors">Top Losers →</Link>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
      {[1, 2].map(i => <div key={i} className="bg-white/5 rounded-xl animate-pulse h-52" />)}
    </div>
  );
}
