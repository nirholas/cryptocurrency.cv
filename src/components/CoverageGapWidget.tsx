/**
 * Coverage Gap Widget
 *
 * Shows up to 5 underreported crypto topics by fetching /api/coverage-gap.
 * Suitable for the homepage or dashboard as a "what's missing" signal panel.
 */

'use client';

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrors the shape returned by /api/coverage-gap?action=gaps)
// ---------------------------------------------------------------------------

interface CoverageGap {
  id: string;
  topic: string;
  type: 'asset' | 'category' | 'event' | 'narrative';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  marketImpact: number;
  suggestedAngle: string;
  relatedArticles: string[];
  detectedAt: string;
  lastChecked: string;
}

interface ApiResponse {
  success: boolean;
  data: CoverageGap[];
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
};

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CoverageGapWidgetProps {
  /** Max number of gaps to display (default: 5) */
  maxItems?: number;
  /** Optional CSS class to add to the root element */
  className?: string;
}

export default function CoverageGapWidget({
  maxItems = 5,
  className = '',
}: CoverageGapWidgetProps) {
  const [gaps, setGaps] = useState<CoverageGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/coverage-gap?action=gaps&severity=low')
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json() as Promise<ApiResponse>;
      })
      .then((json) => {
        if (!cancelled) {
          setGaps((json.data ?? []).slice(0, maxItems));
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [maxItems]);

  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div
        className={`rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 ${className}`}
        aria-busy="true"
        aria-label="Loading coverage gaps"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" aria-hidden="true">📉</span>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
            Coverage Gaps
          </h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-200 dark:border-red-800 p-4 ${className}`}
        role="alert"
      >
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load coverage gaps: {error}
        </p>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div
        className={`rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 ${className}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg" aria-hidden="true">✅</span>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
            Coverage Gaps
          </h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No significant coverage gaps detected right now.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <section
      className={`rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 ${className}`}
      aria-label="Coverage gap analysis"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">📉</span>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">
            Coverage Gaps
          </h2>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {gaps.length} underreported topic{gaps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Gap cards */}
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800" role="list">
        {gaps.map((gap) => {
          const age = daysSince(gap.detectedAt);
          const severityClass =
            SEVERITY_STYLES[gap.severity] ?? SEVERITY_STYLES.low;
          const severityIcon =
            SEVERITY_ICONS[gap.severity] ?? SEVERITY_ICONS.low;

          return (
            <li key={gap.id} className="px-4 py-3">
              {/* Topic + severity badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span aria-hidden="true">{severityIcon}</span>
                  <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate capitalize">
                    {gap.topic}
                  </span>
                  <span
                    className={`ml-1 flex-shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${severityClass}`}
                  >
                    {gap.severity}
                  </span>
                </div>
                <span className="flex-shrink-0 text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                  {age === 0
                    ? 'today'
                    : age === 1
                    ? '1 day ago'
                    : `${age} days ago`}
                </span>
              </div>

              {/* Suggested angle / headline */}
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {gap.suggestedAngle || gap.description}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Footer link */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800">
        <a
          href="/api/coverage-gap?action=report"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View full coverage report →
        </a>
      </div>
    </section>
  );
}
