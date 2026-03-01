'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface FearGreedCurrent {
  value: number;
  valueClassification: string;
}

interface TradingSignal {
  ticker: string;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  timeframe: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface LiquidationTotals {
  totalLongs: number;
  totalShorts: number;
  totalUsd: number;
}

interface LiquidationEvent {
  symbol: string;
  side: 'long' | 'short';
  amount: number;
}

interface MarketSignalsData {
  fearGreed: FearGreedCurrent | null;
  signals: TradingSignal[];
  liquidations: LiquidationTotals | null;
  topLiquidation: LiquidationEvent | null;
}

interface PerSignalExplanation {
  signal_id: string;
  explanation: string;
}

interface NarrativeData {
  narrative: string;
  per_signal: PerSignalExplanation[];
  generated_at: string;
  model_used: string;
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const signalConfig: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: 'Strong Buy', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  buy: { label: 'Buy', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  hold: { label: 'Hold', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/50' },
  sell: { label: 'Sell', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  strong_sell: { label: 'Strong Sell', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

function FearGreedGauge({ value, classification }: { value: number; classification: string }) {
  const color = value < 25 ? 'text-red-500' : value < 45 ? 'text-orange-500' : value < 55 ? 'text-yellow-500' : value < 75 ? 'text-lime-500' : 'text-green-500';
  const ringColor = value < 25 ? 'stroke-red-500' : value < 45 ? 'stroke-orange-500' : value < 55 ? 'stroke-yellow-500' : value < 75 ? 'stroke-lime-500' : 'stroke-green-500';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-gray-200 dark:stroke-slate-600" />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="8"
            className={ringColor}
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 251.2} 251.2`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300 mt-2">{classification}</span>
    </div>
  );
}

function timeSince(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
}

function SignalRow({
  sig,
  explanation,
}: {
  sig: TradingSignal;
  explanation?: string;
}) {
  const cfg = signalConfig[sig.signal] || signalConfig.hold;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-between"
      role="button"
      tabIndex={0}
      aria-label={explanation ? `Show AI explanation for ${sig.ticker}` : `Market signal for ${sig.ticker}`}
      onMouseEnter={() => explanation && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => explanation && setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => { if (explanation && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(v => !v); } }}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm text-gray-900 dark:text-white">{sig.ticker}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        {explanation && (
          <button
            className="text-gray-400 dark:text-slate-500 hover:text-brand-500 transition-colors"
            onClick={() => setOpen(v => !v)}
            aria-label={`AI explanation for ${sig.ticker}`}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <span className="text-xs text-gray-500 dark:text-slate-400">{sig.confidence}%</span>

      {open && explanation && (
        <div className="absolute z-20 bottom-full left-0 mb-2 w-64 max-w-xs rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-xl p-3 text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
          <span className="inline-flex items-center gap-1 text-brand-500 font-semibold mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15z" /><path fillRule="evenodd" d="M10 5a5 5 0 100 10A5 5 0 0010 5zm-3 5a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" /></svg>
            AI insight
          </span>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

export function MarketSignals() {
  const [data, setData] = useState<MarketSignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [narrativeData, setNarrativeData] = useState<NarrativeData | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [fgRes, sigRes, liqRes] = await Promise.all([
          fetch('/api/fear-greed?days=1').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/signals?limit=3').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/liquidations').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const topLiq = liqRes?.recentEvents?.[0] || null;

        setData({
          fearGreed: fgRes?.current || null,
          signals: sigRes?.signals?.slice(0, 3) || [],
          liquidations: liqRes?.totals || null,
          topLiquidation: topLiq ? { symbol: topLiq.symbol, side: topLiq.side, amount: topLiq.amount } : null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch AI narrative once signals are available
  useEffect(() => {
    if (!data?.signals || data.signals.length === 0) return;
    let cancelled = false;
    async function fetchNarrative() {
      setNarrativeLoading(true);
      try {
        const encoded = encodeURIComponent(JSON.stringify(data!.signals));
        const url = `/api/signals/narrative?signals=${encoded}`;
        const res = await fetch(url).catch(() => null);
        if (!res || !res.ok || cancelled) return;
        const json: NarrativeData = await res.json();
        if (!cancelled) setNarrativeData(json);
      } catch {
        // silently hide
      } finally {
        if (!cancelled) setNarrativeLoading(false);
      }
    }
    fetchNarrative();
    return () => { cancelled = true; };
  }, [data?.signals]);

  if (loading) {
    return (
      <section className="mb-10" aria-label="Market Signals">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-brand-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⚡ Market Signals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-28 bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) return null;

  return (
    <section className="mb-10" aria-label="Market Signals">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-brand-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⚡ Market Signals</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fear & Greed */}
        <Link
          href="/fear-greed"
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Fear & Greed Index</h3>
          {data.fearGreed ? (
            <FearGreedGauge value={data.fearGreed.value} classification={data.fearGreed.valueClassification} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Unavailable</p>
          )}
        </Link>

        {/* Trading Signals */}
        <Link
          href="/signals"
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Trading Signals</h3>
          {data.signals.length > 0 ? (
            <div className="space-y-3">
              {data.signals.map((sig, i) => {
                const explanation = narrativeData?.per_signal.find(
                  p => p.signal_id === sig.ticker
                )?.explanation;
                return (
                  <SignalRow key={i} sig={sig} explanation={explanation} />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">No signals available</p>
          )}
        </Link>

        {/* Liquidations */}
        <Link
          href="/liquidations"
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Liquidations (24h)</h3>
          {data.liquidations ? (
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatUsd(data.liquidations.totalUsd)}
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Longs: </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{formatUsd(data.liquidations.totalLongs)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400">Shorts: </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">{formatUsd(data.liquidations.totalShorts)}</span>
                </div>
              </div>
              {data.topLiquidation && (
                <div className="text-xs text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-700">
                  Largest: {data.topLiquidation.symbol} {data.topLiquidation.side} {formatUsd(data.topLiquidation.amount)}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Unavailable</p>
          )}
        </Link>
      </div>

      {/* AI Narrative */}
      {narrativeLoading && (
        <div className="mt-5 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
          <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 dark:bg-slate-700/60 rounded w-full" />
            <div className="h-3 bg-gray-100 dark:bg-slate-700/60 rounded w-5/6" />
            <div className="h-3 bg-gray-100 dark:bg-slate-700/60 rounded w-4/6" />
          </div>
        </div>
      )}

      {!narrativeLoading && narrativeData && (
        <div className="mt-5 rounded-2xl border border-brand-200 dark:border-brand-800/50 bg-brand-50/60 dark:bg-brand-900/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500 text-white">
              AI
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">Market Narrative</span>
            <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
              Refreshed {timeSince(narrativeData.generated_at)}
            </span>
          </div>
          <blockquote className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed border-l-2 border-brand-400 dark:border-brand-600 pl-3 italic">
            {narrativeData.narrative}
          </blockquote>
        </div>
      )}
    </section>
  );
}
