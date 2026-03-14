"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Download,
  DollarSign,
  Pencil,
  PieChart,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { usePortfolio, type Holding } from "@/components/portfolio";
import { AddHoldingModal } from "@/components/AddHoldingModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  // Small values: show up to 6 decimals
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return fmtUsd(n);
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function pnlColor(v: number): string {
  if (v > 0) return "text-green-500";
  if (v < 0) return "text-red-500";
  return "text-text-secondary";
}

function pnlBg(v: number): string {
  if (v > 0) return "bg-green-500/10";
  if (v < 0) return "bg-red-500/10";
  return "bg-surface-secondary";
}

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface EnrichedHolding extends Holding {
  currentPrice: number;
  value: number;
  cost: number;
  pnlDollar: number;
  pnlPct: number;
  allocation: number;
}

type SortKey = "coin" | "amount" | "buyPrice" | "currentPrice" | "value" | "pnlDollar" | "pnlPct";
type SortDir = "asc" | "desc";

/* ================================================================== */
/*  Allocation Donut Chart (SVG)                                       */
/* ================================================================== */

const CHART_COLORS = [
  "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
  "#a855f7", "#f43f5e", "#22d3ee", "#84cc16", "#e879f9",
];

interface Slice {
  label: string;
  value: number;
  pct: number;
  color: string;
}

