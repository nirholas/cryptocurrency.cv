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

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CodeSamples } from './CodeSamples';
import { EndpointDetail } from './EndpointDetail';
import { EndpointList } from './EndpointList';
import { defaultBody, defaultValues } from './request';
import type { AccessTier, ApiOperation, ApiSpecModel } from './types';

/** Serialize an operation for the URL hash. */
function toHash(op: ApiOperation, siblings: number): string {
  return siblings > 1 ? `${op.path}|${op.method}` : op.path;
}

/**
 * Resolve a deep link to an operation.
 *
 * Accepts `#/api/news`, `#/api/news|POST` and `?endpoint=/api/news&method=POST`
 * so a link pasted from the address bar and one built by hand both land.
 */
function resolveDeepLink(operations: ApiOperation[]): ApiOperation | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const rawHash = decodeURIComponent(window.location.hash.replace(/^#/, ''));
  const [hashPath, hashMethod] = rawHash.split('|');

  const path = (hashPath || params.get('endpoint') || '').trim();
  if (!path) return null;

  const method = (hashMethod || params.get('method') || '').trim().toUpperCase();
  const normalized = path.startsWith('/') ? path : `/${path}`;

  const matches = operations.filter((op) => op.path === normalized);
  if (matches.length === 0) return null;
  return matches.find((op) => op.method === method) ?? matches[0];
}

export interface ApiExplorerProps {
  spec: ApiSpecModel;
}

/**
 * Three-pane API explorer: browse on the left, read in the middle, copy or run
 * on the right.
 *
 * Everything rendered here comes from the OpenAPI document the server built in
 * process, so the list, the schemas, the snippets and the live call all move
 * together whenever a route changes.
 */
export function ApiExplorer({ spec }: ApiExplorerProps) {
  /** Operations in tag order, which is the order the sidebar renders. */
  const ordered = useMemo(() => spec.groups.flatMap((group) => group.operations), [spec.groups]);

  /**
   * Landing selection.
   *
   * `GET /api/news` is the flagship free endpoint, so a reader arriving with no
   * deep link sees something they can run immediately rather than whichever
   * operation happens to sort first.
   */
  const landing = useMemo(
    () => ordered.find((op) => op.path === '/api/news' && op.method === 'GET') ?? ordered[0] ?? null,
    [ordered],
  );

  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [accessFilter, setAccessFilter] = useState<AccessTier | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string>(landing?.id ?? '');
  const [activeIndex, setActiveIndex] = useState(0);
  const [listOpen, setListOpen] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [apiKey, setApiKey] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const terms = needle.split(/\s+/).filter(Boolean);

    return ordered.filter((op) => {
      if (methodFilter.length > 0 && !methodFilter.includes(op.method)) return false;
      if (accessFilter !== 'all' && op.access !== accessFilter) return false;
      if (terms.length === 0) return true;
      const haystack = `${op.method} ${op.path} ${op.summary} ${op.tag} ${op.operationId ?? ''}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [ordered, query, methodFilter, accessFilter]);

  const selected = useMemo(
    () => ordered.find((op) => op.id === selectedId) ?? results[0] ?? ordered[0] ?? null,
    [ordered, results, selectedId],
  );

  /** Select an operation and record it in the URL without navigating. */
  const select = useCallback(
    (op: ApiOperation, replace = false) => {
      setSelectedId(op.id);
      setListOpen(false);
      const siblings = ordered.filter((sibling) => sibling.path === op.path).length;
      const url = `${window.location.pathname}#${toHash(op, siblings)}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    },
    [ordered],
  );

  // Deep link on first paint, and again whenever the reader uses back/forward.
  useEffect(() => {
    const apply = (replace: boolean) => {
      const target = resolveDeepLink(ordered);
      if (target) {
        setSelectedId(target.id);
        if (replace) window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
      }
    };
    apply(true);
    const onPopState = () => apply(false);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [ordered]);

  // A new endpoint gets a fresh form seeded from the spec's own defaults.
  useEffect(() => {
    if (!selected) return;
    setValues(defaultValues(selected.params));
    setBody(defaultBody(selected));
  }, [selected]);

  // Keep the keyboard cursor pointing at the selection when the list changes.
  useEffect(() => {
    const index = results.findIndex((op) => op.id === selectedId);
    setActiveIndex(index >= 0 ? index : 0);
  }, [results, selectedId]);

  // `/` focuses search from anywhere on the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      setListOpen(true);
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleMethod = useCallback((method: string) => {
    setMethodFilter((current) =>
      current.includes(method) ? current.filter((m) => m !== method) : [...current, method],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setQuery('');
    setMethodFilter([]);
    setAccessFilter('all');
  }, []);

  const onValueChange = useCallback((key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  }, []);

  const onTagSelect = useCallback((tag: string) => {
    setQuery(tag);
    setMethodFilter([]);
    setAccessFilter('all');
    setListOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="border-b border-border bg-(--color-surface)">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-4 px-4 py-6 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
              API reference · v{spec.version}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {spec.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">
              {spec.counts.operations} operations across {spec.counts.paths} paths.{' '}
              {spec.counts.free} are free to call, {spec.counts.metered} are metered per request over x402.
            </p>
          </div>

          <nav aria-label="API resources" className="flex flex-wrap items-center gap-2">
            <Link
              href="/api/openapi.json"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              OpenAPI spec
            </Link>
            <Link
              href="/x402"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              x402 payments
            </Link>
            <Link
              href="/keys"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              API keys
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_minmax(340px,420px)]">
        <button
          type="button"
          onClick={() => setListOpen((open) => !open)}
          aria-expanded={listOpen}
          aria-controls="apix-sidebar"
          className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-(--color-surface) px-4 py-2.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
        >
          <span>Browse {spec.counts.operations} endpoints</span>
          <span aria-hidden="true">{listOpen ? '−' : '+'}</span>
        </button>

        <aside
          id="apix-sidebar"
          aria-label="Endpoint index"
          className={cn(
            'min-h-0 lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)] lg:self-start',
            listOpen ? 'block h-[60vh]' : 'hidden',
          )}
        >
          <EndpointList
            results={results}
            selectedId={selected?.id ?? null}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            onSelect={(op) => select(op)}
            query={query}
            onQueryChange={setQuery}
            searchRef={searchRef}
            methods={spec.methods}
            methodFilter={methodFilter}
            onToggleMethod={toggleMethod}
            accessFilter={accessFilter}
            onAccessFilterChange={setAccessFilter}
            onResetFilters={resetFilters}
            totalCount={spec.counts.operations}
            freeCount={spec.counts.free}
            meteredCount={spec.counts.metered}
          />
        </aside>

        <main className="min-w-0">
          {selected ? (
            <EndpointDetail
              key={selected.id}
              op={selected}
              spec={spec}
              values={values}
              onValueChange={onValueChange}
              body={body}
              onBodyChange={setBody}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              onTagSelect={onTagSelect}
            />
          ) : (
            <div className="rounded-lg border border-border bg-(--color-surface) p-10 text-center">
              <p className="text-sm font-medium text-text-primary">No endpoint selected</p>
              <p className="mt-1 text-sm text-text-secondary">Pick one from the index to see its contract.</p>
            </div>
          )}
        </main>

        <div className="min-w-0 lg:col-span-2 xl:col-span-1">
          {selected && (
            <div className="xl:sticky xl:top-4">
              <CodeSamples
                op={selected}
                serverUrl={spec.serverUrl}
                values={values}
                body={body}
                apiKey={apiKey}
              />
              <p className="mt-2 px-1 text-[11px] leading-relaxed text-text-tertiary">
                Snippets target {spec.serverUrl} and update as you edit the parameters above. Try it calls this
                origin instead, so it stays same-origin in every environment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
