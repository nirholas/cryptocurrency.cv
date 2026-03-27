/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Waves,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WhaleAlert {
  id: string;
  symbol: string;
  amount: string;
  direction: string;
  timestamp: string;
}

interface Signal {
  id: string;
  type: string;
  title: string;
  description: string;
  strength: "strong" | "moderate" | "weak";
}

interface TopMover {
  symbol: string;
  name: string;
  change: number;
}

/* ------------------------------------------------------------------ */
/*  IntelligenceCards                                                   */
/* ------------------------------------------------------------------ */

export default function IntelligenceCards() {
  const [whales, setWhales] = useState<WhaleAlert[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [gainers, setGainers] = useState<TopMover[]>([]);
  const [losers, setLosers] = useState<TopMover[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [whaleRes, signalRes, gainersRes, losersRes] = await Promise.allSettled([
        fetch("/api/whale-alerts?limit=4").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/signals?limit=3").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/market/gainers?limit=4").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/market/losers?limit=4").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (whaleRes.status === "fulfilled" && whaleRes.value) {
        const alerts = whaleRes.value.alerts || whaleRes.value.data || [];
        setWhales(
          alerts.slice(0, 4).map((a: Record<string, unknown>, i: number) => ({
            id: String(a.id || a.hash || i),
            symbol: String(a.symbol || a.coin || "BTC"),
            amount: a.amount_usd
              ? `$${Number(a.amount_usd).toLocaleString()}`
              : String(a.amount || "Unknown"),
            direction: String(a.direction || a.type || "transfer"),
            timestamp: String(a.timestamp || new Date().toISOString()),
          })),
        );
      }

      if (signalRes.status === "fulfilled" && signalRes.value) {
        const sigs = signalRes.value.signals || signalRes.value.data || [];
        setSignals(
          sigs.slice(0, 3).map((s: Record<string, unknown>, i: number) => ({
            id: String(s.id || i),
            type: String(s.type || s.signal_type || "market"),
            title: String(s.title || s.name || "Market Signal"),
            description: String(s.description || s.summary || ""),
            strength: (s.strength as Signal["strength"]) || "moderate",
          })),
        );
      }

      if (gainersRes.status === "fulfilled" && gainersRes.value) {
        const g = gainersRes.value.coins || gainersRes.value.data || gainersRes.value || [];
        setGainers(
          (Array.isArray(g) ? g : []).slice(0, 4).map((c: Record<string, unknown>) => ({
            symbol: String(c.symbol || ""),
            name: String(c.name || c.symbol || ""),
            change: Number(c.price_change_percentage_24h ?? c.change24h ?? c.change ?? 0),
          })),
        );
      }

      if (losersRes.status === "fulfilled" && losersRes.value) {
        const l = losersRes.value.coins || losersRes.value.data || losersRes.value || [];
        setLosers(
          (Array.isArray(l) ? l : []).slice(0, 4).map((c: Record<string, unknown>) => ({
            symbol: String(c.symbol || ""),
            name: String(c.name || c.symbol || ""),
            change: Number(c.price_change_percentage_24h ?? c.change24h ?? c.change ?? 0),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const strengthColor = {
    strong: "bg-green-500",
    moderate: "bg-yellow-500",
    weak: "bg-gray-400",
  };

  if (loading) {
    return (
      <section className="border-border border-b">
        <div className="container-main py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-border animate-pulse rounded-xl border p-6">
                <div className="bg-border mb-4 h-5 w-32 rounded" />
                <div className="space-y-3">
                  <div className="bg-border h-4 w-full rounded" />
                  <div className="bg-border h-4 w-3/4 rounded" />
                  <div className="bg-border h-4 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-border border-b">
      <div className="container-main py-8 lg:py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-text-primary font-serif text-lg font-bold">Intelligence</h2>
          <button
            onClick={fetchData}
            className="text-text-tertiary hover:text-accent flex items-center gap-1 text-xs transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Whale Alerts Card */}
          <div className="border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Waves className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="text-text-primary text-sm font-semibold">Whale Moves</h3>
              </div>
              <Link
                href="/whale-alerts"
                className="text-accent hover:text-accent-hover text-xs transition-colors"
              >
                View all
              </Link>
            </div>
            {whales.length > 0 ? (
              <div className="space-y-3">
                {whales.map((w) => (
                  <div key={w.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-text-primary text-sm font-medium">
                        {w.symbol} {w.direction}
                      </div>
                      <div className="text-text-tertiary text-xs">{w.amount}</div>
                    </div>
                    <span className="text-text-tertiary shrink-0 text-[10px]">
                      {new Date(w.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-tertiary text-sm">No recent whale alerts</p>
            )}
          </div>

          {/* Signals Card */}
          <div className="border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
                <h3 className="text-text-primary text-sm font-semibold">Signals</h3>
              </div>
              <Link
                href="/signals"
                className="text-accent hover:text-accent-hover text-xs transition-colors"
              >
                View all
              </Link>
            </div>
            {signals.length > 0 ? (
              <div className="space-y-3">
                {signals.map((s) => (
                  <div key={s.id} className="group">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-1.5 w-1.5 rounded-full", strengthColor[s.strength])} />
                      <span className="text-text-primary text-sm font-medium">{s.title}</span>
                    </div>
                    {s.description && (
                      <p className="text-text-tertiary mt-0.5 pl-3.5 text-xs line-clamp-1">
                        {s.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-tertiary text-sm">No active signals</p>
            )}
          </div>

          {/* Top Movers Card */}
          <div className="border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <h3 className="text-text-primary text-sm font-semibold">Top Movers</h3>
              </div>
              <Link
                href="/markets"
                className="text-accent hover:text-accent-hover text-xs transition-colors"
              >
                Markets
              </Link>
            </div>
            <div className="space-y-2">
              {/* Gainers */}
              {gainers.map((g) => (
                <div key={g.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-text-primary text-sm font-medium">{g.symbol}</span>
                    <span className="text-text-tertiary text-xs">{g.name}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    +{g.change.toFixed(1)}%
                  </span>
                </div>
              ))}
              {/* Divider */}
              {gainers.length > 0 && losers.length > 0 && (
                <div className="border-border my-1 border-t" />
              )}
              {/* Losers */}
              {losers.map((l) => (
                <div key={l.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-text-primary text-sm font-medium">{l.symbol}</span>
                    <span className="text-text-tertiary text-xs">{l.name}</span>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {l.change.toFixed(1)}%
                  </span>
                </div>
              ))}
              {gainers.length === 0 && losers.length === 0 && (
                <p className="text-text-tertiary text-sm">Loading market data...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
