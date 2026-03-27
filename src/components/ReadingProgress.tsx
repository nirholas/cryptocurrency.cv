/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Reading Progress Bar — a fixed-top progress indicator
 * that fills as the user scrolls through article content.
 * Also shows estimated reading time and percent complete.
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const el = document.querySelector("article") ?? document.getElementById("main-content");
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const elTop = rect.top + window.scrollY;
    const elHeight = rect.height;
    const scrolled = window.scrollY - elTop;
    const total = elHeight - window.innerHeight;

    if (total <= 0) {
      setProgress(100);
      setVisible(false);
      return;
    }

    const pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
    setProgress(pct);
    setVisible(scrolled > 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-1 bg-surface-tertiary"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-gradient-to-r from-accent to-blue-500 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
      {/* Percentage chip */}
      <div
        className="absolute top-1.5 right-3 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded
                   bg-surface-secondary text-text-tertiary
                   border border-border shadow-sm opacity-80"
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
}

/**
 * Estimated reading time badge for news cards.
 * Estimates based on word count (200 WPM) with a minimum of 1 min.
 */
export function ReadingTimeBadge({
  text,
  wordCount,
  className,
}: {
  text?: string;
  wordCount?: number;
  className?: string;
}) {
  const words = wordCount ?? (text?.split(/\s+/).length ?? 0);
  const minutes = Math.max(1, Math.ceil(words / 200));

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] text-text-tertiary ${className ?? ""}`}
      title={`~${words} words`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3"
      >
        <path
          fillRule="evenodd"
          d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z"
          clipRule="evenodd"
        />
      </svg>
      {minutes} min
    </span>
  );
}

export default ReadingProgressBar;
