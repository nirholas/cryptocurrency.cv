"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAlerts, type Alert, type AlertType, type AlertPriority } from "@/components/alerts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import {
  Bell,
  BellOff,
  BellRing,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Percent,
  AlertTriangle,
  Clock,
  Copy,
  Download,
  Upload,
  Activity,
  Search,
  Filter,
  Volume2,
  RefreshCw,
  CheckSquare,
  Square,
  BarChart3,
  Zap,
  ArrowUpDown,
  X,
} from "lucide-react";

/* ───────── Coin options (expanded) ───────── */

const COIN_OPTIONS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "matic-network", name: "Polygon", symbol: "MATIC" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC" },
  { id: "uniswap", name: "Uniswap", symbol: "UNI" },
  { id: "cosmos", name: "Cosmos", symbol: "ATOM" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR" },
  { id: "aptos", name: "Aptos", symbol: "APT" },
  { id: "sui", name: "Sui", symbol: "SUI" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
  { id: "optimism", name: "Optimism", symbol: "OP" },
  { id: "toncoin", name: "Toncoin", symbol: "TON" },
];

const ALERT_TYPE_OPTIONS: { value: AlertType; label: string; icon: typeof TrendingUp; description: string }[] = [
  { value: "price_above", label: "Price Above", icon: TrendingUp, description: "Alert when price goes above target" },
  { value: "price_below", label: "Price Below", icon: TrendingDown, description: "Alert when price drops below target" },
  { value: "percent_change", label: "% Change (24h)", icon: Percent, description: "Alert on 24h percentage change" },
  { value: "volume_spike", label: "Volume Spike", icon: BarChart3, description: "Alert when 24h volume exceeds target" },
  { value: "recurring", label: "Recurring", icon: RefreshCw, description: "Re-fires after cooldown period" },
];

const PRIORITY_OPTIONS: { value: AlertPriority; label: string; color: string; emoji: string }[] = [
  { value: "low", label: "Low", color: "text-blue-500", emoji: "🔵" },
  { value: "medium", label: "Medium", color: "text-yellow-500", emoji: "🟡" },
  { value: "high", label: "High", color: "text-orange-500", emoji: "🟠" },
  { value: "critical", label: "Critical", color: "text-red-500", emoji: "🔴" },
];

const COOLDOWN_OPTIONS = [
  { value: 0, label: "One-shot (disable after trigger)" },
  { value: 300_000, label: "5 minutes" },
  { value: 900_000, label: "15 minutes" },
  { value: 3_600_000, label: "1 hour" },
  { value: 86_400_000, label: "24 hours" },
];

type SortField = "coin" | "type" | "target" | "status" | "created" | "priority";
type SortDirection = "asc" | "desc";
type ViewTab = "active" | "triggered" | "stats";

/* ───────── Page ───────── */

export default function AlertsPage() {
  const {
    alerts,
    addAlert,
    removeAlert,
    updateAlert,
    duplicateAlert,
    toggleAlert,
    bulkToggle,
    bulkDelete,
    triggered,
    clearTriggered,
    removeTriggered,
    livePrices,
    stats,
    notificationsGranted,
    requestNotifications,
    lastCheckedAt,
    exportAlerts,
    importAlerts,
  } = useAlerts();
  const { addToast } = useToast();

  /* Form state */
  const [coinId, setCoinId] = useState<string>(COIN_OPTIONS[0].id);
  const [alertType, setAlertType] = useState<AlertType>("price_above");
  const [target, setTarget] = useState("");
  const [priority, setPriority] = useState<AlertPriority>("medium");
  const [note, setNote] = useState("");
  const [cooldownMs, setCooldownMs] = useState(0);
  const [expiresIn, setExpiresIn] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* UI state */
  const [activeTab, setActiveTab] = useState<ViewTab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<AlertType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "enabled" | "disabled">("all");
  const importRef = useRef<HTMLInputElement>(null);

  /* ── Handlers ── */

  const handleCreate = () => {
    const numTarget = Number(target);
    if (!numTarget || numTarget <= 0) return;
    const coin = COIN_OPTIONS.find((c) => c.id === coinId);
    if (!coin) return;

    let expiresAt: string | null = null;
    if (expiresIn) {
      const hours = Number(expiresIn);
      if (hours > 0) {
        expiresAt = new Date(Date.now() + hours * 3_600_000).toISOString();
      }
    }

    addAlert({
      type: alertType === "recurring" ? "price_above" : alertType,
      coinId: coin.id,
      coinName: coin.name,
      target: numTarget,
      enabled: true,
      note,
      priority,
      cooldownMs: alertType === "recurring" ? (cooldownMs || 3_600_000) : cooldownMs,
      expiresAt,
    });
    setTarget("");
    setNote("");
    addToast(`Alert created for ${coin.name}`, "success");
  };

  const handleExport = () => {
    const json = exportAlerts();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crypto-alerts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Alerts exported", "success");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importAlerts(reader.result as string);
      addToast(
        `Imported ${result.imported} alerts${result.errors ? `, ${result.errors} skipped` : ""}`,
        result.errors ? "info" : "success",
      );
    };
    reader.readAsText(file);
    // Reset input
    if (importRef.current) importRef.current.value = "";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredAlerts.map((a) => a.id)));
  }, []);

  const deselectAll = () => setSelectedIds(new Set());

  /* ── Filtered & sorted alerts ── */

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.coinName.toLowerCase().includes(q) ||
          a.coinId.toLowerCase().includes(q) ||
          a.note?.toLowerCase().includes(q),
      );
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter((a) => a.type === filterType);
    }

    // Status filter
    if (filterStatus === "enabled") result = result.filter((a) => a.enabled);
    else if (filterStatus === "disabled") result = result.filter((a) => !a.enabled);

    // Sort
    result.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "coin":
          return dir * a.coinName.localeCompare(b.coinName);
        case "type":
          return dir * a.type.localeCompare(b.type);
        case "target":
          return dir * (a.target - b.target);
        case "status":
          return dir * (Number(b.enabled) - Number(a.enabled));
        case "priority": {
          const order: Record<AlertPriority, number> = { low: 0, medium: 1, high: 2, critical: 3 };
          return dir * ((order[a.priority] ?? 1) - (order[b.priority] ?? 1));
        }
        case "created":
        default:
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });

    return result;
  }, [alerts, searchQuery, filterType, filterStatus, sortField, sortDirection]);

  /* ── Formatting helpers ── */

  const formatType = (type: AlertType) => {
    switch (type) {
      case "price_above": return "Above";
      case "price_below": return "Below";
      case "percent_change": return "% Change";
      case "volume_spike": return "Volume";
      case "recurring": return "Recurring";
    }
  };

  const typeIcon = (type: AlertType) => {
    switch (type) {
      case "price_above": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "price_below": return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "percent_change": return <Percent className="h-4 w-4 text-accent" />;
      case "volume_spike": return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case "recurring": return <RefreshCw className="h-4 w-4 text-cyan-500" />;
    }
  };

  const priorityBadge = (p: AlertPriority) => {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === p);
    return (
      <span className={cn("text-xs font-medium", opt?.color)}>
        {opt?.emoji} {opt?.label}
      </span>
    );
  };

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const currentPrice = (coinId: string) => {
    const p = livePrices[coinId];
    return p?.usd ? `$${p.usd.toLocaleString()}` : "—";
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="pb-3 pr-4 font-medium cursor-pointer hover:text-text-primary transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortField === field && (
          <ArrowUpDown className="h-3 w-3" />
        )}
      </span>
    </th>
  );

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <Bell className="h-8 w-8 text-accent" />
              Price Alerts
            </h1>
            <p className="text-text-secondary">
              Intelligent price monitoring — checked every 30 seconds.
              {lastCheckedAt && (
                <span className="ml-2 text-xs text-text-tertiary">
                  Last check: {formatTimeAgo(lastCheckedAt)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Notification permission */}
            {!notificationsGranted && (
              <Button variant="outline" size="sm" onClick={requestNotifications}>
                <BellRing className="h-4 w-4 mr-1.5" />
                Enable Notifications
              </Button>
            )}
            {/* Import/Export */}
            <Button variant="ghost" size="sm" onClick={handleExport} disabled={alerts.length === 0}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => importRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1.5" />
              Import
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border border-border bg-(--color-surface) p-3 text-center">
            <p className="text-2xl font-bold text-text-primary tabular-nums">{stats.total}</p>
            <p className="text-xs text-text-tertiary">Total Alerts</p>
          </div>
          <div className="rounded-lg border border-border bg-(--color-surface) p-3 text-center">
            <p className="text-2xl font-bold text-green-500 tabular-nums">{stats.enabled}</p>
            <p className="text-xs text-text-tertiary">Active</p>
          </div>
          <div className="rounded-lg border border-border bg-(--color-surface) p-3 text-center">
            <p className="text-2xl font-bold text-accent tabular-nums">{stats.triggered}</p>
            <p className="text-xs text-text-tertiary">Triggered</p>
          </div>
          <div className="rounded-lg border border-border bg-(--color-surface) p-3 text-center">
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              {stats.mostTriggered ? stats.mostTriggered.triggerCount : 0}
            </p>
            <p className="text-xs text-text-tertiary">
              {stats.mostTriggered ? `${stats.mostTriggered.coinName} fires` : "Top Fires"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column – Create Form */}
          <div className="space-y-6">
            {/* Create Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5" />
                  Create Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coin select with current price */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Coin
                  </label>
                  <select
                    value={coinId}
                    onChange={(e) => setCoinId(e.target.value)}
                    className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {COIN_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  {livePrices[coinId]?.usd && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Current: <span className="font-medium text-text-primary">${livePrices[coinId].usd.toLocaleString()}</span>
                      {livePrices[coinId].usd_24h_change != null && (
                        <span className={cn("ml-1", (livePrices[coinId].usd_24h_change ?? 0) >= 0 ? "text-green-500" : "text-red-500")}>
                          {(livePrices[coinId].usd_24h_change ?? 0) >= 0 ? "+" : ""}
                          {(livePrices[coinId].usd_24h_change ?? 0).toFixed(2)}%
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Type select */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALERT_TYPE_OPTIONS.filter((t) => t.value !== "recurring").map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setAlertType(t.value)}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all",
                            alertType === t.value
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border text-text-secondary hover:border-accent/40",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    {alertType === "percent_change" ? "Percent (%)" : alertType === "volume_spike" ? "Volume (USD)" : "Target Price (USD)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder={alertType === "percent_change" ? "e.g. 5" : alertType === "volume_spike" ? "e.g. 1000000000" : "e.g. 100000"}
                    className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                    }}
                  />
                  {/* Quick-set buttons for common targets */}
                  {alertType !== "percent_change" && alertType !== "volume_spike" && livePrices[coinId]?.usd && (
                    <div className="flex gap-1.5 mt-2">
                      {[0.95, 0.9, 1.05, 1.1].map((mult) => {
                        const val = Math.round(livePrices[coinId].usd * mult);
                        return (
                          <button
                            key={mult}
                            type="button"
                            onClick={() => setTarget(String(val))}
                            className="rounded border border-border px-2 py-0.5 text-[10px] font-medium text-text-tertiary hover:border-accent hover:text-accent transition-colors"
                          >
                            {mult < 1 ? `${Math.round((1 - mult) * 100)}%▼` : `+${Math.round((mult - 1) * 100)}%▲`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Priority
                  </label>
                  <div className="flex gap-1.5">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all text-center",
                          priority === p.value
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/40",
                          p.color,
                        )}
                      >
                        {p.emoji} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-accent hover:underline"
                >
                  {showAdvanced ? "Hide" : "Show"} advanced options
                </button>

                {showAdvanced && (
                  <div className="space-y-4 border-t border-border pt-4">
                    {/* Note */}
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-1 block">
                        Note (optional)
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Take profit target"
                        maxLength={100}
                        className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>

                    {/* Cooldown (recurring) */}
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-1 block">
                        Repeat Behavior
                      </label>
                      <select
                        value={cooldownMs}
                        onChange={(e) => setCooldownMs(Number(e.target.value))}
                        className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {COOLDOWN_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-1 block">
                        Auto-expire after (hours, optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={expiresIn}
                        onChange={(e) => setExpiresIn(e.target.value)}
                        placeholder="e.g. 24"
                        className="w-full rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!target || Number(target) <= 0 || alerts.length >= 50}
                >
                  {alerts.length >= 50 ? "Max alerts reached (50)" : "Create Alert"}
                </Button>
              </CardContent>
            </Card>

            {/* Quick-create presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Presets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { coin: "bitcoin", name: "Bitcoin", target: 100000, type: "price_above" as AlertType, label: "BTC > $100K" },
                    { coin: "ethereum", name: "Ethereum", target: 5000, type: "price_above" as AlertType, label: "ETH > $5K" },
                    { coin: "bitcoin", name: "Bitcoin", target: 5, type: "percent_change" as AlertType, label: "BTC ±5% day" },
                    { coin: "solana", name: "Solana", target: 500, type: "price_above" as AlertType, label: "SOL > $500" },
                  ].map((preset, i) => {
                    const alreadyExists = alerts.some(
                      (a) => a.coinId === preset.coin && a.type === preset.type && a.target === preset.target,
                    );
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={alreadyExists || alerts.length >= 50}
                        onClick={() =>
                          addAlert({
                            type: preset.type,
                            coinId: preset.coin,
                            coinName: preset.name,
                            target: preset.target,
                            enabled: true,
                            note: "",
                            priority: "medium",
                            cooldownMs: 0,
                            expiresAt: null,
                          })
                        }
                        className={cn(
                          "w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-all",
                          alreadyExists
                            ? "border-border text-text-tertiary opacity-50 cursor-not-allowed"
                            : "border-border hover:border-accent hover:text-accent",
                        )}
                      >
                        <span>{preset.label}</span>
                        {alreadyExists ? (
                          <Badge className="text-[10px]">exists</Badge>
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column – Tabs: Active / Triggered / Stats */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-border">
              {([
                { id: "active" as ViewTab, label: "Active Alerts", icon: AlertTriangle, count: alerts.length },
                { id: "triggered" as ViewTab, label: "Triggered", icon: Clock, count: triggered.length },
                { id: "stats" as ViewTab, label: "Live Prices", icon: Activity, count: null },
              ] as const).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                      activeTab === tab.id
                        ? "border-accent text-accent"
                        : "border-transparent text-text-secondary hover:text-text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== null && tab.count > 0 && (
                      <span className="ml-1 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] tabular-nums font-semibold text-accent">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Alerts Tab */}
            {activeTab === "active" && (
              <Card>
                <CardContent className="pt-4">
                  {/* Toolbar */}
                  {alerts.length > 0 && (
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search alerts…"
                            className="w-full rounded-md border border-border bg-(--color-surface) pl-9 pr-3 py-2 text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
                          />
                        </div>

                        {/* Type filter */}
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as AlertType | "all")}
                          className="rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="all">All Types</option>
                          {ALERT_TYPE_OPTIONS.filter((t) => t.value !== "recurring").map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>

                        {/* Status filter */}
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as "all" | "enabled" | "disabled")}
                          className="rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="all">All Status</option>
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </div>

                      {/* Bulk actions */}
                      {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 rounded-md bg-accent/5 border border-accent/20 px-3 py-2">
                          <span className="text-sm font-medium text-accent">
                            {selectedIds.size} selected
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => bulkToggle([...selectedIds], true)}>
                            Enable All
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => bulkToggle([...selectedIds], false)}>
                            Disable All
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { bulkDelete([...selectedIds]); deselectAll(); }} className="text-red-500">
                            Delete All
                          </Button>
                          <Button variant="ghost" size="sm" onClick={deselectAll}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Bell className="h-12 w-12 mx-auto text-text-tertiary" />
                      <h3 className="font-semibold text-lg text-text-primary">
                        {alerts.length === 0 ? "No alerts yet" : "No matching alerts"}
                      </h3>
                      <p className="text-sm text-text-secondary max-w-md mx-auto">
                        {alerts.length === 0
                          ? "Create your first price alert using the form. Get notified when crypto hits your target — supports price thresholds, percentage changes, and volume spikes."
                          : "Try adjusting your search or filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-text-secondary">
                            <th className="pb-3 pr-2 w-8">
                              <button onClick={selectedIds.size === filteredAlerts.length ? deselectAll : selectAll} title="Select all">
                                {selectedIds.size === filteredAlerts.length && filteredAlerts.length > 0 ? (
                                  <CheckSquare className="h-4 w-4 text-accent" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            </th>
                            <SortHeader field="coin">Coin</SortHeader>
                            <SortHeader field="type">Type</SortHeader>
                            <SortHeader field="target">Target</SortHeader>
                            <th className="pb-3 pr-4 font-medium">Now</th>
                            <SortHeader field="priority">Priority</SortHeader>
                            <SortHeader field="status">Status</SortHeader>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAlerts.map((alert) => (
                            <tr
                              key={alert.id}
                              className={cn(
                                "border-b border-border last:border-0 transition-colors",
                                selectedIds.has(alert.id) && "bg-accent/5",
                              )}
                            >
                              <td className="py-3 pr-2">
                                <button onClick={() => toggleSelect(alert.id)}>
                                  {selectedIds.has(alert.id) ? (
                                    <CheckSquare className="h-4 w-4 text-accent" />
                                  ) : (
                                    <Square className="h-4 w-4 text-text-tertiary" />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 pr-4">
                                <div>
                                  <span className="font-medium text-text-primary">{alert.coinName}</span>
                                  {alert.note && (
                                    <p className="text-[10px] text-text-tertiary truncate max-w-[120px]">{alert.note}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 pr-4">
                                <span className="inline-flex items-center gap-1.5">
                                  {typeIcon(alert.type)}
                                  {formatType(alert.type)}
                                </span>
                              </td>
                              <td className="py-3 pr-4 tabular-nums font-medium">
                                {alert.type === "percent_change"
                                  ? `${alert.target}%`
                                  : `$${alert.target.toLocaleString()}`}
                              </td>
                              <td className="py-3 pr-4 tabular-nums text-text-secondary">
                                {currentPrice(alert.coinId)}
                              </td>
                              <td className="py-3 pr-4">
                                {priorityBadge(alert.priority)}
                              </td>
                              <td className="py-3 pr-4">
                                <button
                                  onClick={() => toggleAlert(alert.id)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                                    alert.enabled
                                      ? "bg-green-500/10 text-green-500"
                                      : "bg-text-tertiary/10 text-text-tertiary",
                                  )}
                                >
                                  {alert.enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                                  {alert.enabled ? "Active" : "Paused"}
                                  {alert.cooldownMs > 0 && <RefreshCw className="h-2.5 w-2.5" />}
                                </button>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => duplicateAlert(alert.id)}
                                    aria-label="Duplicate alert"
                                    title="Duplicate"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeAlert(alert.id)}
                                    aria-label="Delete alert"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Triggered History Tab */}
            {activeTab === "triggered" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5" />
                      Triggered History
                    </CardTitle>
                    {triggered.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearTriggered}>
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {triggered.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Clock className="h-12 w-12 mx-auto text-text-tertiary" />
                      <h3 className="font-semibold text-lg text-text-primary">
                        No triggered alerts yet
                      </h3>
                      <p className="text-sm text-text-secondary max-w-md mx-auto">
                        When your price alerts fire, they&apos;ll appear here with timestamp and price details.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {triggered.map((t, i) => (
                        <li
                          key={`${t.id}-${i}`}
                          className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm hover:border-accent/30 transition-colors group"
                        >
                          <div className="mt-0.5">{typeIcon(t.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-text-primary">
                                  {t.coinName}
                                  <span className="ml-2 text-text-secondary font-normal">
                                    {formatType(t.type)}{" "}
                                    {t.type === "percent_change" ? `${t.target}%` : `$${t.target.toLocaleString()}`}
                                  </span>
                                </p>
                                <p className="text-xs text-text-tertiary mt-0.5">
                                  Price was <span className="font-medium">${t.currentPrice.toLocaleString()}</span>
                                  {" · "}
                                  {formatTimeAgo(t.triggeredAt)}
                                  {t.note && <span className="ml-1 italic">— {t.note}</span>}
                                </p>
                              </div>
                              <button
                                onClick={() => removeTriggered(i)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-red-500"
                                title="Remove"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {priorityBadge(t.priority)}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Live Prices Tab */}
            {activeTab === "stats" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-green-500" />
                    Live Prices
                    <span className="text-xs font-normal text-text-tertiary">
                      (coins with active alerts)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(livePrices).length === 0 ? (
                    <p className="text-center py-8 text-sm text-text-tertiary">
                      Create alerts to start tracking live prices.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-text-secondary">
                            <th className="pb-3 pr-4 font-medium">Coin</th>
                            <th className="pb-3 pr-4 font-medium text-right">Price</th>
                            <th className="pb-3 pr-4 font-medium text-right">24h Change</th>
                            <th className="pb-3 font-medium text-right">Active Alerts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(livePrices).map(([id, data]) => {
                            const coinMeta = COIN_OPTIONS.find((c) => c.id === id);
                            const alertCount = alerts.filter((a) => a.coinId === id && a.enabled).length;
                            const change = data.usd_24h_change ?? 0;
                            return (
                              <tr key={id} className="border-b border-border last:border-0">
                                <td className="py-3 pr-4 font-medium text-text-primary">
                                  {coinMeta?.name ?? id}
                                  {coinMeta && (
                                    <span className="ml-1.5 text-xs text-text-tertiary">{coinMeta.symbol}</span>
                                  )}
                                </td>
                                <td className="py-3 pr-4 text-right tabular-nums font-medium text-text-primary">
                                  ${data.usd.toLocaleString()}
                                </td>
                                <td className={cn("py-3 pr-4 text-right tabular-nums font-medium", change >= 0 ? "text-green-500" : "text-red-500")}>
                                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                                </td>
                                <td className="py-3 text-right">
                                  <Badge>{alertCount}</Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

