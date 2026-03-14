/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Repeat,
  Percent,
} from "lucide-react";

// ---------- Types ------------------------------------------------------------

interface CoinPrice {
  usd: number;
  eur?: number;
  gbp?: number;
  usd_24h_change?: number;
}

type PriceMap = Record<string, CoinPrice>;

type FiatCode = "usd" | "eur" | "gbp";

// ---------- Constants --------------------------------------------------------

const POPULAR_COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", color: "#F7931A" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { id: "solana", symbol: "SOL", name: "Solana", color: "#00FFA3" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", color: "#F3BA2F" },
  { id: "ripple", symbol: "XRP", name: "XRP", color: "#00AAE4" },
  { id: "cardano", symbol: "ADA", name: "Cardano", color: "#0033AD" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", color: "#C2A633" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", color: "#E6007A" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", color: "#E84142" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", color: "#2A5ADA" },
  { id: "tron", symbol: "TRX", name: "TRON", color: "#FF0013" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", color: "#BFBBBB" },
  { id: "near", symbol: "NEAR", name: "NEAR Protocol", color: "#00EC97" },
  { id: "sui", symbol: "SUI", name: "Sui", color: "#4DA2FF" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", color: "#FF007A" },
] as const;

const FIAT_CURRENCIES = [
  { code: "usd" as FiatCode, symbol: "$", name: "US Dollar" },
  { code: "eur" as FiatCode, symbol: "€", name: "Euro" },
  { code: "gbp" as FiatCode, symbol: "£", name: "British Pound" },
] as const;

const QUICK_SELECT = ["bitcoin", "ethereum", "solana", "binancecoin"] as const;

const PRESET_AMOUNTS = [
  { label: "$100", value: 100 },
  { label: "$500", value: 500 },
  { label: "$1,000", value: 1000 },
  { label: "$5,000", value: 5000 },
  { label: "$10,000", value: 10000 },
] as const;

const AUTO_REFRESH_INTERVAL = 60_000; // 1 minute

// ---------- Component --------------------------------------------------------

export default function CryptoCalculator() {
  const [prices, setPrices] = useState<PriceMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Calculator state
  const [fromCoin, setFromCoin] = useState("bitcoin");
  const [toCurrency, setToCurrency] = useState<FiatCode>("usd");
  const [cryptoAmount, setCryptoAmount] = useState("1");
  const [fiatAmount, setFiatAmount] = useState("");
  const [activeField, setActiveField] = useState<"crypto" | "fiat">("crypto");
  const [copied, setCopied] = useState(false);

  // Crypto-to-crypto conversion
  const [mode, setMode] = useState<"crypto-fiat" | "crypto-crypto">("crypto-fiat");
  const [toCoin, setToCoin] = useState("ethereum");
  const [toCoinAmount, setToCoinAmount] = useState("");

  // Investment calculator
  const [showInvestment, setShowInvestment] = useState(false);
  const [investAmount, setInvestAmount] = useState("1000");

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch prices
  const fetchPrices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const coinIds = POPULAR_COINS.map((c) => c.id).join(",");
      const res = await fetch(`/api/prices?coins=${coinIds}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = (await res.json()) as PriceMap;
      setPrices(data);
      setLastUpdated(new Date());
    } catch {
      if (!silent) setError("Unable to load prices. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchPrices();
    refreshIntervalRef.current = setInterval(() => fetchPrices(true), AUTO_REFRESH_INTERVAL);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchPrices]);

  // Current rate
  const rate = useMemo(() => {
    if (!prices?.[fromCoin]) return null;
    const coinData = prices[fromCoin];
    return coinData[toCurrency] ?? coinData.usd ?? null;
  }, [prices, fromCoin, toCurrency]);

  // Crypto-to-crypto rate
  const cryptoCryptoRate = useMemo(() => {
    if (!prices?.[fromCoin] || !prices[toCoin]) return null;
    const fromUsd = prices[fromCoin].usd;
    const toUsd = prices[toCoin].usd;
    if (!fromUsd || !toUsd) return null;
    return fromUsd / toUsd;
  }, [prices, fromCoin, toCoin]);

  // Compute conversion
  useEffect(() => {
    if (mode === "crypto-fiat") {
      if (rate === null) return;
      if (activeField === "crypto") {
        const val = parseFloat(cryptoAmount);
        if (!isNaN(val) && val >= 0) {
          setFiatAmount((val * rate).toFixed(2));
        } else {
          setFiatAmount("");
        }
      } else {
        const val = parseFloat(fiatAmount);
        if (!isNaN(val) && val >= 0 && rate > 0) {
          setCryptoAmount(
            (val / rate).toFixed(8).replace(/0+$/, "").replace(/\.$/, ""),
          );
        } else {
          setCryptoAmount("");
        }
      }
    } else {
      if (cryptoCryptoRate === null) return;
      const val = parseFloat(cryptoAmount);
      if (!isNaN(val) && val >= 0) {
        setToCoinAmount(
          (val * cryptoCryptoRate)
            .toFixed(8)
            .replace(/0+$/, "")
            .replace(/\.$/, ""),
        );
      } else {
        setToCoinAmount("");
      }
    }
  }, [cryptoAmount, fiatAmount, rate, activeField, mode, cryptoCryptoRate]);

  // Swap
  const handleSwap = () => {
    if (mode === "crypto-fiat") {
      setActiveField((prev) => (prev === "crypto" ? "fiat" : "crypto"));
    } else {
      const temp = fromCoin;
      setFromCoin(toCoin);
      setToCoin(temp);
    }
  };

  // Copy result
  const handleCopy = () => {
    const text =
      mode === "crypto-fiat"
        ? `${cryptoAmount} ${selectedCoin?.symbol} = ${selectedFiat?.symbol}${fiatAmount}`
        : `${cryptoAmount} ${selectedCoin?.symbol} = ${toCoinAmount} ${POPULAR_COINS.find((c) => c.id === toCoin)?.symbol}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preset fiat amount → crypto
  const handlePreset = (amount: number) => {
    if (rate && rate > 0) {
      setActiveField("fiat");
      setFiatAmount(amount.toString());
    }
  };

  const selectedCoin = POPULAR_COINS.find((c) => c.id === fromCoin);
  const selectedFiat = FIAT_CURRENCIES.find((c) => c.code === toCurrency);
  const change24h = prices?.[fromCoin]?.usd_24h_change ?? null;

  // Investment calculation
  const investmentCalc = useMemo(() => {
    if (!prices?.[fromCoin]) return null;
    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount <= 0) return null;
    const price = prices[fromCoin].usd;
    if (!price) return null;
    const change = prices[fromCoin].usd_24h_change ?? 0;
    const coinsReceived = amount / price;
    const value24hAgo = amount / (price / (1 + change / 100));
    const pnl24h = amount - value24hAgo;
    return {
      coins: coinsReceived,
      pnl24h,
      pnl24hPct: change,
      weekProjection: amount * (1 + change / 100) ** 7,
      monthProjection: amount * (1 + change / 100) ** 30,
    };
  }, [prices, fromCoin, investAmount]);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={mode === "crypto-fiat" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("crypto-fiat")}
          className="gap-1.5"
        >
          <DollarSign className="h-3.5 w-3.5" />
          Crypto → Fiat
        </Button>
        <Button
          variant={mode === "crypto-crypto" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("crypto-crypto")}
          className="gap-1.5"
        >
          <Repeat className="h-3.5 w-3.5" />
          Crypto → Crypto
        </Button>
      </div>

      {/* Calculator Card */}
      <Card className="p-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-text-secondary mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchPrices()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Quick select coins */}
            <div className="flex flex-wrap gap-2 mb-6">
              {QUICK_SELECT.map((coinId) => {
                const coin = POPULAR_COINS.find((c) => c.id === coinId);
                if (!coin) return null;
                return (
                  <Button
                    key={coinId}
                    variant={fromCoin === coinId ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFromCoin(coinId);
                      setActiveField("crypto");
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: coin.color }}
                    />
                    {coin.symbol}
                  </Button>
                );
              })}
            </div>

            {/* Crypto input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "crypto-fiat" ? "Cryptocurrency" : "From"}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cryptoAmount}
                  onFocus={() => setActiveField("crypto")}
                  onChange={(e) => {
                    setActiveField("crypto");
                    setCryptoAmount(e.target.value);
                  }}
                  className={cn(
                    "flex-1 rounded-lg border border-border bg-(--color-surface)",
                    "px-4 py-3 text-lg font-medium text-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                    "placeholder:text-text-tertiary",
                  )}
                  placeholder="0.00"
                />
                <select
                  value={fromCoin}
                  onChange={(e) => setFromCoin(e.target.value)}
                  className={cn(
                    "w-36 rounded-lg border border-border bg-(--color-surface)",
                    "px-3 py-3 font-medium text-text-primary",
                    "focus:outline-none focus:ring-2 focus:ring-accent",
                  )}
                >
                  {POPULAR_COINS.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center my-2">
              <button
                onClick={handleSwap}
                className={cn(
                  "p-2 rounded-full border border-border",
                  "bg-surface-secondary hover:bg-surface-tertiary",
                  "transition-colors hover:scale-110 active:scale-95",
                )}
                aria-label="Swap conversion direction"
              >
                <ArrowUpDown className="h-5 w-5 text-accent" />
              </button>
            </div>

            {/* Second input (fiat or crypto) */}
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "crypto-fiat" ? "Fiat Currency" : "To"}
              </label>
              <div className="flex gap-2">
                {mode === "crypto-fiat" ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={fiatAmount}
                      onFocus={() => setActiveField("fiat")}
                      onChange={(e) => {
                        setActiveField("fiat");
                        setFiatAmount(e.target.value);
                      }}
                      className={cn(
                        "flex-1 rounded-lg border border-border bg-(--color-surface)",
                        "px-4 py-3 text-lg font-medium text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                        "placeholder:text-text-tertiary",
                      )}
                      placeholder="0.00"
                    />
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value as FiatCode)}
                      className={cn(
                        "w-36 rounded-lg border border-border bg-(--color-surface)",
                        "px-3 py-3 font-medium text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-accent",
                      )}
                    >
                      {FIAT_CURRENCIES.map((fiat) => (
                        <option key={fiat.code} value={fiat.code}>
                          {fiat.code.toUpperCase()} ({fiat.symbol})
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      readOnly
                      value={toCoinAmount}
                      className={cn(
                        "flex-1 rounded-lg border border-border bg-surface-secondary",
                        "px-4 py-3 text-lg font-medium text-text-primary",
                        "cursor-default",
                      )}
                      placeholder="0.00"
                    />
                    <select
                      value={toCoin}
                      onChange={(e) => setToCoin(e.target.value)}
                      className={cn(
                        "w-36 rounded-lg border border-border bg-(--color-surface)",
                        "px-3 py-3 font-medium text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-accent",
                      )}
                    >
                      {POPULAR_COINS.filter((c) => c.id !== fromCoin).map(
                        (coin) => (
                          <option key={coin.id} value={coin.id}>
                            {coin.symbol}
                          </option>
                        ),
                      )}
                    </select>
                  </>
                )}
              </div>
            </div>

            {/* Preset amounts (fiat mode only) */}
            {mode === "crypto-fiat" && (
              <div className="flex flex-wrap gap-2 mt-4">
                {PRESET_AMOUNTS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium",
                      "border border-border bg-surface-secondary",
                      "hover:bg-surface-tertiary transition-colors",
                      "text-text-secondary",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Rate display + Copy */}
            <div className="mt-6 p-4 rounded-lg bg-surface-secondary border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">
                    Current Rate
                  </p>
                  {mode === "crypto-fiat" && rate !== null && selectedCoin && selectedFiat ? (
                    <p className="text-lg font-semibold text-text-primary">
                      1 {selectedCoin.symbol} = {selectedFiat.symbol}
                      {rate.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: rate < 1 ? 6 : 2,
                      })}
                    </p>
                  ) : mode === "crypto-crypto" && cryptoCryptoRate !== null ? (
                    <p className="text-lg font-semibold text-text-primary">
                      1 {selectedCoin?.symbol} ={" "}
                      {cryptoCryptoRate.toFixed(
                        cryptoCryptoRate < 1 ? 6 : cryptoCryptoRate < 100 ? 4 : 2,
                      )}{" "}
                      {POPULAR_COINS.find((c) => c.id === toCoin)?.symbol}
                    </p>
                  ) : (
                    <p className="text-text-tertiary">—</p>
                  )}
                  {change24h !== null && (
                    <div className="flex items-center gap-1 mt-1">
                      {change24h > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      ) : change24h < 0 ? (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      ) : null}
                      <p
                        className={cn(
                          "text-sm font-medium",
                          change24h > 0
                            ? "text-green-500 dark:text-green-400"
                            : change24h < 0
                              ? "text-red-500 dark:text-red-400"
                              : "text-text-secondary",
                        )}
                      >
                        {change24h > 0 ? "+" : ""}
                        {change24h.toFixed(2)}% (24h)
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "p-2 rounded-lg border border-border",
                      "hover:bg-surface-tertiary transition-colors",
                    )}
                    aria-label="Copy conversion result"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-text-tertiary" />
                    )}
                  </button>
                  <button
                    onClick={() => fetchPrices(true)}
                    className={cn(
                      "p-2 rounded-lg border border-border",
                      "hover:bg-surface-tertiary transition-colors",
                    )}
                    aria-label="Refresh prices"
                  >
                    <RefreshCw className="h-4 w-4 text-text-tertiary" />
                  </button>
                </div>
              </div>
              {lastUpdated && (
                <p className="text-[10px] text-text-tertiary mt-2">
                  Updated {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 60s
                </p>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Investment Calculator Toggle */}
      {prices && (
        <Card className="p-6">
          <button
            onClick={() => setShowInvestment(!showInvestment)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-lg font-semibold text-text-primary">
                Investment Simulator
              </h2>
            </div>
            <Badge className="text-xs">
              {showInvestment ? "Hide" : "Show"}
            </Badge>
          </button>

          {showInvestment && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-text-secondary">
                See what you&apos;d get if you invested today in{" "}
                {selectedCoin?.name ?? "this coin"}.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className={cn(
                      "w-full rounded-lg border border-border bg-(--color-surface)",
                      "pl-8 pr-4 py-3 text-lg font-medium text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent",
                    )}
                    placeholder="1000"
                  />
                </div>
                <div className="flex gap-1">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setInvestAmount(amt.toString())}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        "border border-border",
                        "hover:bg-surface-secondary transition-colors",
                        investAmount === amt.toString()
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "text-text-tertiary",
                      )}
                    >
                      ${amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {investmentCalc && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">
                      You&apos;d receive
                    </p>
                    <p className="text-lg font-bold text-text-primary">
                      {investmentCalc.coins < 1
                        ? investmentCalc.coins.toFixed(6)
                        : investmentCalc.coins.toFixed(4)}{" "}
                      <span className="text-sm font-normal text-text-tertiary">
                        {selectedCoin?.symbol}
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">
                      24h PnL (if bought yesterday)
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        investmentCalc.pnl24h > 0
                          ? "text-green-500"
                          : investmentCalc.pnl24h < 0
                            ? "text-red-500"
                            : "text-text-primary",
                      )}
                    >
                      {investmentCalc.pnl24h > 0 ? "+" : ""}$
                      {Math.abs(investmentCalc.pnl24h).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">
                      7d projection*
                    </p>
                    <p className="text-lg font-bold text-text-primary">
                      ${investmentCalc.weekProjection.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">
                      30d projection*
                    </p>
                    <p className="text-lg font-bold text-text-primary">
                      ${investmentCalc.monthProjection.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-text-tertiary">
                * Projections extrapolate the current 24h trend. Not financial
                advice. Past performance does not indicate future results.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Quick Rates Table */}
      {prices && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-4">
            Live Rates
          </h2>
          <div className="divide-y divide-border">
            {POPULAR_COINS.map((coin) => {
              const coinData = prices[coin.id];
              if (!coinData) return null;
              const price = coinData[toCurrency] ?? coinData.usd ?? 0;
              const fiatSym =
                FIAT_CURRENCIES.find((f) => f.code === toCurrency)?.symbol ?? "$";
              const ch = coinData.usd_24h_change ?? null;
              return (
                <button
                  key={coin.id}
                  onClick={() => {
                    setFromCoin(coin.id);
                    setActiveField("crypto");
                  }}
                  className={cn(
                    "flex items-center justify-between w-full py-3 px-2 text-left rounded-lg",
                    "hover:bg-surface-secondary transition-colors",
                    fromCoin === coin.id && "bg-surface-secondary",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: coin.color }}
                    />
                    <span className="font-medium text-text-primary">
                      {coin.symbol}
                    </span>
                    <span className="text-text-tertiary font-normal text-sm hidden sm:inline">
                      {coin.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium text-text-primary">
                      {fiatSym}
                      {price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: price < 1 ? 6 : 2,
                      })}
                    </span>
                    {ch !== null && (
                      <span
                        className={cn(
                          "text-xs font-medium min-w-[54px] text-right",
                          ch > 0
                            ? "text-green-500 dark:text-green-400"
                            : ch < 0
                              ? "text-red-500 dark:text-red-400"
                              : "text-text-tertiary",
                        )}
                      >
                        {ch > 0 ? "▲" : ch < 0 ? "▼" : ""}
                        {Math.abs(ch).toFixed(1)}%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
