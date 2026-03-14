"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Smart auto-refresh component for the status page.
 *
 * Features:
 * - Countdown timer showing seconds until next refresh
 * - Pauses when the browser tab is hidden (Page Visibility API)
 * - Manual refresh button
 * - Visual indicator when refreshing
 * - Adjustable interval
 */
export default function StatusAutoRefresh({
  intervalMs = 30000,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(
    Math.floor(intervalMs / 1000)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = Math.floor(intervalMs / 1000);

  const doRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setLastRefresh(new Date());
    setSecondsLeft(totalSeconds);
    // Reset refreshing indicator after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [router, totalSeconds]);

  // Main refresh interval
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      doRefresh();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [doRefresh, intervalMs, isPaused]);

  // Countdown timer (updates every second)
  useEffect(() => {
    if (isPaused) return;

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? totalSeconds : prev - 1));
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [totalSeconds, isPaused]);

  // Page Visibility API — pause when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        // Refresh immediately when tab becomes visible again
        doRefresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [doRefresh]);

  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="container-main">
      <div className="flex items-center justify-between gap-4 py-2 text-xs text-text-tertiary">
        {/* Left: status info */}
        <div className="flex items-center gap-2">
          {/* Animated dot */}
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              isRefreshing
                ? "bg-blue-500 animate-pulse"
                : isPaused
                  ? "bg-yellow-500"
                  : "bg-green-500"
            )}
          />
          <span>
            {isRefreshing
              ? "Refreshing..."
              : isPaused
                ? "Paused (tab hidden)"
                : `Next refresh in ${secondsLeft}s`}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>

          {/* Progress ring (tiny) */}
          <svg
            className="h-4 w-4 -rotate-90"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="2"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 8}`}
              strokeDashoffset={`${2 * Math.PI * 8 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Manual refresh button */}
          <button
            onClick={doRefresh}
            disabled={isRefreshing}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border hover:border-border-hover transition-colors",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
            title="Refresh now"
          >
            <svg
              className={cn(
                "h-3 w-3",
                isRefreshing && "animate-spin"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
