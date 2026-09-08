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

import { useEffect, useMemo, useRef, useState } from 'react';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import { buildSamples } from './codegen';
import type { ApiOperation } from './types';

export interface CodeSamplesProps {
  op: ApiOperation;
  serverUrl: string;
  values: Record<string, string>;
  body: string;
  apiKey: string;
  className?: string;
}

/**
 * Tabbed client snippets for the selected operation.
 *
 * Tabs follow the WAI-ARIA tabs pattern: arrow keys move between them, and the
 * selected panel is labelled by its tab. The snippets rebuild whenever the
 * reader edits a parameter, so the panel always matches the form above it.
 */
export function CodeSamples({ op, serverUrl, values, body, apiKey, className }: CodeSamplesProps) {
  const samples = useMemo(
    () => buildSamples({ op, serverUrl, values, body, apiKey }),
    [op, serverUrl, values, body, apiKey],
  );

  const [active, setActive] = useState(samples[0].id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // A language choice is a reader preference, not a property of the endpoint:
  // keep it when the selection changes.
  useEffect(() => {
    if (!samples.some((s) => s.id === active)) setActive(samples[0].id);
  }, [samples, active]);

  const current = samples.find((s) => s.id === active) ?? samples[0];

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : samples.length - 1)) % samples.length;
    setActive(samples[next].id);
    tabRefs.current[samples[next].id]?.focus();
  }

  return (
    <section className={cn('rounded-lg border border-border bg-(--color-surface)', className)} aria-label="Code samples">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5" role="tablist" aria-label="Sample language">
        {samples.map((sample, index) => (
          <button
            key={sample.id}
            type="button"
            role="tab"
            id={`apix-tab-${sample.id}`}
            aria-selected={sample.id === active}
            aria-controls={`apix-panel-${sample.id}`}
            tabIndex={sample.id === active ? 0 : -1}
            ref={(node) => {
              tabRefs.current[sample.id] = node;
            }}
            onClick={() => setActive(sample.id)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            className={cn(
              'cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              sample.id === active
                ? 'bg-surface-tertiary text-text-primary'
                : 'text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary',
            )}
          >
            {sample.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`apix-panel-${current.id}`}
        aria-labelledby={`apix-tab-${current.id}`}
        className="p-3"
      >
        <CodeBlock code={current.code} language={current.language} maxHeight={460} />
      </div>
    </section>
  );
}
