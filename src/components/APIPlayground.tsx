/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Clock,
  Zap,
  Globe,
} from "lucide-react";

/* ─── Endpoint definitions ─── */

interface EndpointParam {
  name: string;
  type: "string" | "number" | "select";
  required?: boolean;
  description: string;
  defaultValue?: string;
  options?: string[];
}

interface EndpointDef {
  id: string;
  label: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  params: EndpointParam[];
  category: string;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: "news",
    label: "News Feed",
    method: "GET",
    path: "/api/news",
    description: "Get latest crypto news articles",
    category: "News",
    params: [
      { name: "limit", type: "number", description: "Number of articles (1-100)", defaultValue: "10" },
      { name: "category", type: "select", description: "Filter by category", options: ["bitcoin", "ethereum", "defi", "nft", "altcoins", "regulation", "trading", "mining", "web3"] },
      { name: "search", type: "string", description: "Search query" },
      { name: "source", type: "string", description: "Filter by source" },
    ],
  },
  {
    id: "prices",
    label: "Prices",
    method: "GET",
    path: "/api/prices",
    description: "Get current cryptocurrency prices",
    category: "Market",
    params: [
      { name: "coin", type: "string", description: "Coin symbol (e.g. bitcoin)" },
      { name: "vs_currency", type: "select", description: "Target currency", options: ["usd", "eur", "gbp", "jpy", "btc"], defaultValue: "usd" },
    ],
  },
  {
    id: "ohlc",
    label: "OHLC Candles",
    method: "GET",
    path: "/api/ohlc",
    description: "Get OHLC candlestick data",
    category: "Market",
    params: [
      { name: "coin", type: "string", description: "Coin ID (e.g. bitcoin)", defaultValue: "bitcoin" },
      { name: "days", type: "number", description: "Number of days", defaultValue: "7" },
    ],
  },
  {
    id: "trending",
    label: "Trending",
    method: "GET",
    path: "/api/trending",
    description: "Get trending coins and topics",
    category: "Market",
    params: [],
  },
  {
    id: "fear-greed",
    label: "Fear & Greed Index",
    method: "GET",
    path: "/api/fear-greed",
    description: "Get market fear and greed index",
    category: "Market",
    params: [
      { name: "limit", type: "number", description: "Number of data points", defaultValue: "7" },
    ],
  },
  {
    id: "sentiment",
    label: "Sentiment",
    method: "GET",
    path: "/api/sentiment",
    description: "Get market sentiment analysis",
    category: "Market",
    params: [
      { name: "coin", type: "string", description: "Coin symbol" },
    ],
  },
  {
    id: "defi",
    label: "DeFi",
    method: "GET",
    path: "/api/defi",
    description: "Get DeFi protocol data and TVL",
    category: "DeFi",
    params: [
      { name: "limit", type: "number", description: "Number of protocols", defaultValue: "20" },
    ],
  },
  {
    id: "yields",
    label: "Yield Farming",
    method: "GET",
    path: "/api/yields",
    description: "Get top DeFi yield opportunities",
    category: "DeFi",
    params: [
      { name: "limit", type: "number", description: "Number of pools", defaultValue: "20" },
    ],
  },
  {
    id: "gas",
    label: "Gas Tracker",
    method: "GET",
    path: "/api/gas",
    description: "Get current gas prices across chains",
    category: "DeFi",
    params: [],
  },
  {
    id: "sources",
    label: "Sources",
    method: "GET",
    path: "/api/sources",
    description: "List all news sources",
    category: "News",
    params: [],
  },
  {
    id: "search",
    label: "Search",
    method: "GET",
    path: "/api/search",
    description: "Full-text search across articles",
    category: "News",
    params: [
      { name: "q", type: "string", required: true, description: "Search query" },
      { name: "limit", type: "number", description: "Number of results", defaultValue: "10" },
    ],
  },
  {
    id: "global",
    label: "Global Stats",
    method: "GET",
    path: "/api/global",
    description: "Get global crypto market statistics",
    category: "Market",
    params: [],
  },
  {
    id: "whale-alerts",
    label: "Whale Alerts",
    method: "GET",
    path: "/api/whale-alerts",
    description: "Get large cryptocurrency transactions",
    category: "On-Chain",
    params: [
      { name: "limit", type: "number", description: "Number of alerts", defaultValue: "10" },
    ],
  },
  {
    id: "exchanges",
    label: "Exchanges",
    method: "GET",
    path: "/api/exchanges",
    description: "List cryptocurrency exchanges",
    category: "Market",
    params: [
      { name: "limit", type: "number", description: "Number of exchanges", defaultValue: "20" },
    ],
  },
  {
    id: "rss",
    label: "RSS Feed",
    method: "GET",
    path: "/api/rss",
    description: "Get RSS feed of latest news",
    category: "Feeds",
    params: [
      { name: "category", type: "select", description: "Filter by category", options: ["bitcoin", "ethereum", "defi", "nft", "altcoins", "regulation"] },
      { name: "limit", type: "number", description: "Number of items", defaultValue: "20" },
    ],
  },
  {
    id: "atom",
    label: "Atom Feed",
    method: "GET",
    path: "/api/atom",
    description: "Get Atom feed of latest news",
    category: "Feeds",
    params: [
      { name: "category", type: "select", description: "Filter by category", options: ["bitcoin", "ethereum", "defi", "nft", "altcoins", "regulation"] },
      { name: "limit", type: "number", description: "Number of items", defaultValue: "20" },
    ],
  },
  {
    id: "export",
    label: "Data Export",
    method: "GET",
    path: "/api/export",
    description: "Export data in JSON, CSV, or Parquet format",
    category: "Data",
    params: [
      { name: "type", type: "select", description: "Data type", options: ["news", "prices", "market"], defaultValue: "news" },
      { name: "format", type: "select", description: "Export format", options: ["json", "csv", "ndjson"], defaultValue: "json" },
      { name: "limit", type: "number", description: "Number of records", defaultValue: "50" },
    ],
  },
];

