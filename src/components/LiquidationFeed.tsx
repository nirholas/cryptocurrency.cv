"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/format";
import { Volume2, VolumeOff, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Liquidation {
  id: string;
  exchange: string;
  symbol: string;
  side: "long" | "short";
  amount: number;
  price: number;
  timestamp: number;
}

interface LiquidationTotals {
  totalLongs: number;
  totalShorts: number;
  totalUsd: number;
}

interface LiquidationData {
  recentEvents: Liquidation[];
  totals: LiquidationTotals;
  source: string;
  timestamp: number;
}

export default function LiquidationFeed() {
  const [data, setData] = useState<LiquidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Liquidation[]>([]);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create a simple click sound using AudioContext
  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  const fetchLiquidations = useCallback(async () => {
    try {
      const res = await fetch("/api/liquidations");
      if (!res.ok) return;
      const json = (await res.json()) as LiquidationData;
      setData(json);

      const events = json.recentEvents ?? [];
      const newIds = new Set(events.map((e) => e.id));
      const freshIds = new Set<string>();

      for (const id of newIds) {
        if (!prevIdsRef.current.has(id)) {
          freshIds.add(id);
        }
      }

      // Play sound for big liquidations > $1M
      if (freshIds.size > 0) {
        const hasBigLiq = events.some(
          (e) => freshIds.has(e.id) && e.amount > 1_000_000,
        );
        if (hasBigLiq) playSound();
      }

      setAnimatingIds(freshIds);
      setVisibleItems(events.slice(0, 50));
      prevIdsRef.current = newIds;

      // Clear animation flags after transition
      setTimeout(() => setAnimatingIds(new Set()), 600);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [playSound]);

  useEffect(() => {
    fetchLiquidations();
    const interval = setInterval(fetchLiquidations, 10_000);
    return () => clearInterval(interval);
  }, [fetchLiquidations]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Liquidation Feed
        </CardTitle>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-sm text-text-secondary">
              24h: {formatLargeNumber(data.totals.totalUsd, { prefix: "$" })}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
            className="h-8 w-8"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeOff className="h-4 w-4 text-text-tertiary" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Running totals bar */}
        {data && (
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-red-500">
              Longs: {formatLargeNumber(data.totals.totalLongs, { prefix: "$" })}
            </span>
            <span className="text-green-500">
              Shorts: {formatLargeNumber(data.totals.totalShorts, { prefix: "$" })}
            </span>
          </div>
        )}

        {/* Liquidation events */}
        <div className="max-h-[400px] space-y-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))
          ) : visibleItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-tertiary">
              No recent liquidations
            </p>
          ) : (
            visibleItems.map((liq) => (
              <div
                key={liq.id}
                className={cn(
                  "flex items-center justify-between rounded px-3 py-1.5 text-sm transition-all duration-500",
                  liq.side === "long"
                    ? "bg-red-500/5 text-red-600 dark:text-red-400"
                    : "bg-green-500/5 text-green-600 dark:text-green-400",
                  animatingIds.has(liq.id) &&
                    "animate-in slide-in-from-right-5 fade-in-0",
                  liq.amount > 1_000_000 && "font-semibold",
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{liq.side === "long" ? "💥" : "📉"}</span>
                  <span>
                    {liq.side === "long" ? "Long" : "Short"} Liquidated
                  </span>
                  <span className="font-mono font-semibold">
                    {formatLargeNumber(liq.amount, { prefix: "$" })}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-text-secondary">
                  <span className="font-medium">{liq.symbol}</span>
                  <span className="text-xs">{liq.exchange}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
