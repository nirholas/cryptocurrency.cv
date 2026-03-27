'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { X, AlertTriangle, Clock, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BreakingNewsBanner({ articles }: BreakingNewsBannerProps) {
  const t = useTranslations('breakingNews');
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
    if (typeof window !== 'undefined') {
      const key = 'fcn:breaking-dismissed';
      if (sessionStorage.getItem(key) === '1') setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fcn:breaking-dismissed', '1');
    }
  };

  if (dismissed || articles.length === 0) return null;

  const current = articles[activeIndex];

  return (
    <div
      className={cn(
        'border-border relative overflow-hidden border-b transition-colors',
        'bg-surface-secondary text-text-primary',
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      {/* Subtle left accent line */}
      <div className="absolute top-0 bottom-0 left-0 w-0.75 bg-amber-500" />

      <div className="container-main relative z-10 flex h-11 items-center gap-3">
        {/* Badge */}
        <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          {t('breaking')}
          {articles.length > 1 && (
            <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] leading-none">
              {articles.length}
            </span>
          )}
        </span>

        {/* Content area with crossfade */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <a
            key={activeIndex}
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary flex animate-[fadeSlideIn_0.4s_ease-out] items-center gap-2 truncate text-sm font-medium underline-offset-2 hover:underline"
          >
            <span className="truncate">{current.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        </div>

        {/* Source + time */}
        {(current.source || current.pubDate) && (
          <span className="text-text-tertiary hidden shrink-0 items-center gap-1.5 text-[11px] md:flex">
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
          <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
            <button
              onClick={() =>
                setActiveIndex((prev) => (prev - 1 + articles.length) % articles.length)
              }
              className="hover:bg-surface-tertiary cursor-pointer rounded p-1 transition-colors"
              aria-label={t('previous')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {/* Page dots */}
            <div className="mx-1 flex items-center gap-1">
              {articles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'h-1.5 cursor-pointer rounded-full transition-all',
                    i === activeIndex
                      ? 'w-4 bg-amber-500'
                      : 'bg-border hover:bg-border-hover w-1.5',
                  )}
                  aria-label={t('goTo', { index: i + 1 })}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % articles.length)}
              className="hover:bg-surface-tertiary cursor-pointer rounded p-1 transition-colors"
              aria-label={t('next')}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="hover:bg-surface-tertiary shrink-0 cursor-pointer rounded p-1 transition-colors"
          aria-label={t('dismiss')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Auto-advance progress bar */}
      {articles.length > 1 && !isPaused && (
        <div className="bg-border absolute right-0 bottom-0 left-0 h-0.5">
          <div
            key={activeIndex}
            className="h-full animate-[progressBar_6s_linear] bg-amber-500/60"
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
