/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Clock, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BriefData {
  summary: string;
  highlights: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  MarketBrief                                                        */
/* ------------------------------------------------------------------ */

export default function MarketBrief() {
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBrief = useCallback(async () => {
    try {
      // Try the AI brief endpoint, fallback to composing from trending + sentiment
      const res = await fetch("/api/ai/flash-briefing?format=brief");
      if (res.ok) {
        const data = await res.json();
        setBrief({
          summary:
            data.briefing ||
            data.summary ||
            data.text ||
            "Markets are active. Check individual sections for details.",
          highlights: data.highlights || data.key_points || data.bullets || [],
          sentiment: data.sentiment || "neutral",
          generatedAt: data.generated_at || new Date().toISOString(),
        });
        return;
      }
    } catch {
      // fallback below
    }

    // Fallback: compose from trending news
    try {
      const trendRes = await fetch("/api/trending?limit=3");
      if (trendRes.ok) {
        const tData = await trendRes.json();
        const articles = tData.articles || tData.keywords || [];
        const titles = articles.slice(0, 3).map((a: { title?: string; keyword?: string }) => a.title || a.keyword || "");
        setBrief({
          summary: titles.length > 0
            ? `Top stories: ${titles.filter(Boolean).join(" | ")}`
            : "Markets are active across crypto. Explore the dashboard for real-time insights.",
          highlights: titles.filter(Boolean),
          sentiment: "neutral",
          generatedAt: new Date().toISOString(),
        });
      }
    } catch {
      setBrief({
        summary: "Real-time crypto intelligence across 300+ sources. Explore markets, on-chain data, and AI-powered analysis.",
        highlights: [],
        sentiment: "neutral",
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  const sentimentConfig = {
    bullish: { label: "Bullish", color: "text-green-500", bg: "bg-green-500/10" },
    bearish: { label: "Bearish", color: "text-red-500", bg: "bg-red-500/10" },
    neutral: { label: "Neutral", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  };

  const sc = brief ? sentimentConfig[brief.sentiment] : sentimentConfig.neutral;

  return (
    <section className="relative overflow-hidden">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-text-primary) 0.5px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="bg-accent absolute -top-20 right-0 h-80 w-80 rounded-full opacity-[0.04] blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-blue-500 opacity-[0.03] blur-[80px]" />
      </div>

      <div className="container-main relative z-10 py-10 lg:py-14">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-accent/10 text-accent flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              AI Market Brief
            </div>
            {brief && (
              <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", sc.bg, sc.color)}>
                {sc.label}
              </div>
            )}
          </div>

          {/* Summary */}
          {loading ? (
            <div className="space-y-3">
              <div className="bg-border h-8 w-3/4 animate-pulse rounded" />
              <div className="bg-border h-8 w-1/2 animate-pulse rounded" />
              <div className="bg-border mt-4 h-5 w-full animate-pulse rounded" />
            </div>
          ) : brief ? (
            <>
              <h1 className="text-text-primary mb-4 font-serif text-2xl leading-snug font-bold lg:text-3xl">
                {brief.summary}
              </h1>

              {brief.highlights.length > 0 && (
                <ul className="text-text-secondary mb-6 space-y-1.5">
                  {brief.highlights.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="text-accent mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-4">
                <Link
                  href="/intelligence"
                  className="bg-accent text-text-inverse hover:bg-accent-hover inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  Deep Dive
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <div className="text-text-tertiary flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(brief.generatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={fetchBrief}
                    className="hover:text-accent ml-1 transition-colors"
                    aria-label="Refresh brief"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
