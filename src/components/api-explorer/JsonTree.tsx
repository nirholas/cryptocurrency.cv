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

import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Rows rendered before a large array/object collapses the remainder. */
const PREVIEW_LIMIT = 50;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('transition-transform duration-150', open ? 'rotate-90' : 'rotate-0')}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Scalar({ value }: { value: unknown }) {
  if (value === null) return <span className="text-text-tertiary">null</span>;
  if (value === undefined) return <span className="text-text-tertiary">undefined</span>;
  if (typeof value === 'string') {
    return <span style={{ color: 'color-mix(in srgb, #10b981 74%, var(--color-text-primary))' }}>&quot;{value}&quot;</span>;
  }
  if (typeof value === 'number') {
    return <span style={{ color: 'color-mix(in srgb, #f59e0b 74%, var(--color-text-primary))' }}>{value}</span>;
  }
  if (typeof value === 'boolean') {
    return <span style={{ color: 'color-mix(in srgb, #a855f7 74%, var(--color-text-primary))' }}>{String(value)}</span>;
  }
  return <span className="text-text-secondary">{String(value)}</span>;
}

interface NodeProps {
  name?: string;
  value: unknown;
  depth: number;
  defaultOpenDepth: number;
  isLast: boolean;
}

function TreeNode({ name, value, depth, defaultOpenDepth, isLast }: NodeProps) {
  const isObject = typeof value === 'object' && value !== null;
  const [open, setOpen] = useState(depth < defaultOpenDepth);
  const [showAll, setShowAll] = useState(false);

  if (!isObject) {
    return (
      <div className="flex gap-1.5 whitespace-pre-wrap break-all py-px" style={{ paddingLeft: depth * 14 }}>
        {name !== undefined && (
          <span style={{ color: 'color-mix(in srgb, #3b82f6 74%, var(--color-text-primary))' }}>
            &quot;{name}&quot;:
          </span>
        )}
        <Scalar value={value} />
        {!isLast && <span className="text-text-tertiary">,</span>}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries: [string, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);

  const shown = showAll ? entries : entries.slice(0, PREVIEW_LIMIT);
  const openBrace = isArray ? '[' : '{';
  const closeBrace = isArray ? ']' : '}';

  return (
    <div>
      <div className="flex items-center gap-1.5 py-px" style={{ paddingLeft: depth * 14 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${name ?? 'root'}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Chevron open={open} />
          {name !== undefined && (
            <span style={{ color: 'color-mix(in srgb, #3b82f6 74%, var(--color-text-primary))' }}>
              &quot;{name}&quot;:
            </span>
          )}
          <span className="text-text-secondary">{openBrace}</span>
          {!open && (
            <span className="text-text-tertiary">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              {closeBrace}
            </span>
          )}
        </button>
      </div>

      {open && (
        <>
          {shown.map(([key, child], i) => (
            <TreeNode
              key={key}
              name={isArray ? undefined : key}
              value={child}
              depth={depth + 1}
              defaultOpenDepth={defaultOpenDepth}
              isLast={i === shown.length - 1 && shown.length === entries.length}
            />
          ))}
          {entries.length > shown.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="cursor-pointer rounded-sm text-text-tertiary underline-offset-2 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ marginLeft: (depth + 1) * 14 }}
            >
              Show {entries.length - shown.length} more
            </button>
          )}
          <div className="py-px text-text-secondary" style={{ paddingLeft: depth * 14 }}>
            {closeBrace}
            {!isLast && <span className="text-text-tertiary">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

export interface JsonTreeProps {
  value: unknown;
  /** Levels expanded on first render. */
  defaultOpenDepth?: number;
  className?: string;
}

/** Expandable, syntax-tinted tree for an arbitrary JSON value. */
export function JsonTree({ value, defaultOpenDepth = 2, className }: JsonTreeProps) {
  return (
    <div className={cn('font-mono text-[12px] leading-5', className)}>
      <TreeNode value={value} depth={0} defaultOpenDepth={defaultOpenDepth} isLast />
    </div>
  );
}
