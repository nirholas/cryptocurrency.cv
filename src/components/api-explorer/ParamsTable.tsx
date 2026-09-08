/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { cn } from '@/lib/utils';
import type { ApiParam } from './types';

const LOCATION_HUE: Record<string, string> = {
  path: '#a855f7',
  query: '#3b82f6',
  header: '#64748b',
  cookie: '#64748b',
};

export interface ParamsTableProps {
  params: ApiParam[];
  className?: string;
}

/** Reference table for an operation's parameters. */
export function ParamsTable({ params, className }: ParamsTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-md border border-border', className)}>
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <caption className="sr-only">Request parameters</caption>
        <thead>
          <tr className="bg-surface-secondary">
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Name
            </th>
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              In
            </th>
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Type
            </th>
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Required
            </th>
            <th scope="col" className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={`${param.in}:${param.name}`} className="border-t border-border align-top">
              <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-mono text-[12px] font-medium text-text-primary">
                {param.name}
              </th>
              <td className="px-3 py-2">
                <span
                  className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${LOCATION_HUE[param.in]} 15%, var(--color-surface))`,
                    color: `color-mix(in srgb, ${LOCATION_HUE[param.in]} 74%, var(--color-text-primary))`,
                  }}
                >
                  {param.in}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px] text-accent">{param.type}</td>
              <td className="px-3 py-2 text-xs text-text-secondary">
                {param.required ? (
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #ef4444 15%, var(--color-surface))',
                      color: 'color-mix(in srgb, #ef4444 74%, var(--color-text-primary))',
                    }}
                  >
                    yes
                  </span>
                ) : (
                  <span className="text-text-tertiary">no</span>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-text-secondary">
                {param.description || <span className="text-text-tertiary">No description in the spec.</span>}
                {param.defaultValue !== undefined && (
                  <span className="ml-1 whitespace-nowrap font-mono text-[11px] text-text-tertiary">
                    default: {param.defaultValue}
                  </span>
                )}
                {param.enumValues && (
                  <span className="ml-1 font-mono text-[11px] text-text-tertiary">
                    one of: {param.enumValues.join(', ')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
