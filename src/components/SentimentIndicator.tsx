"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Sentiment types & utilities                                       */
/* ------------------------------------------------------------------ */

export type SentimentLevel =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

interface SentimentConfig {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  barColor: string;
  score: number; // 0-100
}

const SENTIMENT_MAP: Record<SentimentLevel, SentimentConfig> = {
  very_positive: {
    label: "Very Bullish",
    emoji: "🚀",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/40",
    barColor: "bg-green-500",
    score: 90,
  },
  positive: {
    label: "Bullish",
    emoji: "📈",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    barColor: "bg-green-400",
    score: 70,
  },
  neutral: {
    label: "Neutral",
    emoji: "➡️",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800/40",
    barColor: "bg-gray-400 dark:bg-gray-500",
    score: 50,
  },
  negative: {
    label: "Bearish",
    emoji: "📉",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    barColor: "bg-red-400",
    score: 30,
  },
  very_negative: {
    label: "Very Bearish",
    emoji: "🔻",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-900/40",
    barColor: "bg-red-500",
    score: 10,
  },
};

export function getSentimentConfig(level: string): SentimentConfig {
  return SENTIMENT_MAP[level as SentimentLevel] ?? SENTIMENT_MAP.neutral;
}

/* ------------------------------------------------------------------ */
/*  SentimentBadge — Compact badge                                    */
/* ------------------------------------------------------------------ */

export function SentimentBadge({
  sentiment,
  className,
}: {
  sentiment: string;
  className?: string;
}) {
  const config = getSentimentConfig(sentiment);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
        config.color,
        config.bgColor,
        className,
      )}
    >
      <span aria-hidden="true">{config.emoji}</span>
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  SentimentMeter — Visual bar meter for detailed views              */
/* ------------------------------------------------------------------ */

export function SentimentMeter({
  sentiment,
  confidence,
  className,
}: {
  sentiment: string;
  confidence?: number;
  className?: string;
}) {
  const config = getSentimentConfig(sentiment);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", config.color)}>
          {config.emoji} {config.label}
        </span>
        {confidence != null && (
          <span className="text-[11px] text-[var(--color-text-tertiary)]">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", config.barColor)}
          style={{ width: `${config.score}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SentimentDistribution — Pie/bar showing multi-article sentiment   */
/* ------------------------------------------------------------------ */

interface SentimentDistProps {
  counts: {
    very_positive?: number;
    positive?: number;
    neutral?: number;
    negative?: number;
    very_negative?: number;
  };
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  SentimentBanner — Compact banner for homepage market mood          */
/* ------------------------------------------------------------------ */

export function SentimentBanner({ className }: { className?: string }) {
  // Default to neutral - in production this would come from API
  const sentiment = "neutral" as const;
  const config = getSentimentConfig(sentiment);

  return (
    <section className={cn("border-b border-[var(--color-border)]", className)}>
      <div className="container-main py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Market Mood
            </span>
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold", config.bgColor, config.color)}>
              {config.emoji} {config.label}
            </span>
          </div>
          <SentimentMeter sentiment={sentiment} className="hidden sm:flex w-48" />
        </div>
      </div>
    </section>
  );
}

export function SentimentDistribution({ counts, className }: SentimentDistProps) {
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
  if (total === 0) return null;

  const bullish = (counts.very_positive ?? 0) + (counts.positive ?? 0);
  const bearish = (counts.very_negative ?? 0) + (counts.negative ?? 0);
  const neutral = counts.neutral ?? 0;

  const segments: { label: string; value: number; color: string }[] = [
    { label: "Bullish", value: bullish, color: "bg-green-500" },
    { label: "Neutral", value: neutral, color: "bg-gray-400 dark:bg-gray-500" },
    { label: "Bearish", value: bearish, color: "bg-red-500" },
  ];

  return (
    <div className={cn("", className)}>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-2">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className={cn("transition-all duration-500", seg.color)}
              style={{ width: `${(seg.value / total) * 100}%` }}
              title={`${seg.label}: ${seg.value} articles`}
            />
          ) : null,
        )}
      </div>
      {/* Legend */}
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1">
            <span className={cn("inline-block h-2 w-2 rounded-full", seg.color)} />
            {seg.label} ({seg.value})
          </span>
        ))}
      </div>
    </div>
  );
}
