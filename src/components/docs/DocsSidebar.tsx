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

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DocsNavSection } from "@/lib/docs";

interface Props {
  sections: DocsNavSection[];
  /** Slug of the page being read, e.g. `integrations/mcp`. */
  activeSlug: string;
}

function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

/**
 * The documentation sidebar.
 *
 * Sections collapse so 86 pages stay scannable, and the section holding the
 * current page is always open. On narrow screens the whole thing becomes a
 * drawer behind a button, because a fixed sidebar would eat the reading column.
 */
export function DocsSidebar({ sections, activeSlug }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeSection = useMemo(
    () => sections.find((s) => s.items.some((i) => i.slug === activeSlug))?.title ?? null,
    [sections, activeSlug],
  );

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(activeSection ? [activeSection] : sections.slice(0, 2).map((s) => s.title)),
  );

  // Keep the current section open when the reader navigates.
  useEffect(() => {
    if (!activeSection) return;
    setExpanded((prev) => (prev.has(activeSection) ? prev : new Set(prev).add(activeSection)));
  }, [activeSection]);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const toggle = (title: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const tree = (
    <nav aria-label="Documentation" className="text-sm">
      {sections.map((section) => {
        const isOpen = expanded.has(section.title);
        const panelId = `docs-nav-${section.title.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <div key={section.title} className="mb-1">
            <button
              type="button"
              onClick={() => toggle(section.title)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left",
                "text-xs font-semibold uppercase tracking-wide text-(--color-text-tertiary)",
                "transition-colors hover:bg-(--color-surface-secondary) hover:text-(--color-text-primary)",
                "focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:outline-none",
              )}
            >
              <span>{section.title}</span>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              >
                <path d="M7 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <ul
              id={panelId}
              hidden={!isOpen}
              className="mt-0.5 space-y-0.5 border-l border-(--color-border) pl-3 ml-3"
            >
              {section.items.map((item) => {
                const active = item.slug === activeSlug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={docHref(item.slug)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-1.5 transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:outline-none",
                        active
                          ? "bg-(--color-accent)/10 font-medium text-(--color-accent)"
                          : "text-(--color-text-secondary) hover:bg-(--color-surface-secondary) hover:text-(--color-text-primary)",
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-2",
            "text-sm font-medium text-(--color-text-secondary)",
            "transition-colors hover:border-(--color-border-hover) hover:text-(--color-text-primary)",
            "focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:outline-none",
          )}
          aria-haspopup="dialog"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
            <path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Browse docs
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Documentation navigation">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm overflow-y-auto border-r border-(--color-border) bg-(--color-surface) p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-(--color-text-primary)">Documentation</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1 text-(--color-text-tertiary) hover:bg-(--color-surface-secondary) hover:text-(--color-text-primary)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
                  <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {tree}
          </div>
        </div>
      )}

      {/* Desktop rail */}
      <div className="hidden lg:block">{tree}</div>
    </>
  );
}
