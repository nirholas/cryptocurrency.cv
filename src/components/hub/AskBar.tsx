/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Sparkles, Loader2, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  AskBar — Natural language search bar                              */
/* ------------------------------------------------------------------ */

export default function AskBar() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAsk = useCallback(async () => {
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Failed to get answer");
      const data = await res.json();
      setAnswer(data.answer || data.response || data.text || "No answer available.");
    } catch {
      setError("Could not get an answer right now. Try again.");
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAsk();
  };

  const handleClear = () => {
    setQuery("");
    setAnswer(null);
    setError(null);
    inputRef.current?.focus();
  };

  const suggestions = [
    "What's happening with Bitcoin today?",
    "Which DeFi protocols have the highest TVL?",
    "Why is ETH moving?",
    "What are whales buying?",
  ];

  return (
    <section className="border-border border-b">
      <div className="container-main py-6 lg:py-8">
        {/* Search input */}
        <div className="mx-auto max-w-2xl">
          <div className="border-border focus-within:border-accent relative flex items-center rounded-xl border bg-white shadow-sm transition-colors dark:bg-white/5">
            <div className="pointer-events-none pl-4">
              {loading ? (
                <Loader2 className="text-accent h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="text-text-tertiary h-5 w-5" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about crypto markets..."
              className="text-text-primary placeholder:text-text-tertiary w-full bg-transparent px-3 py-4 text-sm outline-none"
            />
            {query && (
              <button
                onClick={handleClear}
                className="text-text-tertiary hover:text-text-secondary px-2 transition-colors"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleAsk}
              disabled={!query.trim() || loading}
              className={cn(
                "mr-2 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                query.trim() && !loading
                  ? "bg-accent text-text-inverse hover:bg-accent-hover"
                  : "bg-border text-text-tertiary cursor-not-allowed",
              )}
            >
              Ask
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Suggestions */}
          {!answer && !error && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    inputRef.current?.focus();
                  }}
                  className="border-border text-text-secondary hover:border-accent hover:text-accent rounded-full border px-3 py-1 text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Answer */}
          {answer && (
            <div className="border-border bg-surface-secondary mt-4 rounded-xl border p-5">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="text-accent h-4 w-4" />
                <span className="text-text-secondary text-xs font-medium">AI Answer</span>
              </div>
              <p className="text-text-primary text-sm leading-relaxed">{answer}</p>
              <button
                onClick={handleClear}
                className="text-accent hover:text-accent-hover mt-3 text-xs font-medium transition-colors"
              >
                Ask another question
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
