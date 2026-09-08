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
import { cn } from '@/lib/utils';
import { AccessBadge } from './AccessBadge';
import { CopyButton } from './CopyButton';
import { MethodChip } from './MethodChip';
import { ParamsTable } from './ParamsTable';
import { SchemaTree } from './SchemaTree';
import { TryItPanel } from './TryItPanel';
import type { ApiOperation, ApiSpecModel } from './types';

/** Colour for a documented status code, matching the live-response chips. */
function statusHue(status: string): string {
  if (status.startsWith('5')) return '#ef4444';
  if (status === '402') return '#a855f7';
  if (status === '429') return '#f59e0b';
  if (status.startsWith('4')) return '#f97316';
  if (status.startsWith('3')) return '#3b82f6';
  return '#10b981';
}

function SectionHeading({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h3 id={id} className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
      {children}
    </h3>
  );
}

export interface EndpointDetailProps {
  op: ApiOperation;
  spec: ApiSpecModel;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  /** Narrows the sidebar to one tag. */
  onTagSelect: (tag: string) => void;
  className?: string;
}

/** Full reference for one operation: contract, schemas and a live call. */
export function EndpointDetail(props: EndpointDetailProps) {
  const { op, spec, values, onValueChange, body, onBodyChange, apiKey, onApiKeyChange, onTagSelect, className } = props;
  const absoluteUrl = `${spec.serverUrl.replace(/\/$/, '')}${op.path}`;

  return (
    <article className={cn('space-y-6', className)} aria-labelledby="apix-endpoint-heading">
      <header className="rounded-lg border border-border bg-(--color-surface) p-5">
        <div className="flex flex-wrap items-center gap-2">
          <MethodChip method={op.method} size="md" />
          <AccessBadge access={op.access} price={op.price} />
          {op.streaming && (
            <span className="rounded-sm bg-surface-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              SSE stream
            </span>
          )}
          <button
            type="button"
            onClick={() => onTagSelect(op.tag)}
            title={`Show only ${op.tag} endpoints`}
            className="cursor-pointer rounded-sm text-[10px] font-semibold uppercase tracking-wider text-text-tertiary underline-offset-2 transition-colors hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {op.tag}
          </button>
        </div>

        <h1 id="apix-endpoint-heading" className="mt-3 flex flex-wrap items-center gap-2 font-mono text-lg font-semibold leading-tight text-text-primary sm:text-xl">
          <span className="break-all">{op.path}</span>
          <CopyButton value={absoluteUrl} label="Copy endpoint URL" />
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{op.summary}</p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-xs">
          {op.operationId && (
            <div>
              <dt className="text-text-tertiary">Operation ID</dt>
              <dd className="font-mono text-text-primary">{op.operationId}</dd>
            </div>
          )}
          <div>
            <dt className="text-text-tertiary">Auth</dt>
            <dd className="font-mono text-text-primary">
              {op.auth.length === 0 ? 'none required' : op.auth.join(' or ')}
            </dd>
          </div>
          {op.price && (
            <div>
              <dt className="text-text-tertiary">Price</dt>
              <dd className="font-mono text-text-primary">${op.price} per request</dd>
            </div>
          )}
        </dl>

        {op.access === 'metered' && (
          <p className="mt-3 text-xs text-text-secondary">
            Metered over x402. Send an <span className="font-mono">X-PAYMENT</span> header, or an{' '}
            <span className="font-mono">X-API-Key</span> if your plan covers this route.{' '}
            <Link href="/x402" className="text-accent underline-offset-2 hover:underline">
              How payments work
            </Link>
            .
          </p>
        )}
      </header>

      <section aria-labelledby="apix-params-heading" className="rounded-lg border border-border bg-(--color-surface) p-5">
        <SectionHeading id="apix-params-heading">Parameters</SectionHeading>
        {op.params.length > 0 ? (
          <ParamsTable params={op.params} />
        ) : (
          <p className="text-sm text-text-secondary">
            This operation takes no parameters. Call the path as-is.
          </p>
        )}
      </section>

      {op.requestBody && (
        <section aria-labelledby="apix-body-heading" className="rounded-lg border border-border bg-(--color-surface) p-5">
          <SectionHeading id="apix-body-heading">
            Request body ({op.requestBody.mediaType}
            {op.requestBody.required ? ', required' : ''})
          </SectionHeading>
          <p className="mb-2 text-sm text-text-secondary">{op.requestBody.description}</p>
          {op.requestBody.schema ? (
            <SchemaTree schema={op.requestBody.schema} defaultOpenDepth={2} />
          ) : (
            <p className="text-sm text-text-secondary">The spec declares no schema for this body.</p>
          )}
        </section>
      )}

      <section aria-labelledby="apix-responses-heading" className="rounded-lg border border-border bg-(--color-surface) p-5">
        <SectionHeading id="apix-responses-heading">Responses</SectionHeading>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {op.responses.map((response) => (
            <span
              key={response.status}
              title={response.description}
              className="rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${statusHue(response.status)} 15%, var(--color-surface))`,
                color: `color-mix(in srgb, ${statusHue(response.status)} 74%, var(--color-text-primary))`,
              }}
            >
              {response.status}
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {op.responses.map((response) => (
            <div key={response.status}>
              <p className="mb-1.5 text-sm">
                <span className="font-mono font-semibold text-text-primary">{response.status}</span>
                <span className="ml-2 text-text-secondary">{response.description || 'No description in the spec.'}</span>
                {response.mediaType && (
                  <span className="ml-2 font-mono text-[11px] text-text-tertiary">{response.mediaType}</span>
                )}
              </p>
              {response.schema ? (
                <SchemaTree schema={response.schema} defaultOpenDepth={response.status === '200' ? 2 : 1} />
              ) : (
                <p className="text-xs text-text-tertiary">This status carries no body schema.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <TryItPanel
        op={op}
        values={values}
        onValueChange={onValueChange}
        body={body}
        onBodyChange={onBodyChange}
        apiKey={apiKey}
        onApiKeyChange={onApiKeyChange}
        serverUrl={spec.serverUrl}
      />
    </article>
  );
}
