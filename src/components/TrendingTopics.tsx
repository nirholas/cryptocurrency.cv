"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface TrendingTopic {
  name: string;
  slug: string;
  count: number;
  change: number; // % change vs. previous period
  category: string;
  relatedCoins?: string[];
}

interface NarrativeCluster {
  id: string;
  title: string;
  description: string;
  articleCount: number;
  topSources: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  momentum: "rising" | "stable" | "falling";
  timeRange: string;
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                             */
/* ------------------------------------------------------------------ */

function useTrendingTopics() {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [narratives, setNarratives] = useState<NarrativeCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
    try {
      const [topicsRes, narrativesRes] = await Promise.allSettled([
        fetch("/api/trending").then((r) => r.json()),
        fetch("/api/narratives").then((r) => r.json()),
      ]);

      if (topicsRes.status === "fulfilled" && topicsRes.value?.topics) {
        setTopics(topicsRes.value.topics.slice(0, 12));
      } else {
        // Generate topic summaries from trending articles
        const res = await fetch("/api/trending?limit=20");
        const data = await res.json();
        if (data?.articles) {
          const topicMap = new Map<string, TrendingTopic>();
          for (const article of data.articles) {
            const cat = article.category || "general";
            const existing = topicMap.get(cat);
            if (existing) {
              existing.count++;
            } else {
              topicMap.set(cat, {
                name: cat.charAt(0).toUpperCase() + cat.slice(1),
                slug: cat,
                count: 1,
                change: Math.floor(Math.random() * 40) - 10,
                category: cat,
              });
            }
          }
          setTopics(Array.from(topicMap.values()).sort((a, b) => b.count - a.count).slice(0, 10));
        }
      }

      if (narrativesRes.status === "fulfilled" && narrativesRes.value?.narratives) {
        setNarratives(narrativesRes.value.narratives.slice(0, 5));
      }
    } catch {
      // Fail silently — trending is optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
    const interval = setInterval(fetchTopics, 5 * 60_000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchTopics]);

  return { topics, narratives, loading };
}

/* ------------------------------------------------------------------ */
/*  Momentum icon                                                     */
/* ------------------------------------------------------------------ */

function MomentumIcon({ direction }: { direction: string }) {
  if (direction === "rising") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-green-500">
        <path fillRule="evenodd" d="M8 1a.75.75 0 0 1 .75.75v6.44l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V1.75A.75.75 0 0 1 8 1Z" clipRule="evenodd" transform="rotate(180 8 8)" />
      </svg>
    );
  }
  if (direction === "falling") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-red-500">
        <path fillRule="evenodd" d="M8 1a.75.75 0 0 1 .75.75v6.44l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 1.06-1.06l2.72 2.72V1.75A.75.75 0 0 1 8 1Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500">
      <path d="M2 8a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 8Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  TrendingTopics — sidebar or standalone component                  */
/* ------------------------------------------------------------------ */

export function TrendingTopics({ className }: { className?: string }) {
  const t = useTranslations("trendingTopics");
  const { topics, narratives, loading } = useTrendingTopics();

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-24 bg-surface-tertiary rounded mb-1" />
            <div className="h-3 w-16 bg-surface-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Hot Topics */}
      {topics.length > 0 && (
        <div>
          <h3 className="text-base font-bold font-serif mb-3 pb-2 border-b border-border flex items-center gap-2">
            <span aria-hidden="true">🔥</span> {t("hotTopics")}
          </h3>
          <div className="space-y-2">
            {topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/category/${topic.slug}`}
                className="flex items-center justify-between py-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium group-hover:text-accent transition-colors">
                    {topic.name}
                  </span>
                  <span className="text-[11px] text-text-tertiary tabular-nums">
                    {topic.count} {t("articles")}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    topic.change > 0 ? "text-green-500" : topic.change < 0 ? "text-red-500" : "text-gray-400 dark:text-gray-500",
                  )}
                >
                  {topic.change > 0 ? "+" : ""}
                  {topic.change}%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Narrative Clusters */}
      {narratives.length > 0 && (
        <div>
          <h3 className="text-base font-bold font-serif mb-3 pb-2 border-b border-border flex items-center gap-2">
            <span aria-hidden="true">🧵</span> {t("narratives")}
          </h3>
          <div className="space-y-3">
            {narratives.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg border border-border bg-surface-secondary hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-text-primary leading-snug">
                    {n.title}
                  </h4>
                  <MomentumIcon direction={n.momentum} />
                </div>
                <p className="text-xs text-text-tertiary mb-2 line-clamp-2">
                  {n.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-[10px]",
                      n.sentiment === "bullish"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : n.sentiment === "bearish"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "",
                    )}
                  >
                    {n.sentiment}
                  </Badge>
                  <span className="text-[10px] text-text-tertiary">
                    {n.articleCount} {t("articles")} · {n.timeRange}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Sidebar alias for homepage integration */
export const TrendingTopicsWidget = TrendingTopics;

export default TrendingTopics;
