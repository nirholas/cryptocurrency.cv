"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Holding {
  id: string;
  coinId: string;
  coinName: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  addedAt: string;
}

interface HoldingUpdate {
  amount?: number;
  buyPrice?: number;
}

interface PriceEntry {
  usd: number;
  usd_24h_change?: number;
}

interface PortfolioContextValue {
  holdings: Holding[];
  prices: Record<string, PriceEntry>;
  addHolding: (coinId: string, coinName: string, symbol: string, amount: number, buyPrice: number) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, updates: HoldingUpdate) => void;
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

const STORAGE_KEY = "fcn-portfolio";
const PRICE_POLL_MS = 60_000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadHoldings(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Holding[]) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: Holding[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch { /* quota exceeded — silent */ }
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({});
  const [mounted, setMounted] = useState(false);

  /* hydrate from localStorage once */
  useEffect(() => {
    setHoldings(loadHoldings());
    setMounted(true);
  }, []);

  /* persist whenever holdings change (skip first render before hydration) */
  useEffect(() => {
    if (mounted) saveHoldings(holdings);
  }, [holdings, mounted]);

  /* poll live prices for held coins */
  useEffect(() => {
    if (holdings.length === 0) return;

    const coinIds = Array.from(new Set(holdings.map((h) => h.coinId)));

    async function fetchPrices() {
      try {
        const res = await fetch(`/api/prices?coins=${coinIds.join(",")}`);
        if (res.ok) {
          const data = (await res.json()) as Record<string, PriceEntry>;
          setPrices(data);
        }
      } catch { /* network error — keep stale prices */ }
    }

    fetchPrices();
    const timer = setInterval(fetchPrices, PRICE_POLL_MS);
    return () => clearInterval(timer);
  }, [holdings]);

  /* ---- mutations ---- */

  const addHolding = useCallback(
    (coinId: string, coinName: string, symbol: string, amount: number, buyPrice: number) => {
      const holding: Holding = {
        id: genId(),
        coinId,
        coinName,
        symbol: symbol.toUpperCase(),
        amount,
        buyPrice,
        addedAt: new Date().toISOString(),
      };
      setHoldings((prev) => [...prev, holding]);
    },
    [],
  );

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHolding = useCallback((id: string, updates: HoldingUpdate) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  }, []);

  /* ---- derived values ---- */

  const { totalValue, totalCost, totalPnL, totalPnLPercent } = useMemo(() => {
    let value = 0;
    let cost = 0;
    for (const h of holdings) {
      const p = prices[h.coinId];
      const currentPrice = p?.usd ?? h.buyPrice;
      value += h.amount * currentPrice;
      cost += h.amount * h.buyPrice;
    }
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { totalValue: value, totalCost: cost, totalPnL: pnl, totalPnLPercent: pnlPct };
  }, [holdings, prices]);

  const ctx = useMemo<PortfolioContextValue>(
    () => ({
      holdings,
      prices,
      addHolding,
      removeHolding,
      updateHolding,
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
    }),
    [holdings, prices, addHolding, removeHolding, updateHolding, totalValue, totalCost, totalPnL, totalPnLPercent],
  );

  return <PortfolioContext.Provider value={ctx}>{children}</PortfolioContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within <PortfolioProvider>");
  return ctx;
}
