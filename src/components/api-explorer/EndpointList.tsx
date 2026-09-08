/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MethodChip, hueStyle, methodHue } from './MethodChip';
import type { AccessTier, ApiOperation } from './types';

export interface EndpointListProps {
  /** Operations passing the current search and filters, in display order. */
  results: ApiOperation[];
  selectedId: string | null;
  /** Index into `results` highlighted by the keyboard. */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (op: ApiOperation) => void;

  query: string;
  onQueryChange: (value: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;

  methods: string[];
  methodFilter: string[];
  onToggleMethod: (method: string) => void;
  accessFilter: AccessTier | 'all';
  onAccessFilterChange: (value: AccessTier | 'all') => void;
  onResetFilters: () => void;

  totalCount: number;
  freeCount: number;
  meteredCount: number;
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/** A pill toggle used by both filter rows. */
function FilterChip({
  active,
  onClick,
  label,
  hue,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hue?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        'cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        active
          ? 'border-transparent'
          : 'border-border text-text-tertiary hover:border-border-hover hover:text-text-secondary',
      )}
      style={active ? hueStyle(hue ?? 'var(--color-accent)') : undefined}
    >
      {label}
    </button>
  );
}

/**
 * Sticky, searchable endpoint browser.
 *
 * Results stay flat in DOM order so the keyboard walk in `ApiExplorer` maps
 * one-to-one onto `results`; tag headings are rendered inline between items
 * rather than nesting the list, which would break that mapping.
 */
export function EndpointList(props: EndpointListProps) {
  const {
    results,
    selectedId,
    activeIndex,
    onActiveIndexChange,
    onSelect,
    query,
    onQueryChange,
    searchRef,
    methods,
    methodFilter,
    onToggleMethod,
    accessFilter,
    onAccessFilterChange,
    onResetFilters,
    totalCount,
    freeCount,
    meteredCount,
  } = props;

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keep the keyboard cursor in view as it moves, without yanking the page.
  useEffect(() => {
    const node = itemRefs.current[activeIndex];
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  /** Index of the first item of each tag, so headings render between rows. */
  const headings = useMemo(() => {
    const map = new Map<number, string>();
    let current: string | null = null;
    results.forEach((op, i) => {
      if (op.tag !== current) {
        current = op.tag;
        map.set(i, op.tag);
      }
    });
    return map;
  }, [results]);

  const filtersActive = methodFilter.length > 0 || accessFilter !== 'all' || query.trim().length > 0;

  /**
   * Arrow keys walk the results and Enter opens the highlighted one.
   *
   * The handler sits on the panel rather than on each row so it works whether
   * focus is in the search box or already on a row, and every row stays a real
   * button, keeping Tab and Enter working without an ARIA emulation layer.
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (results.length === 0) return;
    const inSearch = event.target === searchRef.current;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const from = inSearch && event.key === 'ArrowDown' ? -1 : activeIndex;
      const next = from + delta;
      if (next < 0) {
        searchRef.current?.focus();
        return;
      }
      const clamped = Math.min(next, results.length - 1);
      onActiveIndexChange(clamped);
      itemRefs.current[clamped]?.focus();
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : results.length - 1;
      onActiveIndexChange(index);
      itemRefs.current[index]?.focus();
      return;
    }

    if (event.key === 'Enter' && inSearch) {
      event.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) onSelect(target);
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-(--color-surface)"
      onKeyDown={handleKeyDown}
    >
      <div className="border-b border-border p-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary">
            <SearchIcon />
          </span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search endpoints"
            aria-label="Search endpoints by path, summary or tag"
            aria-describedby="apix-result-count"
            className="w-full rounded-md border border-border bg-surface-secondary py-1.5 pl-8 pr-12 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 font-mono text-[10px] text-text-tertiary sm:block">
            /
          </kbd>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by HTTP method">
          {methods.map((method) => (
            <FilterChip
              key={method}
              label={method}
              hue={methodHue(method)}
              active={methodFilter.includes(method)}
              onClick={() => onToggleMethod(method)}
            />
          ))}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by access tier">
          <FilterChip
            label={`All ${totalCount}`}
            active={accessFilter === 'all'}
            onClick={() => onAccessFilterChange('all')}
            title="Every documented operation"
          />
          <FilterChip
            label={`Free ${freeCount}`}
            hue="#14b8a6"
            active={accessFilter === 'free'}
            onClick={() => onAccessFilterChange('free')}
            title="No API key and no payment required"
          />
          <FilterChip
            label={`Metered ${meteredCount}`}
            hue="#f59e0b"
            active={accessFilter === 'metered'}
            onClick={() => onAccessFilterChange('metered')}
            title="Billed per request over x402, or unlocked with an API key"
          />
        </div>

        <p id="apix-result-count" className="mt-2 text-[11px] text-text-tertiary" aria-live="polite">
          {results.length} of {totalCount} operations
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
        {results.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">No endpoints match</p>
            <p className="mt-1 text-xs text-text-secondary">
              Nothing here answers to <span className="font-mono text-text-primary">{query || 'these filters'}</span>.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              disabled={!filtersActive}
              className="mt-3 cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {results.map((op, index) => {
              const heading = headings.get(index);
              const selected = op.id === selectedId;
              return (
                <li key={op.id}>
                  {heading && (
                    <h2 className="sticky top-0 z-10 -mx-1.5 bg-(--color-surface)/95 px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary backdrop-blur">
                      {heading}
                    </h2>
                  )}
                  <button
                    type="button"
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    onClick={() => onSelect(op)}
                    onFocus={() => onActiveIndexChange(index)}
                    aria-current={selected ? 'true' : undefined}
                    className={cn(
                      'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      selected
                        ? 'bg-surface-tertiary'
                        : index === activeIndex
                          ? 'bg-surface-secondary'
                          : 'hover:bg-surface-secondary',
                    )}
                  >
                    <MethodChip method={op.method} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate font-mono text-[12px]',
                          selected ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary',
                        )}
                      >
                        {op.path.replace(/^\/api\//, '')}
                      </span>
                    </span>
                    {op.access === 'metered' && (
                      <span
                        aria-label="Metered endpoint"
                        title="Metered endpoint"
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: '#f59e0b' }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-3 border-t border-border px-3 py-2 text-[10px] text-text-tertiary lg:flex">
        <span>
          <kbd className="rounded border border-border px-1 font-mono">/</kbd> search
        </span>
        <span>
          <kbd className="rounded border border-border px-1 font-mono">↑↓</kbd> move
        </span>
        <span>
          <kbd className="rounded border border-border px-1 font-mono">↵</kbd> open
        </span>
      </div>
    </div>
  );
}
