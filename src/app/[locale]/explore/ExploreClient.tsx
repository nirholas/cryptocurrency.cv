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

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Search, X, TrendingUp, Hash, Network } from 'lucide-react';

/* Lazy-load graph component (heavy, client-only) */
const EntityRelationships = dynamic(
  () => import('@/components/EntityRelationships'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[500px] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading knowledge graph…</p>
        </div>
      </div>
    ),
  },
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TagData {
  name: string;
  slug: string;
  count: number;
  category?: string;
}

interface TrendingPair {
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  strength: number;
}

interface ExploreClientProps {
  tags: TagData[];
  trendingConnections: TrendingPair[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ExploreClient({
  tags,
  trendingConnections,
}: ExploreClientProps) {
  /* Search */
  const [searchValue, setSearchValue] = useState('');
  const [searchEntity, setSearchEntity] = useState('');

  /* Tag filter */
  const [activeTag, setActiveTag] = useState<string | null>(null);

  /* Highlight pair from trending sidebar */
  const [highlightPair, setHighlightPair] = useState<[string, string] | null>(null);

  /* Search handler */
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchValue.trim();
      if (trimmed) {
        setSearchEntity(trimmed);
        setActiveTag(null);
        setHighlightPair(null);
      }
    },
    [searchValue],
  );

  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSearchEntity('');
  }, []);

  /* Tag click */
  const handleTagClick = useCallback((tag: string) => {
    setActiveTag(prev => (prev === tag ? null : tag));
    setHighlightPair(null);
    setSearchEntity('');
    setSearchValue('');
  }, []);

  /* Trending click */
  const handleTrendingClick = useCallback((pair: TrendingPair) => {
    setHighlightPair([pair.source, pair.target]);
    setActiveTag(null);
    setSearchEntity('');
    setSearchValue('');
  }, []);

  /* Tag sizes for tag cloud */
  const maxTagCount = useMemo(
    () => Math.max(1, ...tags.map(t => t.count)),
    [tags],
  );

  return (
    <div className="space-y-6">
      {/* ---- Search Bar ---- */}
      <form onSubmit={handleSearch} className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder="Search entities — Bitcoin, Vitalik, Coinbase, Layer 2…"
          className="w-full pl-12 pr-10 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-shadow"
        />
        {searchValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--color-surface-secondary)] rounded"
          >
            <X className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          </button>
        )}
      </form>

      {/* Active filter indicator */}
      {(activeTag || searchEntity) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-text-tertiary)]">Filtered by:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-medium text-xs">
            {activeTag ? `#${activeTag}` : searchEntity}
            <button
              onClick={() => {
                setActiveTag(null);
                clearSearch();
              }}
              className="hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* ---- Main grid: Graph + Sidebar ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Graph */}
        <div>
          <EntityRelationships
            searchEntity={searchEntity}
            activeTag={activeTag}
            highlightPair={highlightPair}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Connections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
                Trending Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingConnections.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  No trending connections yet. Data builds as news is analyzed.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {trendingConnections.map((pair, i) => {
                    const isActive =
                      highlightPair?.[0] === pair.source &&
                      highlightPair?.[1] === pair.target;
                    return (
                      <button
                        key={`${pair.source}-${pair.target}-${i}`}
                        onClick={() => handleTrendingClick(pair)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                          isActive
                            ? 'bg-[var(--color-accent)]/10 ring-1 ring-[var(--color-accent)]/30'
                            : 'hover:bg-[var(--color-surface-secondary)]',
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 text-sm">
                          <span className="text-[var(--color-text-primary)] font-medium truncate">
                            {pair.sourceLabel}
                          </span>
                          <span className="text-[var(--color-text-tertiary)] flex-shrink-0">↔</span>
                          <span className="text-[var(--color-text-primary)] font-medium truncate">
                            {pair.targetLabel}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'ml-2 text-xs font-semibold tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded',
                            pair.strength >= 70
                              ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                              : pair.strength >= 40
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                : 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)]',
                          )}
                        >
                          {pair.strength}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Topic Clusters (Tag Cloud) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4 text-[var(--color-accent)]" />
                Topic Clusters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  No topics available yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => {
                    const ratio = tag.count / maxTagCount;
                    // Font size range: 11px - 20px
                    const fontSize = 11 + ratio * 9;
                    const isActive = activeTag === tag.name;
                    return (
                      <button
                        key={tag.slug || tag.name}
                        onClick={() => handleTagClick(tag.name)}
                        className={cn(
                          'px-2 py-0.5 rounded-md transition-all leading-snug',
                          isActive
                            ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)] font-semibold'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]',
                        )}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4 text-[var(--color-accent)]" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                This knowledge graph is built automatically from crypto news articles.
                Entities are extracted using AI and connected based on co-occurrence
                and semantic relationships. The graph updates as new articles are
                ingested.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-tertiary)]">
                <li>• Scroll to zoom in/out</li>
                <li>• Drag background to pan</li>
                <li>• Drag nodes to rearrange</li>
                <li>• Click a node for details</li>
                <li>• Hover to highlight connections</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
