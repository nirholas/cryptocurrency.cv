/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  BarChart3,
  Loader2,
} from "lucide-react";

// ---------- Types ------------------------------------------------------------

interface ChartPattern {
  name: string;
  type: "bullish" | "bearish" | "neutral";
  confidence: number;
  description?: string;
}

interface SupportResistance {
  type: "support" | "resistance";
  price: number;
  strength: "weak" | "moderate" | "strong";
}

interface AnalysisResult {
  patterns: ChartPattern[];
  supportResistance: SupportResistance[];
  trend: "bullish" | "bearish" | "sideways";
  trendStrength: number;
  confidence: number;
  summary: string;
  recommendation?: string;
}

// ---------- Component --------------------------------------------------------

export default function ChartAnalysis({
  coinId = "bitcoin",
  timeframe = "1d",
}: {
  coinId?: string;
  timeframe?: string;
}) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/chart-analysis?symbol=${encodeURIComponent(coinId)}&timeframe=${encodeURIComponent(timeframe)}&days=30`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Analysis failed");
      }

      const json = await res.json();
      const raw = json.analysis;

      // Normalize the response into our AnalysisResult shape
      const result: AnalysisResult = {
        patterns: Array.isArray(raw?.patterns)
          ? raw.patterns.map((p: Record<string, unknown>) => ({
              name: (p.name || p.pattern || "Unknown") as string,
              type: (p.type || p.direction || "neutral") as ChartPattern["type"],
              confidence: Number(p.confidence ?? p.probability ?? 50),
              description: (p.description || p.explanation || "") as string,
            }))
          : [],
        supportResistance: Array.isArray(raw?.supportResistance || raw?.support_resistance || raw?.levels)
          ? (raw.supportResistance || raw.support_resistance || raw.levels).map(
              (l: Record<string, unknown>) => ({
                type: (l.type || "support") as SupportResistance["type"],
                price: Number(l.price || l.level || 0),
                strength: (l.strength || "moderate") as SupportResistance["strength"],
              })
            )
          : [],
        trend: (raw?.trend || raw?.direction || "sideways") as AnalysisResult["trend"],
        trendStrength: Number(raw?.trendStrength || raw?.trend_strength || 50),
        confidence: Number(raw?.confidence || raw?.overall_confidence || 50),
        summary: (raw?.summary || raw?.analysis || raw?.description || "Analysis complete.") as string,
        recommendation: (raw?.recommendation || raw?.action || undefined) as string | undefined,
      };

      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [coinId, timeframe]);

  // ---- Trend icon -----------------------------------------------------------

  const TrendIcon =
    analysis?.trend === "bullish"
      ? TrendingUp
      : analysis?.trend === "bearish"
        ? TrendingDown
        : Minus;

  const trendColor =
    analysis?.trend === "bullish"
      ? "text-green-500"
      : analysis?.trend === "bearish"
        ? "text-red-500"
        : "text-text-tertiary";

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Analyze button */}
      <Button
        onClick={analyze}
        disabled={loading}
        variant="primary"
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            Analyze Chart with AI
          </>
        )}
      </Button>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !analysis && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-5 w-32" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analysis results */}
      {analysis && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Trend & Confidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-accent" />
                Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Direction</span>
                <div className={cn("flex items-center gap-1.5 font-semibold capitalize", trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  {analysis.trend}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Trend Strength</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-surface-tertiary">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.min(analysis.trendStrength, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {analysis.trendStrength}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">AI Confidence</span>
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-bold text-text-primary">
                    {analysis.confidence}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detected Patterns */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-accent" />
                Detected Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.patterns.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  No significant patterns detected.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {analysis.patterns.map((p, i) => (
                    <Badge
                      key={i}
                      variant={
                        p.type === "bullish"
                          ? "default"
                          : p.type === "bearish"
                            ? "default"
                            : "default"
                      }
                      className={cn(
                        "text-xs",
                        p.type === "bullish" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                        p.type === "bearish" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                        p.type === "neutral" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}
                    >
                      {p.name} ({p.confidence}%)
                    </Badge>
                  ))}
                </div>
              )}

              {analysis.patterns.length > 0 && analysis.patterns[0].description && (
                <p className="mt-3 text-xs text-text-secondary">
                  {analysis.patterns[0].description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Support & Resistance Levels */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Support &amp; Resistance</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.supportResistance.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  No key levels identified.
                </p>
              ) : (
                <div className="space-y-2">
                  {analysis.supportResistance.map((sr, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-block h-2 w-2 rounded-full",
                            sr.type === "support" ? "bg-green-500" : "bg-red-500"
                          )}
                        />
                        <span className="text-xs font-medium uppercase text-text-secondary">
                          {sr.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-text-primary">
                          ${sr.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wider",
                            sr.strength === "strong"
                              ? "text-accent"
                              : sr.strength === "moderate"
                                ? "text-text-secondary"
                                : "text-text-tertiary"
                          )}
                        >
                          {sr.strength}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">AI Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-text-secondary">
                {analysis.summary}
              </p>
              {analysis.recommendation && (
                <div className="rounded-md bg-surface-tertiary px-3 py-2">
                  <p className="text-xs font-medium text-text-tertiary">
                    Recommendation
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {analysis.recommendation}
                  </p>
                </div>
              )}
              <p className="text-[10px] text-text-tertiary">
                ⚠️ This analysis is AI-generated and for informational purposes only. Not financial advice.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
