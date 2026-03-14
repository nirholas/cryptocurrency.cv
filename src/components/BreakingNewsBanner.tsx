"use client";

import { useState, useEffect, useRef } from "react";
import { X, AlertTriangle, Clock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakingArticle {
  title: string;
  link: string;
  source?: string;
  pubDate?: string;
}

interface BreakingNewsBannerProps {
  articles: BreakingArticle[];
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BreakingNewsBanner({ articles }: BreakingNewsBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle through articles automatically
  useEffect(() => {
    if (dismissed || articles.length <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % articles.length);
    }, 6_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dismissed, articles.length, isPaused]);

  // Persist dismissal in session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = "fcn:breaking-dismissed";
      if (sessionStorage.getItem(key) === "1") setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fcn:breaking-dismissed", "1");
    }
  };

  if (dismissed || articles.length === 0) return null;

  const current = articles[activeIndex];

  return (
    <div
      className={cn(
        "relative overflow-hidden transition-colors border-b border-border",
        "bg-surface-secondary text-text-primary"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      {/* Subtle left accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-amber-500" />

      <div className="container-main flex items-center h-11 gap-3 relative z-10">
        {/* Badge */}
        <span className="shrink-0 flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
          <AlertTriangle className="h-3 w-3" />
          Breaking
          {articles.length > 1 && (
            <span className="bg-amber-500/20 rounded-full px-1.5 py-0.5 text-[10px] leading-none ml-0.5">
              {articles.length}
            </span>
          )}
        </span>

        {/* Content area with crossfade */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <a
            key={activeIndex}
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-text-primary hover:underline underline-offset-2 truncate animate-[fadeSlideIn_0.4s_ease-out]"
          >
            <span className="truncate">{current.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        </div>

        {/* Source + time */}
        {(current.source || current.pubDate) && (
          <span className="hidden md:flex items-center gap-1.5 text-[11px] text-text-tertiary shrink-0">
            {current.source && <span>{current.source}</span>}
            {current.pubDate && (
              <>
                <span className="opacity-40">·</span>
                <Clock className="h-3 w-3" />
                <span>{timeAgo(current.pubDate)}</span>
              </>
            )}
          </span>
        )}

        {/* Navigation arrows */}
        {articles.length > 1 && (
          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + articles.length) % articles.length)}
              className="p-1 hover:bg-surface-tertiary rounded transition-colors cursor-pointer"
              aria-label="Previous breaking news"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {/* Page dots */}
            <div className="flex items-center gap-1 mx-1">
              {articles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all cursor-pointer",
                    i === activeIndex ? "w-4 bg-amber-500" : "w-1.5 bg-border hover:bg-border-hover"
                  )}
                  aria-label={`Go to breaking news ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % articles.length)}
              className="p-1 hover:bg-surface-tertiary rounded transition-colors cursor-pointer"
              aria-label="Next breaking news"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 hover:bg-surface-tertiary rounded transition-colors cursor-pointer"
          aria-label="Dismiss breaking news"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Auto-advance progress bar */}
      {articles.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
          <div
            key={activeIndex}
            className="h-full bg-amber-500/60 animate-[progressBar_6s_linear]"
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
