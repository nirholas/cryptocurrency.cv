"use client";

import { useState, useCallback, useRef } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PlaygroundParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  options?: string[];
}

interface ApiPlaygroundProps {
  method: string;
  path: string;
  baseUrl: string;
  params: PlaygroundParam[];
}

type ResponseState = {
  status: "idle" | "loading" | "success" | "error";
  code?: number;
  data?: string;
  time?: number;
  size?: string;
};

export default function ApiPlayground({
  method,
  path,
  baseUrl,
  params,
}: ApiPlaygroundProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of params) {
      if (p.defaultValue) init[p.name] = p.defaultValue;
    }
    return init;
  });
  const [response, setResponse] = useState<ResponseState>({ status: "idle" });
  const [activeResponseTab, setActiveResponseTab] = useState<"body" | "headers" | "curl">("body");
  const abortRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const cleanPath = path.split("?")[0];
    const url = new URL(cleanPath, baseUrl);
    for (const [key, val] of Object.entries(paramValues)) {
      if (val.trim()) url.searchParams.set(key, val.trim());
    }
    return url.toString();
  }, [path, baseUrl, paramValues]);

  const buildCurl = useCallback(() => {
    return `curl "${buildUrl()}"`;
  }, [buildUrl]);

  const handleTryIt = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResponse({ status: "loading" });
    const startTime = performance.now();

    try {
      const res = await fetch(buildUrl(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const elapsed = Math.round(performance.now() - startTime);
      const text = await res.text();

      // Try to format JSON
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Not JSON, keep raw
      }

      const sizeBytes = new TextEncoder().encode(text).length;
      const sizeStr =
        sizeBytes > 1024
          ? `${(sizeBytes / 1024).toFixed(1)} KB`
          : `${sizeBytes} B`;

      setResponse({
        status: res.ok ? "success" : "error",
        code: res.status,
        data: formatted,
        time: elapsed,
        size: sizeStr,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const elapsed = Math.round(performance.now() - startTime);
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
    setParamValues(() => {
      const init: Record<string, string> = {};
      for (const p of params) {
        if (p.defaultValue) init[p.name] = p.defaultValue;
      }
      return init;
    });
  }, [params]);

  const statusColor =
    response.code && response.code >= 200 && response.code < 300
      ? "text-green-400"
      : response.code && response.code >= 400
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      {/* URL bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
        <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white uppercase shrink-0">
          {method}
        </span>
        <code className="font-mono text-sm text-[var(--color-text-primary)] truncate flex-1 select-all">
          {buildUrl()}
        </code>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleTryIt}
            disabled={response.status === "loading"}
          >
            {response.status === "loading" ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Try it
              </>
            )}
          </Button>
          {response.status !== "idle" && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Parameters */}
      {params.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--color-border)] space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Query Parameters
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {params.map((p) => (
              <div key={p.name} className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <code className="font-mono text-xs bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)]">
                    {p.name}
                  </code>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
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
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="">— select —</option>
                    {p.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={paramValues[p.name] || ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                    placeholder={p.description}
                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] font-mono placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response area */}
      {response.status !== "idle" && (
        <div>
          {/* Response header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                Response
              </span>
              {response.code && (
                <span className={cn("text-xs font-mono font-bold", statusColor)}>
                  {response.code}
                </span>
              )}
              {response.time !== undefined && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {response.time}ms
                </span>
              )}
              {response.size && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {response.size}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(["body", "curl"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveResponseTab(tab)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                    activeResponseTab === tab
                      ? "bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  )}
                >
                  {tab === "body" ? "Body" : "cURL"}
                </button>
              ))}
            </div>
          </div>

          {response.status === "loading" ? (
            <div className="flex items-center justify-center p-8">
              <svg className="animate-spin h-6 w-6 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
            </div>
          ) : activeResponseTab === "curl" ? (
            <div className="p-3">
              <CodeBlock code={buildCurl()} language="bash" />
            </div>
          ) : (
            <div className="p-3">
              <CodeBlock
                code={response.data || "No response"}
                language="json"
                maxHeight={400}
                showLineNumbers={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
