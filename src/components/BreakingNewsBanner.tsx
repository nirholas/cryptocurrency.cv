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
  const urgencyLevel = articles.length >= 3 ? "high" : articles.length >= 2 ? "medium" : "normal";

  return (
    <div
      className={cn(
        "relative text-white overflow-hidden transition-colors",
        urgencyLevel === "high"
          ? "bg-gradient-to-r from-red-700 via-red-600 to-red-700"
          : urgencyLevel === "medium"
            ? "bg-gradient-to-r from-red-600 via-red-500 to-red-600"
            : "bg-red-600"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      {/* Animated pulse background for high urgency */}
      {urgencyLevel === "high" && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
      )}

      <div className="container-main flex items-center h-11 gap-3 relative z-10">
        {/* Badge */}
        <span className="shrink-0 flex items-center gap-1.5 bg-red-800/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
          <AlertTriangle className="h-3 w-3" />
          Breaking
          {articles.length > 1 && (
            <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] leading-none ml-0.5">
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
            className="flex items-center gap-2 text-sm font-medium hover:underline underline-offset-2 truncate animate-[fadeSlideIn_0.4s_ease-out]"
          >
            <span className="truncate">{current.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        </div>

        {/* Source + time */}
        {(current.source || current.pubDate) && (
          <span className="hidden md:flex items-center gap-1.5 text-[11px] text-white/60 shrink-0">
            {current.source && <span>{current.source}</span>}
            {current.pubDate && (
              <>
                <span className="text-white/30">·</span>
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
              className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
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
                    i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to breaking news ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % articles.length)}
              className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
              aria-label="Next breaking news"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
          aria-label="Dismiss breaking news"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Auto-advance progress bar */}
      {articles.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            key={activeIndex}
            className="h-full bg-white/40 animate-[progressBar_6s_linear]"
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
