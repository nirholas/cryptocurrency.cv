"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Badge, categoryToBadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { SourceInfo } from "@/lib/crypto-news";

/* ─── Types ─── */
interface SourcesGridProps {
  sources: SourceInfo[];
}

type ViewMode = "grid" | "list";
type SortMode = "alpha" | "status" | "category";
type StatusFilter = "all" | "active" | "unavailable" | "unknown";

const ALL_CATEGORY = "all";

/* ─── Main Component ─── */
export default function SourcesGrid({ sources }: SourcesGridProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl+F to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearch("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Derive unique sorted categories
  const categories = useMemo(() => {
    const cats = new Set(sources.map((s) => s.category || "other"));
    return Array.from(cats).sort();
  }, [sources]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { active: 0, unavailable: 0, unknown: 0 };
    for (const s of sources) {
      if (s.status === "active") counts.active++;
      else if (s.status === "unavailable") counts.unavailable++;
      else counts.unknown++;
    }
    return counts;
  }, [sources]);

  // Filter & sort sources
  const filtered = useMemo(() => {
    let result = sources;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Category filter
    if (activeCategory !== ALL_CATEGORY) {
      result = result.filter(
        (s) => (s.category || "other") === activeCategory
      );
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.key.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortMode === "status") {
        const order = { active: 0, unknown: 1, unavailable: 2 };
        const diff = order[a.status] - order[b.status];
        if (diff !== 0) return diff;
      }
      if (sortMode === "category") {
        const diff = (a.category || "other").localeCompare(b.category || "other");
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [sources, activeCategory, search, statusFilter, sortMode]);

  // Group filtered sources by category
  const grouped = useMemo(() => {
    const map: Record<string, SourceInfo[]> = {};
    for (const s of filtered) {
      const cat = s.category || "other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return map;
  }, [filtered]);

  const sortedGroups = Object.keys(grouped).sort();

  const toggleSection = useCallback((cat: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsedSections(new Set()), []);
  const collapseAll = useCallback(
    () => setCollapsedSections(new Set(sortedGroups)),
    [sortedGroups]
  );

  const copyUrl = useCallback((url: string) => {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }, []);

  const statusOptions = [
    { key: "all" as StatusFilter, label: "All", count: sources.length, dotColor: undefined },
    { key: "active" as StatusFilter, label: "Active", count: statusCounts.active, dotColor: "bg-green-500" },
    { key: "unavailable" as StatusFilter, label: "Down", count: statusCounts.unavailable, dotColor: "bg-red-500" },
    { key: "unknown" as StatusFilter, label: "Unknown", count: statusCounts.unknown, dotColor: "bg-yellow-500" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 space-y-4">
        {/* Search + Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search sources... (⌘F)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-(--color-surface) py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View / Sort / Export Controls */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-accent text-white"
                    : "bg-(--color-surface) text-text-tertiary hover:text-text-primary"
                )}
                title="Grid view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-accent text-white"
                    : "bg-(--color-surface) text-text-tertiary hover:text-text-primary"
                )}
                title="List view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border border-border bg-(--color-surface) px-3 py-2 text-xs text-text-secondary outline-none focus:border-accent"
            >
              <option value="alpha">A → Z</option>
              <option value="status">By Status</option>
              <option value="category">By Category</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(({ key, label, count, dotColor }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border flex items-center gap-1.5",
                statusFilter === key
                  ? "bg-accent text-white border-accent"
                  : "bg-surface-secondary text-text-secondary border-border hover:border-border-hover"
              )}
            >
              {dotColor && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />}
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(ALL_CATEGORY)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border",
              activeCategory === ALL_CATEGORY
                ? "bg-accent text-white border-accent"
                : "bg-surface-secondary text-text-secondary border-border hover:border-border-hover"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const count = sources.filter(
              (s) => (s.category || "other") === cat
            ).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors capitalize border",
                  activeCategory === cat
                    ? "bg-accent text-white border-accent"
                    : "bg-surface-secondary text-text-secondary border-border hover:border-border-hover"
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Info Bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-tertiary">
          Showing <span className="font-semibold text-text-primary">{filtered.length}</span> of {sources.length} sources
          {search && (
            <> matching &quot;<span className="text-accent">{search}</span>&quot;</>
          )}
        </p>
        {sortedGroups.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <button onClick={expandAll} className="text-accent hover:underline">
              Expand all
            </button>
            <span className="text-text-tertiary">·</span>
            <button onClick={collapseAll} className="text-accent hover:underline">
              Collapse all
            </button>
          </div>
        )}
      </div>

      {/* Sources Grid / List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border bg-surface-secondary">
          <svg className="mx-auto h-10 w-10 text-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-text-tertiary text-lg">
            No sources match your filters.
          </p>
          <button
            onClick={() => { setSearch(""); setActiveCategory(ALL_CATEGORY); setStatusFilter("all"); }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map((cat) => {
            const isCollapsed = collapsedSections.has(cat);
            const catSources = grouped[cat];
            const activeInCat = catSources.filter((s) => s.status === "active").length;

            return (
              <section key={cat}>
                {/* Category Header (collapsible) */}
                <button
                  onClick={() => toggleSection(cat)}
                  className="w-full flex items-center gap-3 mb-4 group cursor-pointer"
                >
                  <h2 className="font-serif text-xl font-bold text-text-primary capitalize">
                    {cat}
                  </h2>
                  <span className="text-sm font-normal text-text-tertiary">
                    {catSources.length} sources · {activeInCat} active
                  </span>
                  {/* Health bar mini */}
                  <div className="hidden sm:flex items-center gap-1 ml-2">
                    <div className="h-1.5 rounded-full bg-surface-tertiary w-20 overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${catSources.length > 0 ? (activeInCat / catSources.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-tertiary">
                      {catSources.length > 0 ? Math.round((activeInCat / catSources.length) * 100) : 0}%
                    </span>
                  </div>
                  <span className="ml-auto">
                    <svg
                      className={cn("h-4 w-4 text-text-tertiary transition-transform", isCollapsed ? "" : "rotate-180")}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {/* Collapsible Content */}
                {!isCollapsed && (
                  viewMode === "grid" ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {catSources.map((source) => (
                        <SourceCard key={source.key} source={source} onCopy={copyUrl} copiedUrl={copiedUrl} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-(--color-surface) overflow-hidden">
                      <div className="divide-y divide-border">
                        {catSources.map((source) => (
                          <SourceListRow key={source.key} source={source} onCopy={copyUrl} copiedUrl={copiedUrl} />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Source Card (Grid View) ─── */
function SourceCard({
  source, onCopy, copiedUrl,
}: {
  source: SourceInfo;
  onCopy: (url: string) => void;
  copiedUrl: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  const domain = getDomain(source.url);
  const href = getHref(source.url);
  const isCopied = copiedUrl === source.url;

  return (
    <div className="group relative rounded-lg border border-border bg-(--color-surface) px-4 py-3.5 transition-all hover:border-border-hover hover:shadow-md">
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
        {imgError ? (
          <FaviconFallback name={source.name} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt="" width={20} height={20}
            className="mt-0.5 shrink-0 rounded" loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                source.status === "active" ? "bg-green-500" : source.status === "unavailable" ? "bg-red-500" : "bg-yellow-500"
              )}
              title={source.status}
            />
            <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent transition-colors">
              {source.name}
            </p>
          </div>
          <p className="text-xs text-text-tertiary truncate mt-0.5">{domain}</p>
        </div>
        <Badge variant={categoryToBadgeVariant(source.category)} className="shrink-0 mt-0.5">
          {source.category}
        </Badge>
      </a>

      {/* Hover action buttons */}
      <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
        <button
          onClick={(e) => { e.preventDefault(); onCopy(source.url); }}
          className="rounded-md p-1 bg-surface-secondary border border-border text-text-tertiary hover:text-text-primary transition-colors"
          title={isCopied ? "Copied!" : "Copy URL"}
        >
          {isCopied ? (
            <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <a
          href={href} target="_blank" rel="noopener noreferrer"
          className="rounded-md p-1 bg-surface-secondary border border-border text-text-tertiary hover:text-text-primary transition-colors"
          title="Open in new tab"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ─── Source List Row (List View) ─── */
function SourceListRow({
  source, onCopy, copiedUrl,
}: {
  source: SourceInfo;
  onCopy: (url: string) => void;
  copiedUrl: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  const domain = getDomain(source.url);
  const href = getHref(source.url);
  const isCopied = copiedUrl === source.url;

  return (
    <div className="group flex items-center gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors">
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          source.status === "active" ? "bg-green-500" : source.status === "unavailable" ? "bg-red-500" : "bg-yellow-500"
        )}
        title={source.status}
      />
      {imgError ? (
        <FaviconFallback name={source.name} />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt="" width={16} height={16}
          className="shrink-0 rounded" loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
      <a
        href={href} target="_blank" rel="noopener noreferrer"
        className="text-sm font-medium text-text-primary hover:text-accent transition-colors truncate min-w-0 flex-1"
      >
        {source.name}
      </a>
      <span className="hidden md:block text-xs text-text-tertiary truncate max-w-[200px]">{domain}</span>
      <Badge variant={categoryToBadgeVariant(source.category)} className="shrink-0">{source.category}</Badge>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onCopy(source.url)}
          className="rounded p-1 text-text-tertiary hover:text-text-primary transition-colors"
          title={isCopied ? "Copied!" : "Copy URL"}
        >
          {isCopied ? (
            <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
        <a
          href={href} target="_blank" rel="noopener noreferrer"
          className="rounded p-1 text-text-tertiary hover:text-text-primary transition-colors"
          title="Open"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ─── Favicon Fallback ─── */
function FaviconFallback({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-surface-tertiary text-[10px] font-bold text-text-secondary shrink-0">
      {letter}
    </div>
  );
}

/* ─── Helpers ─── */
function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

function getHref(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}
