"use client";

import { useState, useEffect, useMemo } from "react";
import type { SourceInfo } from "@/lib/crypto-news";
import SourcesGrid from "@/components/SourcesGrid";

/* ─── Props ─── */
interface SourcesPageClientProps {
  token: string;
}

/* ─── Skeleton Loader ─── */
function DashboardSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-9 w-64 rounded bg-[var(--color-surface-tertiary)] mb-3" />
        <div className="h-4 w-96 max-w-full rounded bg-[var(--color-surface-tertiary)]" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center animate-pulse">
            <div className="h-8 w-12 mx-auto rounded bg-[var(--color-surface-tertiary)] mb-1" />
            <div className="h-3 w-16 mx-auto rounded bg-[var(--color-surface-tertiary)]" />
          </div>
        ))}
      </div>

      {/* Health + Category skeleton */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse">
          <div className="h-5 w-32 rounded bg-[var(--color-surface-tertiary)] mb-4" />
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-[var(--color-surface-tertiary)]" />
            <div className="space-y-3 flex-1">
              <div className="h-3 w-24 rounded bg-[var(--color-surface-tertiary)]" />
              <div className="h-3 w-28 rounded bg-[var(--color-surface-tertiary)]" />
              <div className="h-3 w-20 rounded bg-[var(--color-surface-tertiary)]" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse">
          <div className="h-5 w-44 rounded bg-[var(--color-surface-tertiary)] mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-full rounded bg-[var(--color-surface-tertiary)] mb-1" />
                <div className="h-2 rounded-full bg-[var(--color-surface-tertiary)]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="divider mb-8" />

      {/* Grid skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded bg-[var(--color-surface-tertiary)] mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-[var(--color-surface-tertiary)]" />
                <div className="h-2.5 w-1/2 rounded bg-[var(--color-surface-tertiary)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Main Component ─── */
export default function SourcesPageClient({ token }: SourcesPageClientProps) {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSources() {
      try {
        const res = await fetch(`/api/sources?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setSources(data.sources ?? []);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSources();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <DashboardSkeleton />;

  if (error || sources.length === 0) {
    return (
      <div className="py-20 text-center">
        <svg
          className="mx-auto h-12 w-12 text-[var(--color-text-tertiary)] mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-[var(--color-text-tertiary)] text-lg">
          Unable to load sources.
        </p>
        <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
          Please try again later.
        </p>
      </div>
    );
  }

  return <SourcesDashboard sources={sources} />;
}

/* ─── Dashboard (rendered only after client-side fetch) ─── */
function SourcesDashboard({ sources }: { sources: SourceInfo[] }) {
  const activeCount = sources.filter((s) => s.status === "active").length;
  const unavailableCount = sources.filter((s) => s.status === "unavailable").length;
  const unknownCount = sources.length - activeCount - unavailableCount;

  const { sortedCats, categories, healthPercent } = useMemo(() => {
    const categoryMap: Record<string, { total: number; active: number }> = {};
    for (const s of sources) {
      const cat = s.category || "other";
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, active: 0 };
      categoryMap[cat].total++;
      if (s.status === "active") categoryMap[cat].active++;
    }
    return {
      sortedCats: Object.entries(categoryMap).sort((a, b) => b[1].total - a[1].total),
      categories: new Set(sources.map((s) => s.category || "other")),
      healthPercent: sources.length > 0 ? Math.round((sources.filter((s) => s.status === "active").length / sources.length) * 100) : 0,
    };
  }, [sources]);

  return (
    <>
      {/* Hero Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text-primary)]">
          {sources.length}+ News Sources
        </h1>
        <p className="text-[var(--color-text-secondary)] max-w-2xl text-base leading-relaxed">
          Crypto Vision News aggregates headlines from {sources.length}+ sources
          across {categories.size} categories in the crypto ecosystem —
          updated in real-time, with intelligent health monitoring.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">
            {sources.length}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Total Sources
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-bold text-green-500">
            {activeCount}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Active
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-bold text-red-500">
            {unavailableCount}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Unavailable
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
          <div className="text-3xl font-bold text-[var(--color-accent)]">
            {categories.size}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Categories
          </div>
        </div>
      </div>

      {/* Health Ring + Category Distribution */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Overall Health Ring */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Source Health
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--color-surface-tertiary)"
                  strokeWidth="12"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={healthPercent >= 90 ? "#22c55e" : healthPercent >= 70 ? "#eab308" : "#ef4444"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${healthPercent * 2.64} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {healthPercent}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Active — {activeCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Unavailable — {unavailableCount}
                </span>
              </div>
              {unknownCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-yellow-500 shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Unknown — {unknownCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Category Distribution
          </h2>
          <div className="space-y-2.5">
            {sortedCats.slice(0, 7).map(([cat, { total, active }]) => {
              const pct =
                sources.length > 0
                  ? Math.round((total / sources.length) * 100)
                  : 0;
              const healthPct =
                total > 0 ? Math.round((active / total) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-[var(--color-text-primary)] font-medium">
                      {cat}
                    </span>
                    <span className="text-[var(--color-text-tertiary)] text-xs">
                      {total} ({pct}%) · {healthPct}% healthy
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedCats.length > 7 && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                + {sortedCats.length - 7} more categories
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="divider mb-8" />

      {/* Honeypot — invisible links that bots follow but users never see */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <a href="/api/trap/sources-dump" tabIndex={-1}>Download all sources</a>
        <a href="/api/trap/sources-export" tabIndex={-1}>Export full feed list</a>
        <a href="/sources/download.json" tabIndex={-1}>sources.json</a>
        <a href="/data/feeds-export.csv" tabIndex={-1}>feeds-export.csv</a>
      </div>

      <SourcesGrid sources={sources} />
    </>
  );
}
