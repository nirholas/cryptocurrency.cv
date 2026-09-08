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

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocEntry } from "@/lib/docs";

interface Props {
  entries: TocEntry[];
}

/**
 * On-page table of contents with scroll spy.
 *
 * Uses IntersectionObserver against the rendered heading elements rather than
 * scroll maths, so it stays accurate with images and code blocks of unknown
 * height loading in above the fold.
 */
export function DocsToc({ entries }: Props) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) visible.add(record.target.id);
          else visible.delete(record.target.id);
        }
        // Highlight the topmost heading currently on screen; if none are (the
        // reader is mid-section), keep the last one that scrolled past the top.
        const firstVisible = entries.find((entry) => visible.has(entry.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
          return;
        }
        const scrolledPast = headings.filter((el) => el.getBoundingClientRect().top < 100).pop();
        if (scrolledPast) setActiveId(scrolledPast.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-(--color-text-tertiary)">
        On this page
      </p>
      <ul className="space-y-1 border-l border-(--color-border)">
        {entries.map((entry) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1 transition-colors",
                  entry.depth === 3 ? "pl-6" : "pl-3",
                  active
                    ? "border-(--color-accent) font-medium text-(--color-accent)"
                    : "border-transparent text-(--color-text-secondary) hover:border-(--color-border-hover) hover:text-(--color-text-primary)",
                )}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
