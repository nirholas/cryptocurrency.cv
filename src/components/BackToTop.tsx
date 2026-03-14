"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(scrollY > 400);
      setScrollPercent(docH > 0 ? Math.min(scrollY / docH, 1) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - scrollPercent * circumference;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-(--color-surface) border border-border shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {/* Circular progress ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        width="44"
        height="44"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <ArrowUp className="h-4 w-4 text-text-primary" aria-hidden="true" />
    </button>
  );
}
