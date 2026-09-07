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
    setLoading(true);

    // 1. The written briefing, when the model is reachable.
    try {
      const res = await fetch("/api/ai/flash-briefing?format=brief");
      if (res.ok) {
        const data = await res.json();
        const summary = data.briefing || data.summary || data.text;
        if (summary) {
          setBrief({
            summary,
            highlights: data.highlights || data.key_points || data.bullets || [],
            sentiment: data.sentiment || "neutral",
            generatedAt: data.generated_at || new Date().toISOString(),
          });
          // This early return used to skip the `finally` that clears the
          // loading flag, so the card sat on its skeleton forever on exactly
          // the path where the briefing had arrived.
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to the trending summary.
    }

    // 2. Fall back to what is actually trending. `/api/trending` answers with
    //    `trending`, not `articles`: reading the wrong key made this branch
    //    silently produce nothing and hand over to the copy below.
    try {
      const trendRes = await fetch("/api/trending?limit=3");
      if (trendRes.ok) {
        const data = await trendRes.json();
        const topics: { topic?: string; recentHeadlines?: string[] }[] = Array.isArray(
          data.trending,
        )
          ? data.trending
          : [];
        const headlines = topics
          .map((t) => t.recentHeadlines?.[0])
          .filter((h): h is string => Boolean(h))
          .slice(0, 3);

        if (headlines.length > 0) {
          setBrief({
            summary: `Leading the feed right now: ${headlines.join(" | ")}`,
            highlights: headlines,
            sentiment: "neutral",
            generatedAt: data.fetchedAt || new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // Nothing to summarise.
    }

    // 3. Neither source answered. Say that, rather than filling the card with
    //    marketing copy dressed as a market read.
    setBrief(null);
    setLoading(false);
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
          ) : (
            <div className="space-y-4">
              <h1 className="text-text-primary font-serif text-2xl leading-snug font-bold lg:text-3xl">
                Today&apos;s briefing is not available right now
              </h1>
              <p className="text-text-secondary max-w-xl text-sm">
                The summary is written from the live feed each time you open this page,
                and neither the model nor the trending feed answered. The rest of the
                hub below is unaffected.
              </p>
              <button
                onClick={fetchBrief}
                className="bg-accent text-text-inverse hover:bg-accent-hover inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
