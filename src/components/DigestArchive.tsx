"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface DigestItem {
  date: string;
  headline?: string;
  title?: string;
  tldr?: string;
  summary?: string;
  description?: string;
  marketSentiment?: {
    overall: "bullish" | "bearish" | "neutral" | "mixed";
  };
  sections?: { tag?: string; title?: string }[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: "text-green-600 dark:text-green-400",
  bearish: "text-red-600 dark:text-red-400",
  neutral: "text-text-tertiary",
  mixed: "text-yellow-600 dark:text-yellow-400",
};

export default function DigestArchive() {
  const [digests, setDigests] = useState<DigestItem[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchDigests() {
      try {
        const res = await fetch("/api/digest?limit=20");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (cancelled) return;

        const items: DigestItem[] =
          data?.digests ?? data?.items ?? data?.sections ? [data] : [];
        setDigests(Array.isArray(items) ? items : [items]);
        setStatus("loaded");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    fetchDigests();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
        <span className="ml-2 text-sm text-text-tertiary">
          Loading archive…
        </span>
      </div>
    );
  }

  if (status === "error" || digests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-tertiary">
          {status === "error"
            ? "Unable to load the digest archive right now. Please try again later."
            : "No digests available yet. Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {digests.map((digest, i) => {
        const title = digest.headline || digest.title || "Crypto Digest";
        const summary = digest.tldr || digest.summary || digest.description;
        const sentiment = digest.marketSentiment?.overall;
        const dateStr = digest.date
          ? new Date(digest.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : null;

        return (
          <Card
            key={digest.date || i}
            className="group hover:border-accent/50 transition-colors"
          >
            <CardContent className="p-4 md:p-5 flex items-center gap-4">
              {/* date icon */}
              <div className="hidden sm:flex h-10 w-10 rounded-lg bg-surface-secondary items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-text-tertiary" />
              </div>

              {/* content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-text-primary truncate">
                    {title}
                  </h3>
                  {sentiment && (
                    <Badge
                      className={cn(
                        "text-[10px] capitalize",
                        SENTIMENT_COLORS[sentiment]
                      )}
                    >
                      {sentiment}
                    </Badge>
                  )}
                </div>
                {dateStr && (
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {dateStr}
                  </p>
                )}
                {summary && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {summary}
                  </p>
                )}
              </div>

              {/* arrow */}
              <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0 group-hover:text-accent transition-colors" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
