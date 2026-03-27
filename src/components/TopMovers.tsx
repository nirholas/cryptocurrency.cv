/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { TrendingUp, TrendingDown, ArrowRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Mover {
  id: string;
  symbol: string;
  price: number;
  change: number;
}

const COINS = [
  "bitcoin", "ethereum", "solana", "binancecoin", "ripple",
  "cardano", "dogecoin", "polkadot", "avalanche-2", "chainlink",
  "uniswap", "litecoin", "near", "aptos", "sui",
] as const;

const SYMBOLS: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB",
  ripple: "XRP", cardano: "ADA", dogecoin: "DOGE", polkadot: "DOT",
  "avalanche-2": "AVAX", chainlink: "LINK", uniswap: "UNI",
  litecoin: "LTC", near: "NEAR", aptos: "APT", sui: "SUI",
};

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

export default function TopMovers() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const t = useTranslations("topMovers");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/prices?coins=${COINS.join(",")}`);
      if (!res.ok) return;
      const data = await res.json();

      const parsed: Mover[] = COINS.map((id) => ({
        id,
        symbol: SYMBOLS[id] || id.toUpperCase(),
        price: data[id]?.usd ?? 0,
        change: data[id]?.usd_24h_change ?? 0,
      })).filter((c) => c.price > 0);

      const sorted = [...parsed].sort((a, b) => b.change - a.change);
      setGainers(sorted.filter((c) => c.change > 0).slice(0, 5));
      setLosers(sorted.filter((c) => c.change < 0).slice(-5).reverse());
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (gainers.length === 0 && losers.length === 0) return null;

  const items = tab === "gainers" ? gainers : losers;

  return (
    <section className="border-b border-border">
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold font-serif">{t("title")}</h2>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              onClick={() => setTab("gainers")}
              className={cn(
                "px-4 py-1.5 font-medium transition-colors cursor-pointer",
                tab === "gainers"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-text-secondary hover:bg-surface-secondary",
              )}
            >
              {t("gainers")}
            </button>
            <button
              onClick={() => setTab("losers")}
              className={cn(
                "px-4 py-1.5 font-medium transition-colors cursor-pointer border-l border-border",
                tab === "losers"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "text-text-secondary hover:bg-surface-secondary",
              )}
            >
              {t("losers")}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {items.map((coin) => {
            const positive = coin.change >= 0;
            return (
              <Link
                key={coin.id}
                href={`/coin/${coin.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-(--color-surface) p-4 transition-all hover:border-text-tertiary hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {coin.symbol}
                  </p>
                  <p className="text-xs text-text-tertiary tabular-nums mt-0.5">
                    {formatPrice(coin.price)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold tabular-nums",
                    positive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {positive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(coin.change).toFixed(2)}%
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/markets"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {t("viewAllMarkets")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
