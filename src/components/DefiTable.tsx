"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export interface DefiProtocol {
  id: string;
  name: string;
  slug: string;
  chain: string;
  chains: string[];
  category: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d?: number;
  mcap?: number;
  symbol?: string;
  logo?: string;
  url?: string;
  twitter?: string;
  description?: string;
  audits?: string;
}

type SortKey = "tvl" | "tvlChange24h" | "tvlChange7d" | "name" | "category" | "mcap";
type SortDir = "asc" | "desc";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BSC: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Solana: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Arbitrum: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Polygon: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Avalanche: "bg-red-500/15 text-red-400 border-red-500/30",
  Optimism: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Base: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Fantom: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Tron: "bg-red-500/15 text-red-300 border-red-500/30",
  Sui: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  Aptos: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  zkSync: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Linea: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  Scroll: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Mantle: "bg-stone-500/15 text-stone-400 border-stone-500/30",
};

function getChainColor(chain: string): string {
  return CHAIN_COLORS[chain] ?? "bg-gray-500/15 text-gray-400 dark:text-gray-500 border-gray-500/30";
}

function formatTvl(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Tiny inline SVG bar showing TVL relative to the max TVL in the set */
function TvlBar({ ratio }: { ratio: number }) {
  return (
    <div className="w-16 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden ml-2 hidden xl:block">
      <div
        className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
        style={{ width: `${Math.max(ratio * 100, 2)}%` }}
      />
    </div>
  );
}

const CATEGORIES = [
  "All",
  "Dexes",
  "Lending",
  "Liquid Staking",
  "Bridge",
  "CDP",
  "Yield",
  "Derivatives",
  "RWA",
] as const;

export default function DefiTable({ protocols }: { protocols: DefiProtocol[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("tvl");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const maxTvl = useMemo(
    () => Math.max(...protocols.map((p) => p.tvl), 1),
    [protocols]
  );

  const filtered = useMemo(() => {
    let list = protocols;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.chains.some((c) => c.toLowerCase().includes(q)) ||
          p.symbol?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "All") {
      list = list.filter(
        (p) => p.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    return list;
  }, [protocols, search, categoryFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "tvl":
          cmp = a.tvl - b.tvl;
          break;
        case "tvlChange24h":
          cmp = a.tvlChange24h - b.tvlChange24h;
          break;
        case "tvlChange7d":
          cmp = (a.tvlChange7d ?? 0) - (b.tvlChange7d ?? 0);
          break;
        case "mcap":
          cmp = (a.mcap ?? 0) - (b.mcap ?? 0);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "name" || key === "category" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  function SortHeader({ label, colKey }: { label: string; colKey: SortKey }) {
    const active = sortKey === colKey;
    return (
      <button
        onClick={() => handleSort(colKey)}
        className={cn(
          "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap",
          active
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        )}
      >
        {label}
        {active && (
          <span className="text-[10px]">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search protocols, chains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors",
                categoryFilter === cat
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30"
                  : "bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Count ── */}
      <p className="text-xs text-[var(--color-text-tertiary)]">
        {sorted.length} protocol{sorted.length !== 1 ? "s" : ""}
        {search && ` matching "${search}"`}
        {categoryFilter !== "All" && ` in ${categoryFilter}`}
      </p>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-left w-10">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  #
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader label="Protocol" colKey="name" />
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  Chain(s)
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader label="TVL" colKey="tvl" />
              </th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">
                <SortHeader label="24h" colKey="tvlChange24h" />
              </th>
              <th className="px-4 py-3 text-right hidden lg:table-cell">
                <SortHeader label="7d" colKey="tvlChange7d" />
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                <SortHeader label="Category" colKey="category" />
              </th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[var(--color-text-tertiary)]"
                >
                  No protocols match your search.
                </td>
              </tr>
            )}
            {sorted.map((protocol, i) => {
              const isExpanded = expandedId === protocol.id;
              return (
                <>
                  <tr
                    key={protocol.id}
                    className={cn(
                      "border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer",
                      isExpanded && "bg-[var(--color-surface-hover)]"
                    )}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : protocol.id)
                    }
                  >
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)] tabular-nums font-medium">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {protocol.logo ? (
                          <img
                            src={protocol.logo}
                            alt=""
                            className="w-7 h-7 rounded-full ring-1 ring-[var(--color-border)]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                            {protocol.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-[var(--color-text-primary)] block truncate">
                            {protocol.name}
                          </span>
                          {protocol.symbol && (
                            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase">
                              {protocol.symbol}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {protocol.chains.slice(0, 3).map((chain) => (
                          <span
                            key={chain}
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                              getChainColor(chain)
                            )}
                          >
                            {chain}
                          </span>
                        ))}
                        {protocol.chains.length > 3 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-gray-500/15 text-gray-400 dark:text-gray-500 border-gray-500/30">
                            +{protocol.chains.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                          {formatTvl(protocol.tvl)}
                        </span>
                        <TvlBar ratio={protocol.tvl / maxTvl} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell tabular-nums font-medium">
                      <span
                        className={cn(
                          protocol.tvlChange24h >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {formatPercentage(protocol.tvlChange24h)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell tabular-nums font-medium">
                      {protocol.tvlChange7d !== undefined ? (
                        <span
                          className={cn(
                            protocol.tvlChange7d >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          {formatPercentage(protocol.tvlChange7d)}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="defi" className="text-xs">
                        {protocol.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
                      <svg
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </td>
                  </tr>

                  {/* ── Expanded Detail Row ── */}
                  {isExpanded && (
                    <tr
                      key={`${protocol.id}-detail`}
                      className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/50"
                    >
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                          {protocol.description && (
                            <div className="sm:col-span-2 lg:col-span-4">
                              <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">
                                {protocol.description}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                              Market Cap
                            </p>
                            <p className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                              {protocol.mcap ? formatTvl(protocol.mcap) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                              TVL / MCap Ratio
                            </p>
                            <p className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                              {protocol.mcap && protocol.mcap > 0
                                ? (protocol.tvl / protocol.mcap).toFixed(2)
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                              Chains
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {protocol.chains.map((chain) => (
                                <span
                                  key={chain}
                                  className={cn(
                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                    getChainColor(chain)
                                  )}
                                >
                                  {chain}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-0.5">
                              Audits
                            </p>
                            <p className="text-[var(--color-text-primary)]">
                              {protocol.audits || "Unknown"}
                            </p>
                          </div>
                          <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
                            {protocol.url && (
                              <a
                                href={protocol.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-[var(--color-accent)] hover:underline"
                              >
                                Website ↗
                              </a>
                            )}
                            {protocol.twitter && (
                              <a
                                href={`https://twitter.com/${protocol.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-[var(--color-accent)] hover:underline"
                              >
                                @{protocol.twitter} ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
