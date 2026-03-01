"use client";

import { useState, useCallback, useMemo } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Download,
  Copy,
  Check,
  FileJson,
  FileSpreadsheet,
  FileCode2,
  Calendar,
  Rss,
  Globe,
  Link2,
  ExternalLink,
} from "lucide-react";

/* ─── Data types ─── */

type DataType = "news" | "prices" | "market" | "defi" | "sources";
type ExportFormat = "json" | "csv" | "xml";

const DATA_TYPES: {
  id: DataType;
  label: string;
  description: string;
  icon: typeof FileJson;
}[] = [
  {
    id: "news",
    label: "News Articles",
    description: "Latest crypto news from all sources",
    icon: FileCode2,
  },
  {
    id: "prices",
    label: "Prices",
    description: "Current and historical crypto prices",
    icon: FileSpreadsheet,
  },
  {
    id: "market",
    label: "Market Data",
    description: "Market cap, volume, supply data",
    icon: FileJson,
  },
  {
    id: "defi",
    label: "DeFi Protocols",
    description: "TVL, yields, and protocol data",
    icon: FileCode2,
  },
  {
    id: "sources",
    label: "Sources",
    description: "All aggregated news sources",
    icon: Globe,
  },
];

const EXPORT_FORMATS: {
  id: ExportFormat;
  label: string;
  mime: string;
  ext: string;
}[] = [
  { id: "json", label: "JSON", mime: "application/json", ext: "json" },
  { id: "csv", label: "CSV", mime: "text/csv", ext: "csv" },
  { id: "xml", label: "XML", mime: "application/xml", ext: "xml" },
];

const CATEGORIES = [
  "all",
  "bitcoin",
  "ethereum",
  "defi",
  "nft",
  "altcoins",
  "regulation",
  "trading",
  "mining",
  "web3",
];

/* ─── RSS/Atom feed config ─── */

interface FeedConfig {
  category: string;
  language: string;
  limit: number;
}

/* ─── Component ─── */

