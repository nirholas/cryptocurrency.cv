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
import { schemaTypeLabel } from './normalize';
import type { SchemaNode } from './types';

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

/** Child rows of a schema node, if it has any. */
function childrenOf(schema: SchemaNode): { key: string; schema: SchemaNode; required: boolean }[] {
  const composed = schema.allOf ?? schema.oneOf ?? schema.anyOf;
  if (composed?.length) {
    return composed.flatMap((branch, i) =>
      branch.properties
        ? childrenOf(branch)
        : [{ key: `option ${i + 1}`, schema: branch, required: false }],
    );
  }
  if (schema.type === 'array' && schema.items) {
    return [{ key: 'items', schema: schema.items, required: false }];
  }
  if (schema.properties) {
    const required = new Set(schema.required ?? []);
    return Object.entries(schema.properties).map(([key, child]) => ({
      key,
      schema: child,
      required: required.has(key),
    }));
  }
  return [];
}

interface RowProps {
  name: string;
  schema: SchemaNode;
  required: boolean;
  depth: number;
  defaultOpenDepth: number;
}

function SchemaRow({ name, schema, required, depth, defaultOpenDepth }: RowProps) {
  const kids = childrenOf(schema);
  const [open, setOpen] = useState(depth < defaultOpenDepth);
  const hasKids = kids.length > 0;

  return (
    <div>
      <div
        className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-border/60 py-1.5"
        style={{ paddingLeft: depth * 16 }}
      >
        {hasKids ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Chevron open={open} />
            <span className="font-mono text-[12px] font-medium text-text-primary">{name}</span>
          </button>
        ) : (
          <span className="ml-[17px] font-mono text-[12px] font-medium text-text-primary">{name}</span>
        )}

        <span className="font-mono text-[11px] text-accent">{schemaTypeLabel(schema)}</span>

        {required && (
          <span
            className="rounded-sm px-1 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: 'color-mix(in srgb, #ef4444 15%, var(--color-surface))',
              color: 'color-mix(in srgb, #ef4444 74%, var(--color-text-primary))',
            }}
          >
            required
          </span>
        )}

        {schema.description && (
          <span className="basis-full text-xs text-text-secondary sm:basis-auto">{schema.description}</span>
        )}
      </div>

      {hasKids && open && (
        <div>
          {kids.map((child) => (
            <SchemaRow
              key={`${name}.${child.key}`}
              name={child.key}
              schema={child.schema}
              required={child.required}
              depth={depth + 1}
              defaultOpenDepth={defaultOpenDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface SchemaTreeProps {
  schema: SchemaNode;
  defaultOpenDepth?: number;
  className?: string;
}

/**
 * Expandable view of a JSON Schema.
 *
 * Many routes proxy an upstream payload, so their spec entry is an honest
 * permissive object rather than an invented property list. That case renders
 * as an explicit note instead of an empty box.
 */
export function SchemaTree({ schema, defaultOpenDepth = 1, className }: SchemaTreeProps) {
  const kids = childrenOf(schema);

  if (kids.length === 0) {
    return (
      <div className={cn('rounded-md border border-border bg-surface-secondary px-3 py-2.5', className)}>
        <p className="font-mono text-[12px] text-text-primary">{schemaTypeLabel(schema)}</p>
        <p className="mt-1 text-xs text-text-secondary">
          {schema.description ??
            'This endpoint returns a JSON object whose shape is set by the upstream payload.'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-surface-secondary px-3 py-1', className)}>
      {kids.map((child) => (
        <SchemaRow
          key={child.key}
          name={child.key}
          schema={child.schema}
          required={child.required}
          depth={0}
          defaultOpenDepth={defaultOpenDepth}
        />
      ))}
    </div>
  );
}