function AllocationChart({
  holdings,
  totalValue,
}: {
  holdings: EnrichedHolding[];
  totalValue: number;
}) {
  const slices = useMemo<Slice[]>(() => {
    if (totalValue === 0) return [];
    const grouped: Record<string, { label: string; value: number }> = {};
    for (const h of holdings) {
      if (!grouped[h.coinId]) {
        grouped[h.coinId] = { label: h.symbol, value: 0 };
      }
      grouped[h.coinId].value += h.value;
    }
    return Object.values(grouped)
      .sort((a, b) => b.value - a.value)
      .map((e, i) => ({
        label: e.label,
        value: e.value,
        pct: (e.value / totalValue) * 100,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [holdings, totalValue]);

  if (slices.length === 0) return null;

  // SVG donut chart
  const size = 160;
  const radius = 60;
  const strokeWidth = 28;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePct = 0;
  const segments = slices.map((s) => {
    const offset = circumference * (1 - cumulativePct / 100);
    const dash = (s.pct / 100) * circumference;
    cumulativePct += s.pct;
    return { ...s, offset, dash };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
            >
              <title>{seg.label}: {fmtUsd(seg.value)} ({seg.pct.toFixed(1)}%)</title>
            </circle>
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-text-secondary">Assets</div>
            <div className="text-lg font-bold tabular-nums">{slices.length}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        {slices.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="font-medium">{s.label}</span>
            <span className="text-text-secondary">{s.pct.toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Value Bar Chart (SVG — portfolio value by coin)                    */
/* ================================================================== */

function ValueBarChart({ holdings }: { holdings: EnrichedHolding[] }) {
  const grouped = useMemo(() => {
    const map: Record<string, { label: string; value: number; pnlPct: number }> = {};
    for (const h of holdings) {
      if (!map[h.coinId]) {
        map[h.coinId] = { label: h.symbol, value: 0, pnlPct: 0 };
      }
      map[h.coinId].value += h.value;
      map[h.coinId].pnlPct = h.pnlPct;
    }
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [holdings]);

  if (grouped.length === 0) return null;

  const maxVal = Math.max(...grouped.map((g) => g.value));
  const barHeight = 24;
  const gap = 8;
  const labelWidth = 60;
  const valueWidth = 80;
  const chartWidth = 500;
  const chartHeight = grouped.length * (barHeight + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${labelWidth + chartWidth + valueWidth + 16} ${chartHeight + 8}`}
        className="w-full min-w-[400px]"
        aria-label="Portfolio value by coin"
      >
        {grouped.map((g, i) => {
          const y = i * (barHeight + gap);
          const barW = maxVal > 0 ? (g.value / maxVal) * chartWidth : 0;
          const barColor = g.pnlPct >= 0 ? "#16c784" : "#ea3943";

          return (
            <g key={g.label}>
              <text
                x={labelWidth - 4}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="600"
                fill="var(--color-text-primary, #fff)"
              >
                {g.label}
              </text>
              <rect
                x={labelWidth}
                y={y}
                width={barW}
                height={barHeight}
                fill={barColor}
                opacity={0.75}
                rx={4}
              >
                <title>{g.label}: {fmtUsd(g.value)}</title>
              </rect>
              <text
                x={labelWidth + barW + 6}
                y={y + barHeight / 2 + 4}
                fontSize="10"
                fill="var(--color-text-secondary, #888)"
              >
                {fmtCompact(g.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  Sortable Column Header                                             */
/* ================================================================== */

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = "right",
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = currentSort === sortKey;
  return (
    <th className={cn("px-4 py-3 font-medium", align === "right" ? "text-right" : "text-left", className)}>
      <button
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
      >
        {label}
        {active ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

/* ================================================================== */
/*  Inline Edit Row                                                    */
/* ================================================================== */

function HoldingRow({ holding }: { holding: EnrichedHolding }) {
  const { removeHolding, updateHolding } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(String(holding.amount));
  const [editBuyPrice, setEditBuyPrice] = useState(String(holding.buyPrice));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = useCallback(() => {
    const a = parseFloat(editAmount);
    const p = parseFloat(editBuyPrice);
    if (!Number.isNaN(a) && a > 0 && !Number.isNaN(p) && p > 0) {
      updateHolding(holding.id, { amount: a, buyPrice: p });
    }
    setEditing(false);
  }, [editAmount, editBuyPrice, holding.id, updateHolding]);

  const handleCancelEdit = useCallback(() => {
    setEditAmount(String(holding.amount));
    setEditBuyPrice(String(holding.buyPrice));
    setEditing(false);
  }, [holding.amount, holding.buyPrice]);

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface-secondary transition-colors">
      {/* Coin */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", pnlBg(holding.pnlDollar))}>
            {holding.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-medium">{holding.coinName}</div>
            <div className="text-xs text-text-secondary">{holding.symbol}</div>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right tabular-nums">
        {editing ? (
          <input
            type="number"
            step="any"
            min="0"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-24 rounded border border-border bg-(--color-surface) px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
          />
        ) : (
          holding.amount.toLocaleString("en-US", { maximumFractionDigits: 8 })
        )}
      </td>

      {/* Avg Buy Price */}
      <td className="px-4 py-3 text-right tabular-nums">
        {editing ? (
          <input
            type="number"
            step="any"
            min="0"
            value={editBuyPrice}
            onChange={(e) => setEditBuyPrice(e.target.value)}
            className="w-28 rounded border border-border bg-(--color-surface) px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent"
          />
        ) : (
          fmtUsd(holding.buyPrice)
        )}
      </td>

      {/* Current Price */}
      <td className="px-4 py-3 text-right tabular-nums">{fmtUsd(holding.currentPrice)}</td>

      {/* Value */}
      <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtUsd(holding.value)}</td>

      {/* Allocation */}
      <td className="px-4 py-3 text-right tabular-nums">
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(holding.allocation, 100)}%` }}
            />
          </div>
          <span className="text-xs w-10 text-right">{holding.allocation.toFixed(1)}%</span>
        </div>
      </td>

      {/* P&L ($) */}
      <td className={cn("px-4 py-3 text-right tabular-nums font-medium", pnlColor(holding.pnlDollar))}>
        {holding.pnlDollar >= 0 ? "+" : ""}{fmtUsd(holding.pnlDollar)}
      </td>

      {/* P&L (%) */}
      <td className={cn("px-4 py-3 text-right tabular-nums font-medium", pnlColor(holding.pnlPct))}>
        <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs", pnlBg(holding.pnlPct))}>
          {holding.pnlPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {fmtPct(holding.pnlPct)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} className="rounded p-1.5 hover:bg-green-500/10 text-green-500 transition-colors" title="Save">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={handleCancelEdit} className="rounded p-1.5 hover:bg-surface-secondary transition-colors" title="Cancel">
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1.5 hover:bg-surface-secondary transition-colors"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => removeHolding(holding.id)}
                    className="rounded p-1.5 hover:bg-red-500/10 text-red-500 transition-colors"
                    title="Confirm delete"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded p-1.5 hover:bg-surface-secondary transition-colors"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded p-1.5 hover:bg-red-500/10 text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ================================================================== */
/*  Empty State                                                        */
/* ================================================================== */

function EmptyState() {
  const { addHolding } = usePortfolio();

  const quickCoins = [
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "solana", name: "Solana", symbol: "SOL" },
  ] as const;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-full bg-surface-secondary flex items-center justify-center mb-6">
            <Wallet className="h-10 w-10 text-text-secondary" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">Start tracking your portfolio</h2>
          <p className="text-text-secondary max-w-md mb-8">
            Add your crypto holdings to track performance, profit &amp; loss, and
            allocation in real time. Your data is stored locally — no account needed.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {quickCoins.map((c) => (
              <Button
                key={c.id}
                variant="outline"
                size="sm"
                onClick={() => addHolding(c.id, c.name, c.symbol, 1, 0)}
              >
                <Plus className="h-3.5 w-3.5" />
                Quick-add {c.symbol}
              </Button>
            ))}
          </div>

          <AddHoldingModal
            trigger={
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Add Your First Holding
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Export CSV                                                          */
/* ================================================================== */

function exportCSV(enriched: EnrichedHolding[]) {
  const headers = ["Coin", "Symbol", "Amount", "Buy Price (USD)", "Current Price (USD)", "Value (USD)", "P&L ($)", "P&L (%)", "Allocation (%)", "Added"];
  const rows = enriched.map((h) => [
    h.coinName,
    h.symbol,
    h.amount,
    h.buyPrice.toFixed(2),
    h.currentPrice.toFixed(2),
    h.value.toFixed(2),
    h.pnlDollar.toFixed(2),
    h.pnlPct.toFixed(2),
    h.allocation.toFixed(1),
    h.addedAt,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================== */
/*  Main Content                                                       */
/* ================================================================== */

export default function PortfolioContent() {
  const { holdings, prices, totalValue, totalCost, totalPnL, totalPnLPercent } = usePortfolio();
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  /* Enrich holdings with computed values */
  const enriched = useMemo<EnrichedHolding[]>(() => {
    return holdings.map((h) => {
      const currentPrice = prices[h.coinId]?.usd ?? h.buyPrice;
      const value = h.amount * currentPrice;
      const cost = h.amount * h.buyPrice;
      const pnlDollar = value - cost;
      const pnlPct = cost > 0 ? (pnlDollar / cost) * 100 : 0;
      const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return { ...h, currentPrice, value, cost, pnlDollar, pnlPct, allocation };
    });
  }, [holdings, prices, totalValue]);

  /* Sort */
  const sorted = useMemo(() => {
    const arr = [...enriched];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "coin": return dir * a.coinName.localeCompare(b.coinName);
        case "amount": return dir * (a.amount - b.amount);
        case "buyPrice": return dir * (a.buyPrice - b.buyPrice);
        case "currentPrice": return dir * (a.currentPrice - b.currentPrice);
        case "value": return dir * (a.value - b.value);
        case "pnlDollar": return dir * (a.pnlDollar - b.pnlDollar);
        case "pnlPct": return dir * (a.pnlPct - b.pnlPct);
        default: return 0;
      }
    });
    return arr;
  }, [enriched, sortKey, sortDir]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  /* Best / worst performer */
  const { best, worst } = useMemo(() => {
    if (enriched.length === 0) return { best: null, worst: null };
    const byPnl = [...enriched].sort((a, b) => b.pnlPct - a.pnlPct);
    return { best: byPnl[0] ?? null, worst: byPnl[byPnl.length - 1] ?? null };
  }, [enriched]);

  /* ── Empty state ── */
  if (holdings.length === 0) {
    return (
      <div className="space-y-8">
        <EmptyState />
        <PortfolioTips />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ══ Summary Cards ════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-secondary">Total Value</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{fmtUsd(totalValue)}</p>
            <p className="text-xs text-text-secondary mt-1">
              Cost basis: {fmtUsd(totalCost)}
            </p>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              {totalPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-text-secondary">Total P&amp;L</span>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums", pnlColor(totalPnL))}>
              {totalPnL >= 0 ? "+" : ""}{fmtUsd(totalPnL)}
            </p>
            <p className={cn("text-xs mt-1 font-medium", pnlColor(totalPnLPercent))}>
              {fmtPct(totalPnLPercent)}
            </p>
          </CardContent>
        </Card>

        {/* Best Performer */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-text-secondary">Best Performer</span>
            </div>
            {best ? (
              <>
                <p className="text-2xl font-bold tabular-nums">{best.symbol}</p>
                <p className={cn("text-xs mt-1 font-medium", pnlColor(best.pnlPct))}>
                  {fmtPct(best.pnlPct)} ({best.pnlDollar >= 0 ? "+" : ""}{fmtUsd(best.pnlDollar)})
                </p>
              </>
            ) : (
              <p className="text-sm text-text-secondary">—</p>
            )}
          </CardContent>
        </Card>

        {/* Worst Performer */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-text-secondary">Worst Performer</span>
            </div>
            {worst && enriched.length > 1 ? (
              <>
                <p className="text-2xl font-bold tabular-nums">{worst.symbol}</p>
                <p className={cn("text-xs mt-1 font-medium", pnlColor(worst.pnlPct))}>
                  {fmtPct(worst.pnlPct)} ({worst.pnlDollar >= 0 ? "+" : ""}{fmtUsd(worst.pnlDollar)})
                </p>
              </>
            ) : (
              <p className="text-sm text-text-secondary">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══ Charts Row ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Value Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif">Value by Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <ValueBarChart holdings={enriched} />
          </CardContent>
        </Card>

        {/* Allocation Donut */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-text-secondary" />
              <CardTitle className="font-serif">Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <AllocationChart holdings={enriched} totalValue={totalValue} />
          </CardContent>
        </Card>
      </div>

      {/* ══ Holdings Table ═══════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="font-serif">Holdings ({enriched.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(enriched)}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
              <AddHoldingModal />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <SortHeader label="Coin" sortKey="coin" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="left" />
                <SortHeader label="Amount" sortKey="amount" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortHeader label="Avg Buy" sortKey="buyPrice" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortHeader label="Price" sortKey="currentPrice" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Value" sortKey="value" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <th className="hidden lg:table-cell px-4 py-3 text-right font-medium">Allocation</th>
                <SortHeader label="P&L ($)" sortKey="pnlDollar" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="P&L (%)" sortKey="pnlPct" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <HoldingRow key={h.id} holding={h} />
              ))}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right tabular-nums">{enriched.length} assets</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right tabular-nums">{fmtUsd(totalValue)}</td>
                <td className="px-4 py-3 text-right tabular-nums">100%</td>
                <td className={cn("px-4 py-3 text-right tabular-nums", pnlColor(totalPnL))}>
                  {totalPnL >= 0 ? "+" : ""}{fmtUsd(totalPnL)}
                </td>
                <td className={cn("px-4 py-3 text-right tabular-nums", pnlColor(totalPnLPercent))}>
                  {fmtPct(totalPnLPercent)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* ══ Tips / Education ═════════════════════════════ */}
      <PortfolioTips />
    </div>
  );
}

/* ================================================================== */
/*  Educational Tips Section                                           */
/* ================================================================== */

function PortfolioTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Portfolio Tracking Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-text-secondary">
        <p>
          This portfolio tracker stores all data locally in your browser — nothing
          is sent to any server. Your holdings, cost basis, and trade history remain
          private and fully under your control.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="inline-block h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <div>
              <strong className="text-text-primary">Track your cost basis</strong>
              <span> — Enter the price you paid for each coin to see accurate profit &amp; loss. You can edit this at any time.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-block h-6 w-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              <PieChart className="h-3.5 w-3.5" />
            </span>
            <div>
              <strong className="text-text-primary">Monitor allocation</strong>
              <span> — Diversification matters. The allocation chart shows how concentrated your portfolio is across different assets.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-block h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="h-3.5 w-3.5" />
            </span>
            <div>
              <strong className="text-text-primary">Export anytime</strong>
              <span> — Download your portfolio as a CSV file for backup, tax preparation, or import into other tools.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-block h-6 w-6 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
              <DollarSign className="h-3.5 w-3.5" />
            </span>
            <div>
              <strong className="text-text-primary">Live prices</strong>
              <span> — Prices update automatically every 60 seconds from our aggregated market data feed across multiple exchanges.</span>
            </div>
          </div>
        </div>
        <p className="text-xs italic">
          This tracker is for informational purposes only. Always verify data with
          your exchange and consult a financial advisor for investment decisions.
        </p>
      </CardContent>
    </Card>
  );
}
