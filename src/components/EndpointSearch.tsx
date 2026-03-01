"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SearchableEndpoint {
  method: string;
  path: string;
  description: string;
  categoryId: string;
  categoryTitle: string;
}

interface EndpointSearchProps {
  endpoints: SearchableEndpoint[];
  onSelect: (categoryId: string, path: string) => void;
}

export default function EndpointSearch({
  endpoints,
  onSelect,
}: EndpointSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return endpoints.slice(0, 8);
    const q = query.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.path.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        ep.categoryTitle.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
    );
  }, [query, endpoints]);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        const ep = results[selectedIndex];
        onSelect(ep.categoryId, ep.path);
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    },
    [results, selectedIndex, onSelect]
  );

  const handleSelect = useCallback(
    (ep: SearchableEndpoint) => {
      onSelect(ep.categoryId, ep.path);
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [onSelect]
  );

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder='Search endpoints...  Press "/" to focus'
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
          aria-label="Search API endpoints"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="endpoint-search-results"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-tertiary)]">
          /
        </kbd>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id="endpoint-search-results"
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-2 w-full max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
        >
          {results.map((ep, i) => (
            <button
              key={`${ep.categoryId}-${ep.path}`}
              role="option"
              aria-selected={i === selectedIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(ep)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-[var(--color-border)] last:border-b-0",
                i === selectedIndex
                  ? "bg-[var(--color-accent)]/10"
                  : "hover:bg-[var(--color-surface-secondary)]"
              )}
            >
              <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                {ep.method}
              </span>
              <div className="min-w-0 flex-1">
                <code className="font-mono text-xs text-[var(--color-text-primary)] block truncate">
                  {ep.path}
                </code>
                <span className="text-xs text-[var(--color-text-tertiary)] block truncate">
                  {ep.description}
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0 uppercase">
                {ep.categoryTitle}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl p-6 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            No endpoints found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
