"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  useWatchlist,
  type WatchlistCoin,
  type SortPreference,
} from "@/components/watchlist";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent, formatLargeNumber } from "@/lib/format";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Search,
  X,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  StickyNote,
  Tag,
  BarChart3,
  DollarSign,
  Activity,
  Flame,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import { Card } from "@/components/ui";
import { Badge } from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

type ViewMode = "table" | "grid";

// ---------------------------------------------------------------------------
// Mini Sparkline
// ---------------------------------------------------------------------------

function MiniSparkline({ prices, className }: { prices: number[]; className?: string }) {
  if (!prices || prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 120;
  const h = 32;

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isUp = prices[prices.length - 1] >= prices[0];

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={cn("inline-block", className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Summary Cards
// ---------------------------------------------------------------------------

function SummaryCards({
  coins,
  marketData,
}: {
  coins: WatchlistCoin[];
  marketData: Record<string, CoinMarketData>;
}) {
  const stats = useMemo(() => {
    const withData = coins
      .map((c) => marketData[c.id])
      .filter((d): d is CoinMarketData => !!d);

    if (withData.length === 0)
      return { totalMarketCap: 0, avgChange24h: 0, best: null, worst: null, totalVolume: 0 };

    const totalMarketCap = withData.reduce((s, c) => s + (c.market_cap ?? 0), 0);
    const totalVolume = withData.reduce((s, c) => s + (c.total_volume ?? 0), 0);
    const avgChange24h =
      withData.reduce((s, c) => s + (c.price_change_percentage_24h ?? 0), 0) / withData.length;

    const best = withData.reduce(
      (b, c) => (!b || (c.price_change_percentage_24h ?? 0) > (b.price_change_percentage_24h ?? 0) ? c : b),
      null as CoinMarketData | null,
    );
    const worst = withData.reduce(
      (w, c) => (!w || (c.price_change_percentage_24h ?? 0) < (w.price_change_percentage_24h ?? 0) ? c : w),
      null as CoinMarketData | null,
    );

    return { totalMarketCap, avgChange24h, best, worst, totalVolume };
  }, [coins, marketData]);

  const avgPct = formatPercent(stats.avgChange24h);
  const bestPct = stats.best ? formatPercent(stats.best.price_change_percentage_24h) : null;
  const worstPct = stats.worst ? formatPercent(stats.worst.price_change_percentage_24h) : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
              Combined Market Cap
            </p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {formatLargeNumber(stats.totalMarketCap, { prefix: "$" })}
            </p>
          </div>
          <DollarSign className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
              Avg 24h Change
            </p>
            <p className={cn("text-lg font-bold", avgPct.className)}>
              {avgPct.text}
            </p>
          </div>
          <Activity className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
              Best Performer
            </p>
            {stats.best ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {stats.best.symbol.toUpperCase()}
                </span>
                <span className={cn("text-sm font-bold", bestPct?.className)}>
                  {bestPct?.text}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[var(--color-text-secondary)]">—</span>
            )}
          </div>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
              Worst Performer
            </p>
            {stats.worst ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {stats.worst.symbol.toUpperCase()}
                </span>
                <span className={cn("text-sm font-bold", worstPct?.className)}>
                  {worstPct?.text}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[var(--color-text-secondary)]">—</span>
            )}
          </div>
          <TrendingDown className="h-5 w-5 text-red-500" />
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Note Editor (inline)
// ---------------------------------------------------------------------------

function NoteEditor({
  coinId,
  currentNote,
  onSave,
}: {
  coinId: string;
  currentNote?: string;
  onSave: (id: string, note: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNote ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(currentNote ?? ""); setEditing(true); }}
        className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
        title={currentNote || "Add a note"}
      >
        <StickyNote className="h-3 w-3" />
        {currentNote ? (
          <span className="max-w-[120px] truncate">{currentNote}</span>
        ) : (
          <span className="italic">note</span>
        )}
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(coinId, value);
        setEditing(false);
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { onSave(coinId, value); setEditing(false); }}
        maxLength={100}
        placeholder="Add note…"
        className="w-28 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tag Manager (inline)
// ---------------------------------------------------------------------------

function TagManager({
  coinId,
  tags,
  onAdd,
  onRemove,
}: {
  coinId: string;
  tags: string[];
  onAdd: (id: string, tag: string) => void;
  onRemove: (id: string, tag: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(coinId, tag)}
            className="ml-0.5 hover:text-red-500"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) { onAdd(coinId, value); setValue(""); }
            setAdding(false);
          }}
          className="inline-flex"
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => { if (value.trim()) onAdd(coinId, value); setAdding(false); setValue(""); }}
            maxLength={20}
            placeholder="tag"
            className="w-16 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-0.5 text-[10px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          <Tag className="h-2.5 w-2.5" />
          <span>tag</span>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { value: SortPreference; label: string }[] = [
  { value: "custom", label: "Custom Order" },
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "added-newest", label: "Newest First" },
  { value: "added-oldest", label: "Oldest First" },
];

