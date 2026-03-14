"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Filter,
  RefreshCw,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pause,
  Play,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface WhaleAddress {
  address: string;
  owner?: string;
  ownerType?: string;
}

interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUsd: number;
  from: WhaleAddress;
  to: WhaleAddress;
  hash: string;
  timestamp: string;
  transactionType: string;
  significance: string;
}

interface WhaleAlertsResponse {
  alerts: WhaleTransaction[];
  summary: {
    totalTransactions: number;
    totalValueUsd: number;
    exchangeDeposits: number;
    exchangeWithdrawals: number;
    largestTransaction: number;
  };
  lastUpdated: string;
}

type CoinFilter = "ALL" | "BTC" | "ETH";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 0) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1_000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || "Unknown";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

/** Classify as exchange inflow (bearish) or outflow (bullish) */
function classifyFlow(tx: WhaleTransaction): "inflow" | "outflow" | "transfer" {
  const toExchange =
    tx.to?.ownerType === "exchange" ||
    tx.transactionType === "exchange_deposit" ||
    (tx.to?.owner && /exchange|binance|coinbase|kraken|bitfinex|huobi|okx|bybit|kucoin|gemini/i.test(tx.to.owner));
  const fromExchange =
    tx.from?.ownerType === "exchange" ||
    tx.transactionType === "exchange_withdrawal" ||
    (tx.from?.owner && /exchange|binance|coinbase|kraken|bitfinex|huobi|okx|bybit|kucoin|gemini/i.test(tx.from.owner));

  if (toExchange && !fromExchange) return "inflow";
  if (fromExchange && !toExchange) return "outflow";
  return "transfer";
}

const FLOW_CONFIG = {
  inflow: {
    icon: ArrowDownToLine,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-l-red-500",
    label: "Exchange Inflow",
  },
  outflow: {
    icon: ArrowUpFromLine,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-l-green-500",
    label: "Exchange Outflow",
  },
  transfer: {
    icon: ArrowRightLeft,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-l-blue-500",
    label: "Transfer",
  },
} as const;

const MIN_AMOUNT_OPTIONS = [
  { label: "All", value: 0 },
  { label: "$100K+", value: 100_000 },
  { label: "$500K+", value: 500_000 },
  { label: "$1M+", value: 1_000_000 },
  { label: "$10M+", value: 10_000_000 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function WhaleAlertFeed({ className }: { className?: string }) {
  const [alerts, setAlerts] = useState<WhaleTransaction[]>([]);
  const [summary, setSummary] = useState<WhaleAlertsResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [coinFilter, setCoinFilter] = useState<CoinFilter>("ALL");
  const [minAmount, setMinAmount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/whale-alerts?limit=50");
      if (!res.ok) return;
      const data: WhaleAlertsResponse = await res.json();

      const incoming = data.alerts || [];
      const currentIds = incoming.map((a) => a.id || a.hash);
      const freshIds = currentIds.filter((id) => !prevIdsRef.current.includes(id));
      if (freshIds.length > 0) {
        setNewIds(new Set(freshIds));
        setTimeout(() => setNewIds(new Set()), 3000);
      }
      prevIdsRef.current = currentIds;

      setAlerts(incoming);
      setSummary(data.summary || null);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(fetchAlerts, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, fetchAlerts]);

  /* Filtered list */
  const filtered = alerts.filter((tx) => {
    if (coinFilter !== "ALL" && tx.symbol?.toUpperCase() !== coinFilter) return false;
    if (minAmount > 0 && (tx.amountUsd || 0) < minAmount) return false;
    return true;
  });

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            Live Whale Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse border-l-2 border-border pl-4 py-3">
              <div className="h-4 w-40 bg-surface-tertiary rounded mb-2" />
              <div className="h-3 w-64 bg-surface-tertiary rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🐋</span>
            <span>Live Whale Feed</span>
            <span className={cn("live-dot ml-1", paused && "opacity-30")} />
          </CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Coin filter */}
            {(["ALL", "BTC", "ETH"] as CoinFilter[]).map((c) => (
              <Button
                key={c}
                variant={coinFilter === c ? "primary" : "outline"}
                size="sm"
                onClick={() => setCoinFilter(c)}
              >
                {c}
              </Button>
            ))}

            {/* Min amount filter */}
            <div className="relative">
              <select
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="text-xs rounded-md border border-border bg-(--color-surface) text-text-primary px-2 py-1.5 pr-6 appearance-none cursor-pointer"
                aria-label="Minimum amount filter"
              >
                {MIN_AMOUNT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Filter className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary pointer-events-none" />
            </div>

            {/* Pause / resume */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>

            {/* Manual refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAlerts}
              aria-label="Refresh now"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary bar */}
        {summary && (
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-secondary">
            <span>{summary.totalTransactions} transactions</span>
            <span>Total: {formatUsd(summary.totalValueUsd)}</span>
            <span className="text-red-500">↓ {summary.exchangeDeposits} deposits</span>
            <span className="text-green-500">↑ {summary.exchangeWithdrawals} withdrawals</span>
            {lastUpdated && <span className="ml-auto">Updated {timeAgo(lastUpdated)}</span>}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">
            No whale alerts matching the current filters.
          </p>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((tx) => {
              const flow = classifyFlow(tx);
              const config = FLOW_CONFIG[flow];
              const Icon = config.icon;
              const isNew = newIds.has(tx.id || tx.hash);

              return (
                <div
                  key={tx.id || tx.hash}
                  className={cn(
                    "border-l-3 pl-4 py-3 rounded-r-md transition-all duration-500",
                    config.border,
                    isNew && "bg-accent/5 animate-pulse",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("shrink-0 p-1 rounded", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-text-primary">
                            {formatAmount(tx.amount)} {tx.symbol}
                          </span>
                          <Badge variant="default" className="text-[10px]">
                            {formatUsd(tx.amountUsd)}
                          </Badge>
                          <Badge
                            variant="default"
                            className={cn(
                              "text-[10px]",
                              flow === "inflow" && "bg-red-500/10 text-red-600",
                              flow === "outflow" && "bg-green-500/10 text-green-600",
                              flow === "transfer" && "bg-blue-500/10 text-blue-600",
                            )}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5 truncate">
                          <span className="font-mono">
                            {tx.from?.owner || truncateAddress(tx.from?.address)}
                          </span>
                          <span className="mx-1">→</span>
                          <span className="font-mono">
                            {tx.to?.owner || truncateAddress(tx.to?.address)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-tertiary shrink-0 whitespace-nowrap">
                      {timeAgo(tx.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
