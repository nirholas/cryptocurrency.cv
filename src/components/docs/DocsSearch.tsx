"use client";

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DocsSearchEntry } from "@/lib/docs";

interface Props {
  entries: DocsSearchEntry[];
}

interface Hit {
  entry: DocsSearchEntry;
  score: number;
  excerpt: string;
}

/**
 * Rank one page against the query.
 *
 * Deliberately simple: a title match beats a section match beats a body match,
 * and every term has to appear somewhere. The whole index is ~100 KB, so this
 * runs in well under a frame and needs no search service.
 */
function score(entry: DocsSearchEntry, terms: string[]): number {
  const title = entry.title.toLowerCase();
  const section = entry.section.toLowerCase();
  const text = entry.text.toLowerCase();
  let total = 0;

  for (const term of terms) {
    if (!title.includes(term) && !section.includes(term) && !text.includes(term)) return 0;
    if (title === term) total += 100;
    else if (title.startsWith(term)) total += 60;
    else if (title.includes(term)) total += 40;
    if (section.includes(term)) total += 8;
    const hits = text.split(term).length - 1;
    total += Math.min(hits, 6) * 2;
  }

  return total;
}

/** A window of body text around the first match, for context under the title. */
function excerptFor(entry: DocsSearchEntry, term: string): string {
  const at = entry.text.toLowerCase().indexOf(term);
  if (at === -1) return entry.text.slice(0, 110);
  const start = Math.max(0, at - 40);
  return (start > 0 ? "…" : "") + entry.text.slice(start, start + 130).trim();
}

/**
 * Documentation search: a command palette over every page.
 *
 * Opens with the `/` key or ⌘K, navigates with the arrow keys, and is fully
 * usable from the keyboard alone.
 */
export function DocsSearch({ entries }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const hits = useMemo<Hit[]>(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return entries
      .map((entry) => ({ entry, score: score(entry, terms), excerpt: excerptFor(entry, terms[0]) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [entries, query]);

  useEffect(() => setCursor(0), [query]);

  // Global shortcuts: "/" and ⌘K / Ctrl+K open the palette.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Keep the highlighted row in view while arrowing through results.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const go = useCallback(
    (hit: Hit | undefined) => {
      if (!hit) return;
      setOpen(false);
      setQuery("");
      router.push(hit.entry.slug ? `/docs/${hit.entry.slug}` : "/docs");
    },
    [router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[cursor]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-secondary)",
          "px-3 py-2 text-sm text-(--color-text-tertiary) transition-colors",
          "hover:border-(--color-border-hover) hover:text-(--color-text-secondary)",
          "focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:outline-none",
        )}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-left">Search docs</span>
        <kbd className="hidden rounded border border-(--color-border) px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          /
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search documentation">
          <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-2xl">
            <div className="flex items-center gap-3 border-b border-(--color-border) px-4">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0 text-(--color-text-tertiary)">
                <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search the documentation"
                aria-label="Search the documentation"
                className="w-full bg-transparent py-3.5 text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none"
              />
              <kbd className="rounded border border-(--color-border) px-1.5 py-0.5 font-mono text-[10px] text-(--color-text-tertiary)">esc</kbd>
            </div>

            {query && hits.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-(--color-text-tertiary)">
                Nothing matches <span className="font-medium text-(--color-text-secondary)">{query}</span>. Try a
                different word, or browse the sidebar.
              </p>
            )}

            {!query && (
              <p className="px-4 py-8 text-center text-sm text-(--color-text-tertiary)">
                Search {entries.length} pages. Try &ldquo;mcp&rdquo;, &ldquo;rate limit&rdquo;, or &ldquo;webhook&rdquo;.
              </p>
            )}

            {hits.length > 0 && (
              <ul ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
                {hits.map((hit, index) => (
                  <li key={hit.entry.slug}>
                    <button
                      type="button"
                      data-active={index === cursor}
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => go(hit)}
                      className={cn(
                        "block w-full px-4 py-2.5 text-left transition-colors",
                        index === cursor ? "bg-(--color-accent)/10" : "hover:bg-(--color-surface-secondary)",
                      )}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-(--color-text-primary)">{hit.entry.title}</span>
                        <span className="text-[11px] text-(--color-text-tertiary)">{hit.entry.section}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-(--color-text-secondary)">{hit.excerpt}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