const CATEGORIES = Array.from(new Set(ENDPOINTS.map((e) => e.category)));

/* ─── Response state ─── */

interface ResponseHeaders {
  [key: string]: string;
}

interface ResponseState {
  status: "idle" | "loading" | "success" | "error";
  code?: number;
  data?: string;
  time?: number;
  size?: string;
  headers?: ResponseHeaders;
}

/* ─── Component ─── */

export default function APIPlayground() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [selectedId, setSelectedId] = useState(ENDPOINTS[0].id);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<ResponseState>({ status: "idle" });
  const [activeTab, setActiveTab] = useState<"body" | "headers" | "curl">("body");
  const [prettyJson, setPrettyJson] = useState(true);
  const [copied, setCopied] = useState(false);
  const [headersOpen, setHeadersOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const endpoint = useMemo(
    () => ENDPOINTS.find((e) => e.id === selectedId) ?? ENDPOINTS[0],
    [selectedId],
  );

  const selectEndpoint = useCallback(
    (id: string) => {
      setSelectedId(id);
      setResponse({ status: "idle" });
      setActiveTab("body");
      // reset params for new endpoint
      const ep = ENDPOINTS.find((e) => e.id === id);
      if (ep) {
        const init: Record<string, string> = {};
        for (const p of ep.params) {
          if (p.defaultValue) init[p.name] = p.defaultValue;
        }
        setParamValues(init);
      } else {
        setParamValues({});
      }
    },
    [],
  );

  // Initialize defaults for first endpoint
  useMemo(() => {
    const init: Record<string, string> = {};
    for (const p of ENDPOINTS[0].params) {
      if (p.defaultValue) init[p.name] = p.defaultValue;
    }
    setParamValues(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildUrl = useCallback(() => {
    const url = new URL(endpoint.path, baseUrl || "https://cryptocurrency.cv");
    for (const [key, val] of Object.entries(paramValues)) {
      if (val.trim()) url.searchParams.set(key, val.trim());
    }
    return url.toString();
  }, [endpoint.path, baseUrl, paramValues]);

  const buildCurl = useCallback(() => {
    return `curl -s "${buildUrl()}" | jq .`;
  }, [buildUrl]);

  const handleSend = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setResponse({ status: "loading" });
    const start = performance.now();

    try {
      const res = await fetch(buildUrl(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const elapsed = Math.round(performance.now() - start);
      const text = await res.text();

      let formatted = text;
      try {
        const obj = JSON.parse(text);
        formatted = JSON.stringify(obj, null, 2);
      } catch {
        /* keep raw */
      }

      const sizeBytes = new TextEncoder().encode(text).length;
      const sizeStr =
        sizeBytes >= 1048576
          ? `${(sizeBytes / 1048576).toFixed(1)} MB`
          : sizeBytes >= 1024
            ? `${(sizeBytes / 1024).toFixed(1)} KB`
            : `${sizeBytes} B`;

      // Capture response headers
      const hdrs: ResponseHeaders = {};
      res.headers.forEach((value, key) => {
        hdrs[key] = value;
      });

      setResponse({
        status: res.ok ? "success" : "error",
        code: res.status,
        data: formatted,
        time: elapsed,
        size: sizeStr,
        headers: hdrs,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const elapsed = Math.round(performance.now() - start);
      setResponse({
        status: "error",
        data: `Network error: ${(err as Error).message}`,
        time: elapsed,
      });
    }
  }, [buildUrl]);

  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setResponse({ status: "idle" });
    const init: Record<string, string> = {};
    for (const p of endpoint.params) {
      if (p.defaultValue) init[p.name] = p.defaultValue;
    }
    setParamValues(init);
  }, [endpoint.params]);

  const handleCopyResponse = useCallback(async () => {
    if (!response.data) return;
    try {
      await navigator.clipboard.writeText(response.data);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = response.data;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [response.data]);

  const displayData = useMemo(() => {
    if (!response.data) return "";
    if (!prettyJson) {
      try {
        return JSON.stringify(JSON.parse(response.data));
      } catch {
        return response.data;
      }
    }
    return response.data;
  }, [response.data, prettyJson]);

  const statusColor =
    response.code && response.code >= 200 && response.code < 300
      ? "text-green-500"
      : response.code && response.code >= 400
        ? "text-red-500"
        : "text-yellow-500";

  const statusBg =
    response.code && response.code >= 200 && response.code < 300
      ? "bg-green-500/10 border-green-500/20"
      : response.code && response.code >= 400
        ? "bg-red-500/10 border-red-500/20"
        : "bg-yellow-500/10 border-yellow-500/20";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* ── Left: Endpoint Selector ── */}
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-(--color-surface) overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-secondary">
            <h3 className="text-sm font-semibold text-text-primary">
              Endpoints
            </h3>
          </div>
          <div className="p-2 max-h-[60vh] overflow-y-auto">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="mb-2">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  {cat}
                </p>
                {ENDPOINTS.filter((e) => e.category === cat).map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => selectEndpoint(ep.id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                      selectedId === ep.id
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:bg-surface-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        ep.method === "GET"
                          ? "bg-green-600/20 text-green-500"
                          : "bg-blue-600/20 text-blue-500",
                      )}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate font-mono text-xs">{ep.path}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Request Builder + Response ── */}
      <div className="space-y-4">
        {/* Endpoint info */}
        <div className="rounded-lg border border-border bg-(--color-surface) overflow-hidden">
          {/* URL bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-secondary">
            <span
              className={cn(
                "shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase text-white",
                endpoint.method === "GET" ? "bg-green-600" : "bg-blue-600",
              )}
            >
              {endpoint.method}
            </span>
            <code className="font-mono text-sm text-text-primary truncate flex-1 select-all">
              {buildUrl()}
            </code>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={response.status === "loading"}
              >
                {response.status === "loading" ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Send Request
                  </>
                )}
              </Button>
              {response.status !== "idle" && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm text-text-secondary">
              {endpoint.description}
            </p>
          </div>

          {/* Parameters */}
          {endpoint.params.length > 0 && (
            <div className="px-4 py-3 border-b border-border space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Parameters
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {endpoint.params.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <label className="flex items-center gap-2 text-sm">
                      <code className="font-mono text-xs bg-surface-tertiary px-1.5 py-0.5 rounded text-text-primary">
                        {p.name}
                      </code>
                      <span className="text-[10px] text-text-tertiary">
                        {p.type}
                      </span>
                      {p.required && (
                        <span className="text-[10px] text-red-500 font-medium">required</span>
                      )}
                    </label>
                    {p.options ? (
                      <select
                        value={paramValues[p.name] || ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [p.name]: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-border bg-surface-secondary px-3 py-1.5 text-sm text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">— any —</option>
                        {p.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={p.type === "number" ? "number" : "text"}
                        value={paramValues[p.name] || ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [p.name]: e.target.value,
                          }))
                        }
                        placeholder={p.description}
                        className="w-full rounded-md border border-border bg-surface-secondary px-3 py-1.5 text-sm text-text-primary font-mono placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response */}
        {response.status !== "idle" && (
          <div className="rounded-lg border border-border bg-(--color-surface) overflow-hidden">
            {/* Response header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-secondary">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Response
                </span>
                {response.code && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-mono font-bold",
                      statusBg,
                      statusColor,
                    )}
                  >
                    {response.code}
                  </span>
                )}
                {response.time !== undefined && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                    <Clock className="h-3 w-3" />
                    {response.time}ms
                  </span>
                )}
                {response.size && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                    <Zap className="h-3 w-3" />
                    {response.size}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {(["body", "headers", "curl"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                      activeTab === tab
                        ? "bg-surface-tertiary text-text-primary"
                        : "text-text-tertiary hover:text-text-secondary",
                    )}
                  >
                    {tab === "body" ? "Body" : tab === "headers" ? "Headers" : "cURL"}
                  </button>
                ))}
              </div>
            </div>

            {response.status === "loading" ? (
              <div className="flex items-center justify-center p-12">
                <svg className="animate-spin h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
              </div>
            ) : activeTab === "curl" ? (
              <div className="p-3">
                <CodeBlock code={buildCurl()} language="bash" />
              </div>
            ) : activeTab === "headers" ? (
              <div className="p-4 space-y-1 max-h-[300px] overflow-y-auto">
                {response.headers && Object.keys(response.headers).length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(response.headers).map(([key, val]) => (
                        <tr key={key} className="border-b border-border">
                          <td className="py-1.5 pr-4 font-mono text-xs text-accent whitespace-nowrap">
                            {key}
                          </td>
                          <td className="py-1.5 font-mono text-xs text-text-secondary break-all">
                            {val}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-text-tertiary">No headers available</p>
                )}
              </div>
            ) : (
              <div>
                {/* Body toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <label className="flex items-center gap-2 text-xs text-text-tertiary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prettyJson}
                      onChange={(e) => setPrettyJson(e.target.checked)}
                      className="accent-accent"
                    />
                    Pretty Print
                  </label>
                  <Button variant="ghost" size="sm" onClick={handleCopyResponse}>
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500 text-xs">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-3">
                  <CodeBlock
                    code={displayData || "No response"}
                    language="json"
                    maxHeight={500}
                    showLineNumbers
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Idle state hint */}
        {response.status === "idle" && (
          <div className="rounded-lg border border-dashed border-border bg-surface-secondary p-12 text-center">
            <Globe className="h-10 w-10 mx-auto mb-3 text-text-tertiary" />
            <p className="text-sm text-text-secondary">
              Select an endpoint and click <strong>Send Request</strong> to see the response
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              No API key required — all endpoints are free and open
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
