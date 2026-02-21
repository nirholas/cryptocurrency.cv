'use client';

/**
 * Global Market Stats Bar — pure black & white
 */

import { useEffect, useState } from 'react';
import type { GlobalMarketData, FearGreedIndex } from '@/lib/market-data';
import { formatNumber } from '@/lib/market-data';

interface GlobalStatsBarProps {
  global: GlobalMarketData | null;
  fearGreed: FearGreedIndex | null;
}

function Sep() {
  return <span className="text-white/20 select-none mx-1">·</span>;
}

export default function GlobalStatsBar({ global, fearGreed }: GlobalStatsBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!global) {
    return (
      <div className="bg-black border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center gap-3 h-9 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3.5 w-24 bg-white/10 rounded animate-pulse shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mcapChange = global.market_cap_change_percentage_24h_usd;

  return (
    <div className="bg-black border-b border-white/10 text-xs text-white/50">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center gap-0 h-9 overflow-x-auto scrollbar-hide [&>*]:shrink-0">
          <span className="pr-3">Coins: <span className="font-semibold text-white">{global.active_cryptocurrencies?.toLocaleString() ?? '—'}</span></span>
          <Sep />
          <span className="px-3">Exchanges: <span className="font-semibold text-white">{global.markets?.toLocaleString() ?? '—'}</span></span>
          <Sep />
          <span className="px-3 flex items-center gap-1.5">
            Market Cap: <span className="font-semibold text-white">${formatNumber(global.total_market_cap?.usd)}</span>
            {mcapChange != null && (
              <span className={`font-medium ${mcapChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {mcapChange >= 0 ? '▲' : '▼'} {Math.abs(mcapChange).toFixed(1)}%
              </span>
            )}
          </span>
          <Sep />
          <span className="px-3">24h Vol: <span className="font-semibold text-white">${formatNumber(global.total_volume?.usd)}</span></span>
          <Sep />
          <span className="px-3 flex items-center gap-1.5">
            Dominance: <span className="font-semibold text-white ml-1">BTC {global.market_cap_percentage?.btc?.toFixed(1)}%</span>
            {global.market_cap_percentage?.eth && <span className="font-semibold text-white">ETH {global.market_cap_percentage.eth.toFixed(1)}%</span>}
          </span>
          {fearGreed && mounted && (
            <>
              <Sep />
              <span className="px-3 flex items-center gap-1.5">
                Fear &amp; Greed: <span className="font-semibold text-white">{fearGreed.value}</span>
                <span className="text-white/40 hidden sm:inline">{fearGreed.value_classification}</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