// ---------------------------------------------------------------------------
// Grid Card
// ---------------------------------------------------------------------------

function CoinCard({
  coin,
  data,
  onRemove,
  onUpdateNote,
  onAddTag,
  onRemoveTag,
}: {
  coin: WatchlistCoin;
  data?: CoinMarketData;
  onRemove: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}) {
  const pct24 = data ? formatPercent(data.price_change_percentage_24h) : null;
  const pct7d = data ? formatPercent(data.price_change_percentage_7d_in_currency) : null;

  return (
    <Card className="group relative p-4 transition-all hover:shadow-md">
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(coin.id)}
        className="absolute top-3 right-3 rounded p-1 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-[var(--color-surface)] transition-all"
        aria-label={`Remove ${coin.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Header */}
      <Link href={`/coin/${coin.id}`} className="flex items-center gap-2.5 mb-3">
        {data?.image && (
          <img
            src={data.image}
            alt={coin.name}
            width={32}
            height={32}
            className="rounded-full"
            loading="lazy"
          />
        )}
        <div>
          <p className="font-semibold text-[var(--color-text-primary)] leading-tight">
            {coin.name}
          </p>
          <p className="text-xs uppercase text-[var(--color-text-tertiary)]">
            {coin.symbol}
          </p>
        </div>
      </Link>

      {/* Price row */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
          {data ? formatCurrency(data.current_price) : "—"}
        </span>
        {pct24 && (
          <span className={cn("text-sm font-mono font-semibold", pct24.className)}>
            {pct24.text}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[var(--color-text-secondary)] mb-2">
        <div className="flex justify-between">
          <span>7d</span>
          <span className={cn("font-mono", pct7d?.className)}>{pct7d?.text ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Vol</span>
          <span className="font-mono">{data ? formatLargeNumber(data.total_volume, { prefix: "$" }) : "—"}</span>
        </div>
        <div className="flex justify-between col-span-2">
          <span>MCap</span>
          <span className="font-mono">{data ? formatLargeNumber(data.market_cap, { prefix: "$" }) : "—"}</span>
        </div>
      </div>

      {/* Sparkline */}
      {data?.sparkline_in_7d?.price && (
        <div className="mb-2">
          <MiniSparkline prices={data.sparkline_in_7d.price} className="w-full" />
        </div>
      )}

      {/* Tags + Note */}
      <div className="space-y-1.5 border-t border-[var(--color-border)] pt-2 mt-1">
        <TagManager coinId={coin.id} tags={coin.tags ?? []} onAdd={onAddTag} onRemove={onRemoveTag} />
        <NoteEditor coinId={coin.id} currentNote={coin.note} onSave={onUpdateNote} />
      </div>

      {/* Added date */}
      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2 flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" />
        Added {new Date(coin.addedAt).toLocaleDateString()}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Import Modal
// ---------------------------------------------------------------------------

function ImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (data: string) => { imported: number; skipped: number; error?: string };
}) {
  const [value, setValue] = useState("");
  const { addToast } = useToast();

  if (!open) return null;

  const handleImport = () => {
    const result = onImport(value);
    if (result.error) {
      addToast(result.error, "error");
    } else {
      addToast(`Imported ${result.imported} coin${result.imported !== 1 ? "s" : ""}${result.skipped ? `, ${result.skipped} skipped` : ""}`, "success");
      setValue("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Import Watchlist</h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-[var(--color-surface-secondary)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Paste a JSON export from this app or another watchlist. Supports v1 and v2 formats.
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={8}
          placeholder='{"version":2,"coins":[...]}'
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={!value.trim()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WatchlistPage() {
  const {
    coins,
    removeCoin,
    reorderCoins,
    updateNote,
    addTag,
    removeTag,
    clearAll,
    exportJSON,
    exportCSV,
    importJSON,
    allTags,
    sortPreference,
    setSortPreference,
    maxCoins,
    hydrated,
  } = useWatchlist();

  const { addToast } = useToast();

  const [marketData, setMarketData] = useState<Record<string, CoinMarketData>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showImport, setShowImport] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch market data for watchlisted coins
  const fetchMarketData = useCallback(async () => {
    if (coins.length === 0) {
      setMarketData({});
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/market/coins?type=top&limit=250");
      if (!res.ok) throw new Error("Failed to fetch market data");

      const data = await res.json();
      const coinsList: CoinMarketData[] = data.coins ?? [];

      const lookup: Record<string, CoinMarketData> = {};
      for (const coin of coinsList) {
        if (coins.some((wc) => wc.id === coin.id)) {
          lookup[coin.id] = coin;
        }
      }

      setMarketData(lookup);
      setLastRefresh(new Date());
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [coins]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 120_000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Sorted coins
  const sortedCoins = useMemo(() => {
    const copy = [...coins];
    switch (sortPreference) {
      case "name-asc":
        copy.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        copy.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "added-newest":
        copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
      case "added-oldest":
        copy.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
        break;
      default:
        break; // custom order — as stored
    }
    return copy;
  }, [coins, sortPreference]);

  // Filtered coins
  const filteredCoins = useMemo(() => {
    let result = sortedCoins;

    if (activeTag) {
      result = result.filter((c) => (c.tags ?? []).includes(activeTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.note ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [sortedCoins, activeTag, search]);

  // Move coin helpers
  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...coins];
    const actualIdx = coins.findIndex((c) => c.id === filteredCoins[index].id);
    const swapIdx = coins.findIndex((c) => c.id === filteredCoins[index - 1].id);
    if (actualIdx < 0 || swapIdx < 0) return;
    [next[swapIdx], next[actualIdx]] = [next[actualIdx], next[swapIdx]];
    reorderCoins(next);
  };

  const moveDown = (index: number) => {
    if (index === filteredCoins.length - 1) return;
    const next = [...coins];
    const actualIdx = coins.findIndex((c) => c.id === filteredCoins[index].id);
    const swapIdx = coins.findIndex((c) => c.id === filteredCoins[index + 1].id);
    if (actualIdx < 0 || swapIdx < 0) return;
    [next[actualIdx], next[swapIdx]] = [next[swapIdx], next[actualIdx]];
    reorderCoins(next);
  };

  // Export handlers
  const handleExportJSON = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Watchlist exported as JSON", "success");
  };

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Watchlist exported as CSV", "success");
  };

  // Wait for hydration
  if (!hydrated) {
    return (
      <>
        <Header />
        <main className="container-main py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container-main py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              Watchlist
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              {coins.length} / {maxCoins} coin{coins.length !== 1 ? "s" : ""} tracked
              {lastRefresh && (
                <span className="ml-2 text-[var(--color-text-tertiary)]">
                  · Updated {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          {coins.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportJSON} title="Export JSON">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} title="Export CSV">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)} title="Import">
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import
              </Button>

              {showConfirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-text-secondary)]">Clear all?</span>
                  <button
                    type="button"
                    onClick={() => { clearAll(); setShowConfirmClear(false); addToast("Watchlist cleared", "info"); }}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(false)}
                    className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmClear(true)}
                  className="text-[var(--color-text-secondary)] hover:text-red-500"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {coins.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
              <Star className="h-10 w-10 text-[var(--color-text-tertiary)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
              Start tracking your favorite cryptocurrencies by starring them from
              the Markets page, or import an existing watchlist.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/markets">
                <Button variant="primary">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Browse Markets
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {!loading && <SummaryCards coins={coins} marketData={marketData} />}

            {/* Toolbar: search, tags, sort, view toggle */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search coins, symbols, notes…"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-8 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort select */}
                <select
                  value={sortPreference}
                  onChange={(e) => setSortPreference(e.target.value as SortPreference)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-3 py-2 transition-colors",
                      viewMode === "table"
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                    )}
                    aria-label="Table view"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "px-3 py-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                    )}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tag filters */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                  <button
                    type="button"
                    onClick={() => setActiveTag(null)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      !activeTag
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]",
                    )}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        activeTag === tag
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]",
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Result count when filtered */}
              {(search || activeTag) && (
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Showing {filteredCoins.length} of {coins.length} coins
                  {activeTag && <span> · tag: <strong>{activeTag}</strong></span>}
                </p>
              )}
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                      <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Coin</th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Price</th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">24h %</th>
                      <th className="hidden md:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d %</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Market Cap</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Volume</th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin) => (
                      <tr key={coin.id} className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                        <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-16" /></td>
                        <td className="hidden md:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-16" /></td>
                        <td className="hidden lg:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-24" /></td>
                        <td className="hidden lg:table-cell px-4 py-3"><Skeleton className="ml-auto h-5 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="ml-auto h-5 w-20" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredCoins.length === 0 ? (
              /* No results */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-10 w-10 text-[var(--color-text-tertiary)] mb-4" />
                <h3 className="text-lg font-semibold mb-1">No coins match your search</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Try a different search term or clear the filters.
                </p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setActiveTag(null); }}>
                  Clear Filters
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCoins.map((coin) => (
                  <CoinCard
                    key={coin.id}
                    coin={coin}
                    data={marketData[coin.id]}
                    onRemove={removeCoin}
                    onUpdateNote={updateNote}
                    onAddTag={addTag}
                    onRemoveTag={removeTag}
                  />
                ))}
              </div>
            ) : (
              /* Table view */
              <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                      <th className="px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Coin</th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Price</th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">24h %</th>
                      <th className="hidden md:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d %</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Market Cap</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Volume (24h)</th>
                      <th className="hidden xl:table-cell px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">7d Chart</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-[var(--color-text-secondary)]">Info</th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--color-text-secondary)]">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCoins.map((coin, index) => {
                      const data = marketData[coin.id];
                      const pct24 = data ? formatPercent(data.price_change_percentage_24h) : null;
                      const pct7d = data ? formatPercent(data.price_change_percentage_7d_in_currency) : null;

                      return (
                        <tr
                          key={coin.id}
                          className="border-b border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-secondary)]"
                        >
                          {/* Coin */}
                          <td className="px-4 py-3">
                            <Link href={`/coin/${coin.id}`} className="flex items-center gap-2 hover:underline">
                              {data?.image && (
                                <img
                                  src={data.image}
                                  alt={coin.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                  loading="lazy"
                                />
                              )}
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {coin.name}
                              </span>
                              <span className="uppercase text-[var(--color-text-tertiary)] text-xs">
                                {coin.symbol}
                              </span>
                            </Link>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-3 text-right font-mono text-[var(--color-text-primary)]">
                            {data ? formatCurrency(data.current_price) : "—"}
                          </td>

                          {/* 24h */}
                          <td className={cn("px-4 py-3 text-right font-mono", pct24?.className)}>
                            {pct24?.text ?? "—"}
                          </td>

                          {/* 7d */}
                          <td className={cn("hidden md:table-cell px-4 py-3 text-right font-mono", pct7d?.className)}>
                            {pct7d?.text ?? "—"}
                          </td>

                          {/* Market Cap */}
                          <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--color-text-secondary)]">
                            {data ? formatLargeNumber(data.market_cap, { prefix: "$" }) : "—"}
                          </td>

                          {/* Volume */}
                          <td className="hidden lg:table-cell px-4 py-3 text-right text-[var(--color-text-secondary)]">
                            {data ? formatLargeNumber(data.total_volume, { prefix: "$" }) : "—"}
                          </td>

                          {/* Sparkline */}
                          <td className="hidden xl:table-cell px-4 py-3 text-right">
                            {data?.sparkline_in_7d?.price && (
                              <MiniSparkline prices={data.sparkline_in_7d.price} />
                            )}
                          </td>

                          {/* Notes + Tags */}
                          <td className="hidden md:table-cell px-4 py-3">
                            <div className="space-y-1">
                              <TagManager coinId={coin.id} tags={coin.tags ?? []} onAdd={addTag} onRemove={removeTag} />
                              <NoteEditor coinId={coin.id} currentNote={coin.note} onSave={updateNote} />
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {sortPreference === "custom" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0}
                                    className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors"
                                    aria-label={`Move ${coin.name} up`}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveDown(index)}
                                    disabled={index === filteredCoins.length - 1}
                                    className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors"
                                    aria-label={`Move ${coin.name} down`}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => removeCoin(coin.id)}
                                className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-[var(--color-surface)] transition-colors"
                                aria-label={`Remove ${coin.name} from watchlist`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Import modal */}
      <ImportModal open={showImport} onClose={() => setShowImport(false)} onImport={importJSON} />
    </>
  );
}