export default function DataExporter() {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://cryptocurrency.cv";

  // Export state
  const [dataType, setDataType] = useState<DataType>("news");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(50);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);

  // Feed config state
  const [feedConfig, setFeedConfig] = useState<FeedConfig>({
    category: "all",
    language: "en",
    limit: 20,
  });
  const [feedPreview, setFeedPreview] = useState<string | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);

  /* ─── Export URL builder ─── */

  const buildExportUrl = useCallback(() => {
    const url = new URL("/api/export", baseUrl);
    url.searchParams.set("type", dataType);
    url.searchParams.set("format", format);
    url.searchParams.set("limit", String(limit));
    if (category !== "all") url.searchParams.set("category", category);
    if (dateFrom) url.searchParams.set("from", dateFrom);
    if (dateTo) url.searchParams.set("to", dateTo);
    return url.toString();
  }, [baseUrl, dataType, format, limit, category, dateFrom, dateTo]);

  /* ─── Estimated file size ─── */

  const estimatedSizeStr = useMemo(() => {
    // Rough estimates per record by format
    const perRecord: Record<ExportFormat, number> = {
      json: 600,
      csv: 200,
      xml: 900,
    };
    const bytes = perRecord[format] * limit;
    if (bytes >= 1048576) return `~${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `~${(bytes / 1024).toFixed(0)} KB`;
    return `~${bytes} B`;
  }, [format, limit]);

  /* ─── Preview ─── */

  const handlePreview = useCallback(async () => {
    setLoading(true);
    setPreview(null);
    try {
      const previewUrl = new URL("/api/export", baseUrl);
      previewUrl.searchParams.set("type", dataType);
      previewUrl.searchParams.set("format", "json"); // always preview as JSON
      previewUrl.searchParams.set("limit", "5");
      if (category !== "all") previewUrl.searchParams.set("category", category);

      const res = await fetch(previewUrl.toString(), {
        headers: { Accept: "application/json" },
      });
      const text = await res.text();

      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      setPreview(formatted);

      const sizeBytes = new TextEncoder().encode(text).length;
      const actual = (sizeBytes / 5) * limit;
      if (actual >= 1048576) {
        setEstimatedSize(`~${(actual / 1048576).toFixed(1)} MB`);
      } else if (actual >= 1024) {
        setEstimatedSize(`~${(actual / 1024).toFixed(0)} KB`);
      } else {
        setEstimatedSize(`~${Math.round(actual)} B`);
      }
    } catch {
      setPreview("// Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, dataType, category, limit]);

  /* ─── Download ─── */

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildExportUrl());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = EXPORT_FORMATS.find((f) => f.id === format)?.ext ?? "json";
      a.href = url;
      a.download = `crypto-${dataType}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [buildExportUrl, format, dataType]);

  /* ─── Copy JSON ─── */

  const handleCopyJson = useCallback(async () => {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = preview;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [preview]);

  /* ─── Feed URLs ─── */

  const rssFeedUrl = useMemo(() => {
    const url = new URL("/api/rss", baseUrl);
    if (feedConfig.category !== "all") url.searchParams.set("category", feedConfig.category);
    if (feedConfig.language !== "en") url.searchParams.set("lang", feedConfig.language);
    url.searchParams.set("limit", String(feedConfig.limit));
    return url.toString();
  }, [baseUrl, feedConfig]);

  const atomFeedUrl = useMemo(() => {
    const url = new URL("/api/atom", baseUrl);
    if (feedConfig.category !== "all") url.searchParams.set("category", feedConfig.category);
    if (feedConfig.language !== "en") url.searchParams.set("lang", feedConfig.language);
    url.searchParams.set("limit", String(feedConfig.limit));
    return url.toString();
  }, [baseUrl, feedConfig]);

  const opmlUrl = useMemo(
    () => `${baseUrl}/api/rss?format=opml`,
    [baseUrl],
  );

  const handleCopyFeedUrl = useCallback(
    async (url: string, label: string) => {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedFeed(label);
      setTimeout(() => setCopiedFeed(null), 2000);
    },
    [],
  );

  const handlePreviewFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedPreview(null);
    try {
      const res = await fetch(rssFeedUrl, { headers: { Accept: "application/xml" } });
      const text = await res.text();
      // Show first ~3000 chars for preview
      setFeedPreview(text.slice(0, 3000) + (text.length > 3000 ? "\n<!-- truncated -->" : ""));
    } catch {
      setFeedPreview("<!-- Failed to load feed preview -->");
    } finally {
      setFeedLoading(false);
    }
  }, [rssFeedUrl]);

  return (
    <div className="space-y-10">
      {/* ─── Section 1: Data Export ─── */}
      <section>
        <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          Data Export
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* Left: Configuration */}
          <div className="space-y-6">
            {/* Data type */}
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Data Type
                </h3>
              </div>
              <div className="p-3 grid gap-2">
                {DATA_TYPES.map((dt) => {
                  const Icon = dt.icon;
                  return (
                    <button
                      key={dt.id}
                      onClick={() => setDataType(dt.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors cursor-pointer",
                        dataType === dt.id
                          ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20"
                          : "hover:bg-[var(--color-surface-secondary)] border border-transparent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          dataType === dt.id
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-text-tertiary)]",
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            dataType === dt.id
                              ? "text-[var(--color-accent)]"
                              : "text-[var(--color-text-primary)]",
                          )}
                        >
                          {dt.label}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {dt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuration */}
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Configuration
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Category */}
                {(dataType === "news" || dataType === "market") && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c === "all" ? "All categories" : c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      From date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      To date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>

                {/* Limit */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Limit ({limit} records)
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
                    <span>10</span>
                    <span>500</span>
                    <span>1000</span>
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Export Format
                  </label>
                  <div className="flex gap-2">
                    {EXPORT_FORMATS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={cn(
                          "flex-1 rounded-md border px-3 py-2 text-sm font-mono font-medium transition-colors cursor-pointer",
                          format === f.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]",
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated size */}
                <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                  <span>Estimated size:</span>
                  <span className="font-mono">{estimatedSize || estimatedSizeStr}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleDownload}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                    Download {format.toUpperCase()}
                  </Button>
                  <Button variant="outline" onClick={handlePreview} disabled={loading}>
                    Preview
                  </Button>
                  {preview && format === "json" && (
                    <Button variant="ghost" onClick={handleCopyJson}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Preview (first 5 rows)
              </h3>
              {estimatedSize && (
                <Badge>{estimatedSize}</Badge>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <svg className="animate-spin h-6 w-6 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : preview ? (
              <div className="p-3">
                <CodeBlock
                  code={preview}
                  language="json"
                  maxHeight={500}
                  showLineNumbers
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileJson className="h-10 w-10 mb-3 text-[var(--color-text-tertiary)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Click <strong>Preview</strong> to see sample data
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Or click <strong>Download</strong> to export directly
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Section 2: RSS/Atom Feed Configurator ─── */}
      <section>
        <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)] mb-6">
          RSS &amp; Atom Feeds
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* Left: Configuration */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Configure Feed
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Category
                </label>
                <select
                  value={feedConfig.category}
                  onChange={(e) =>
                    setFeedConfig((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === "all" ? "All categories" : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Language
                </label>
                <select
                  value={feedConfig.language}
                  onChange={(e) =>
                    setFeedConfig((prev) => ({ ...prev, language: e.target.value }))
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh-CN">中文 (简体)</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              {/* Limit */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Items ({feedConfig.limit})
                </label>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={feedConfig.limit}
                  onChange={(e) =>
                    setFeedConfig((prev) => ({
                      ...prev,
                      limit: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>

              {/* Feed URLs */}
              <div className="space-y-3 pt-2">
                {/* RSS */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Rss className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      RSS 2.0
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-xs font-mono text-[var(--color-text-secondary)] truncate select-all">
                      {rssFeedUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyFeedUrl(rssFeedUrl, "rss")}
                    >
                      {copiedFeed === "rss" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Atom */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Rss className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Atom 1.0
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-xs font-mono text-[var(--color-text-secondary)] truncate select-all">
                      {atomFeedUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyFeedUrl(atomFeedUrl, "atom")}
                    >
                      {copiedFeed === "atom" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* OPML */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      OPML Export
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-xs font-mono text-[var(--color-text-secondary)] truncate select-all">
                      {opmlUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyFeedUrl(opmlUrl, "opml")}
                    >
                      {copiedFeed === "opml" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handlePreviewFeed}>
                <ExternalLink className="h-4 w-4" />
                Preview RSS Feed
              </Button>
            </div>
          </div>

          {/* Right: Feed preview */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Feed Preview
              </h3>
            </div>
            {feedLoading ? (
              <div className="flex items-center justify-center p-12">
                <svg className="animate-spin h-6 w-6 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : feedPreview ? (
              <div className="p-3">
                <CodeBlock
                  code={feedPreview}
                  language="xml"
                  maxHeight={500}
                  showLineNumbers
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Rss className="h-10 w-10 mb-3 text-[var(--color-text-tertiary)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Configure your feed and click <strong>Preview</strong>
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Add the RSS or Atom URL to your favorite feed reader
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
