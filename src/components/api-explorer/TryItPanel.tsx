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
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { JsonTree } from './JsonTree';
import { BODY_METHODS, buildRequest } from './request';
import type { ApiOperation } from './types';

/** Give up on a call that has not answered in this long. */
const REQUEST_TIMEOUT_MS = 30_000;

/** How long a stream is sampled before the panel stops reading it. */
const STREAM_SAMPLE_MS = 4_000;
const STREAM_SAMPLE_BYTES = 16_384;

interface TryItResult {
  status: number;
  statusText: string;
  latencyMs: number;
  bytes: number;
  headers: [string, string][];
  /** Parsed JSON body, when the response was JSON. */
  json?: unknown;
  /** Raw text body, always present. */
  text: string;
  /** True when the panel stopped reading a stream early. */
  truncated: boolean;
}

/** Read `Retry-After` (seconds or HTTP-date) as whole seconds. */
function retryAfterSeconds(headers: Headers): number | null {
  const raw = headers.get('retry-after');
  if (raw) {
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) return Math.max(0, Math.round(asNumber));
    const asDate = Date.parse(raw);
    if (Number.isFinite(asDate)) return Math.max(0, Math.round((asDate - Date.now()) / 1000));
  }
  const reset = headers.get('x-ratelimit-reset');
  if (reset) {
    const asNumber = Number(reset);
    if (Number.isFinite(asNumber)) {
      // Some limiters send an epoch, others send a delta.
      const delta = asNumber > 1_000_000_000 ? Math.round(asNumber - Date.now() / 1000) : asNumber;
      return Math.max(0, Math.round(delta));
    }
  }
  return null;
}

/** Pull the human-readable bits out of an x402 payment challenge body. */
function paymentTerms(json: unknown): { price?: string; network?: string; payTo?: string; description?: string } {
  if (typeof json !== 'object' || json === null) return {};
  const accepts = (json as { accepts?: unknown }).accepts;
  const first = Array.isArray(accepts) && typeof accepts[0] === 'object' && accepts[0] !== null
    ? (accepts[0] as Record<string, unknown>)
    : null;
  if (!first) return {};
  const amount = first.maxAmountRequired;
  return {
    price: typeof amount === 'string' || typeof amount === 'number' ? String(amount) : undefined,
    network: typeof first.network === 'string' ? first.network : undefined,
    payTo: typeof first.payTo === 'string' ? first.payTo : undefined,
    description: typeof first.description === 'string' ? first.description : undefined,
  };
}

/** Colour a status code by class. */
function statusHue(status: number): string {
  if (status >= 500) return '#ef4444';
  if (status === 402) return '#a855f7';
  if (status === 429) return '#f59e0b';
  if (status >= 400) return '#f97316';
  if (status >= 300) return '#3b82f6';
  return '#10b981';
}

export interface TryItPanelProps {
  op: ApiOperation;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  /** Absolute production base URL, shown in the request preview. */
  serverUrl: string;
  className?: string;
}

/**
 * Fires the selected operation against this origin and shows what came back.
 *
 * The call is same-origin on purpose: the reader's browser hits the very
 * deployment serving these docs, so the status, latency and headers below are
 * this environment's real behaviour rather than a recorded fixture. Metered
 * endpoints answer 402 without a payment header, which is a documented outcome
 * here, not an error.
 */
export function TryItPanel(props: TryItPanelProps) {
  const { op, values, onValueChange, body, onBodyChange, apiKey, onApiKeyChange, serverUrl, className } = props;

  const [result, setResult] = useState<TryItResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // A response belongs to the endpoint that produced it.
  useEffect(() => {
    setResult(null);
    setError(null);
    abortRef.current?.abort();
  }, [op.id]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Preview the production URL, not `window.location.origin`: it renders the
  // same on the server and after hydration, and it matches the code samples.
  // The live call below still targets this origin so it stays same-origin.
  const built = buildRequest(op, serverUrl, values);
  const hasBody = BODY_METHODS.has(op.method);
  const blocked = built.missingPathParams.length > 0;

  const send = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    setPending(true);
    setError(null);

    const request = buildRequest(op, window.location.origin, values);
    const headers: Record<string, string> = { ...request.headers, Accept: op.streaming ? 'text/event-stream' : 'application/json' };
    if (apiKey.trim()) headers['X-API-Key'] = apiKey.trim();
    if (hasBody && body.trim()) headers['Content-Type'] = 'application/json';

    const startedAt = performance.now();

    try {
      const response = await fetch(request.url, {
        method: op.method,
        headers,
        body: hasBody && body.trim() ? body : undefined,
        signal: controller.signal,
        cache: 'no-store',
      });

      const contentType = response.headers.get('content-type') ?? '';
      let text = '';
      let truncated = false;

      if (op.streaming || contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          const deadline = performance.now() + STREAM_SAMPLE_MS;
          while (performance.now() < deadline && text.length < STREAM_SAMPLE_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
          }
          truncated = true;
          await reader.cancel().catch(() => undefined);
        }
      } else {
        text = await response.text();
      }

      const latencyMs = Math.round(performance.now() - startedAt);

      let json: unknown;
      if (text && (contentType.includes('json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('['))) {
        try {
          json = JSON.parse(text);
        } catch {
          json = undefined;
        }
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        latencyMs,
        bytes: new TextEncoder().encode(text).length,
        headers: [...response.headers.entries()].sort((a, b) => a[0].localeCompare(b[0])),
        json,
        text,
        truncated,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        setError(`The request was cancelled or exceeded ${REQUEST_TIMEOUT_MS / 1000}s.`);
      } else {
        setError(err instanceof Error ? err.message : 'The request failed before a response arrived.');
      }
    } finally {
      clearTimeout(timeout);
      setPending(false);
    }
  }, [apiKey, body, hasBody, op, values]);

  const editable = op.params.filter((p) => p.in !== 'cookie');
  const retryAfter = result ? retryAfterSeconds(new Headers(result.headers)) : null;
  const terms = result?.status === 402 ? paymentTerms(result.json) : {};

  return (
    <section className={cn('rounded-lg border border-border bg-(--color-surface)', className)} aria-label="Try this endpoint">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="font-serif text-base font-bold text-text-primary">Try it</h3>
        <div className="flex items-center gap-2">
          {pending && (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Cancel
            </button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={send}
            disabled={pending || blocked}
            aria-describedby={blocked ? 'apix-blocked' : undefined}
          >
            {pending ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                Sending
              </>
            ) : (
              `Send ${op.method}`
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">{op.method}</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-text-primary">{built.url}</span>
          <CopyButton value={built.url} label="Copy request URL" />
        </div>

        {blocked && (
          <p id="apix-blocked" className="text-xs" style={{ color: 'color-mix(in srgb, #f97316 74%, var(--color-text-primary))' }}>
            Fill the path {built.missingPathParams.length === 1 ? 'parameter' : 'parameters'}{' '}
            <span className="font-mono">{built.missingPathParams.join(', ')}</span> before sending.
          </p>
        )}

        {editable.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Parameters</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {editable.map((param) => {
                const key = `${param.in}:${param.name}`;
                const inputId = `apix-input-${op.id.replace(/[^a-zA-Z0-9]/g, '-')}-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
                return (
                  <div key={key}>
                    <label htmlFor={inputId} className="mb-1 block font-mono text-[11px] text-text-secondary">
                      {param.name}
                      {param.required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
                      <span className="ml-1.5 text-text-tertiary">{param.in}</span>
                    </label>
                    {param.enumValues ? (
                      <select
                        id={inputId}
                        value={values[key] ?? ''}
                        onChange={(e) => onValueChange(key, e.target.value)}
                        className="w-full rounded-md border border-border bg-surface-secondary px-2.5 py-1.5 font-mono text-[12px] text-text-primary transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <option value="">not set</option>
                        {param.enumValues.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        type={param.type.startsWith('number') || param.type.startsWith('integer') ? 'number' : 'text'}
                        value={values[key] ?? ''}
                        onChange={(e) => onValueChange(key, e.target.value)}
                        placeholder={param.defaultValue ?? param.type}
                        title={param.description}
                        className="w-full rounded-md border border-border bg-surface-secondary px-2.5 py-1.5 font-mono text-[12px] text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        {hasBody && (
          <div>
            <label
              htmlFor={`apix-body-${op.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary"
            >
              Request body (JSON)
            </label>
            <textarea
              id={`apix-body-${op.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={Math.min(12, Math.max(4, body.split('\n').length + 1))}
              spellCheck={false}
              className="w-full resize-y rounded-md border border-border bg-surface-secondary px-3 py-2 font-mono text-[12px] text-text-primary transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        )}

        <div>
          <label
            htmlFor={`apix-key-${op.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary"
          >
            X-API-Key (optional)
          </label>
          <input
            id={`apix-key-${op.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            autoComplete="off"
            placeholder="Sent only to this origin, never stored"
            className="w-full rounded-md border border-border bg-surface-secondary px-2.5 py-1.5 font-mono text-[12px] text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        {pending && (
          <div className="space-y-2" aria-live="polite">
            <div className="skeleton h-8 w-full rounded-md" />
            <div className="skeleton h-24 w-full rounded-md" />
          </div>
        )}

        {error && !pending && (
          <div
            role="alert"
            className="rounded-md border px-3 py-2.5"
            style={{
              borderColor: 'color-mix(in srgb, #ef4444 32%, transparent)',
              backgroundColor: 'color-mix(in srgb, #ef4444 10%, var(--color-surface))',
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'color-mix(in srgb, #ef4444 74%, var(--color-text-primary))' }}>
              Request failed
            </p>
            <p className="mt-1 text-xs text-text-secondary">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={send}>
              Try again
            </Button>
          </div>
        )}

        {result && !pending && (
          <div className="space-y-3" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${statusHue(result.status)} 15%, var(--color-surface))`,
                  color: `color-mix(in srgb, ${statusHue(result.status)} 74%, var(--color-text-primary))`,
                }}
              >
                {result.status} {result.statusText}
              </span>
              <span className="font-mono text-xs text-text-tertiary">{result.latencyMs} ms</span>
              <span className="font-mono text-xs text-text-tertiary">{result.bytes.toLocaleString()} B</span>
              {result.truncated && <span className="text-xs text-text-tertiary">stream sampled</span>}
              <CopyButton value={result.text} label="Copy response body" className="ml-auto" />
            </div>

            {result.status === 402 && (
              <div
                className="rounded-md border px-3 py-3"
                style={{
                  borderColor: 'color-mix(in srgb, #a855f7 32%, transparent)',
                  backgroundColor: 'color-mix(in srgb, #a855f7 10%, var(--color-surface))',
                }}
              >
                <p className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, #a855f7 74%, var(--color-text-primary))' }}>
                  Payment required
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  This endpoint is metered. It answered with an x402 challenge instead of data because the request
                  carried no <span className="font-mono">X-PAYMENT</span> header
                  {op.auth.includes('ApiKeyAuth') ? ' and no API key' : ''}.
                </p>
                <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                  {op.price && (
                    <>
                      <dt className="text-text-tertiary">Listed price</dt>
                      <dd className="font-mono text-text-primary">${op.price} per request</dd>
                    </>
                  )}
                  {terms.price && (
                    <>
                      <dt className="text-text-tertiary">Quoted amount</dt>
                      <dd className="font-mono text-text-primary">{terms.price} (atomic units)</dd>
                    </>
                  )}
                  {terms.network && (
                    <>
                      <dt className="text-text-tertiary">Network</dt>
                      <dd className="font-mono text-text-primary">{terms.network}</dd>
                    </>
                  )}
                  {terms.payTo && (
                    <>
                      <dt className="text-text-tertiary">Pay to</dt>
                      <dd className="truncate font-mono text-text-primary">{terms.payTo}</dd>
                    </>
                  )}
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="primary" size="sm">
                    <Link href="/x402">How x402 payments work</Link>
                  </Button>
                  {op.auth.includes('ApiKeyAuth') && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/keys">Use an API key instead</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {result.status === 429 && (
              <div
                className="rounded-md border px-3 py-3"
                style={{
                  borderColor: 'color-mix(in srgb, #f59e0b 32%, transparent)',
                  backgroundColor: 'color-mix(in srgb, #f59e0b 10%, var(--color-surface))',
                }}
              >
                <p className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, #f59e0b 74%, var(--color-text-primary))' }}>
                  Rate limited
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {retryAfter === null
                    ? 'The limiter did not send a Retry-After value. Back off and retry in a minute.'
                    : `Wait ${retryAfter} second${retryAfter === 1 ? '' : 's'} before retrying: that is the Retry-After the limiter returned.`}
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={send}>
                  Retry now
                </Button>
              </div>
            )}

            <details className="rounded-md border border-border bg-surface-secondary">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary transition-colors hover:text-text-primary">
                Response headers ({result.headers.length})
              </summary>
              <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-border px-3 py-2 font-mono text-[11px]">
                {result.headers.map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="text-text-tertiary">{key}</dt>
                    <dd className="break-all text-text-secondary">{value}</dd>
                  </div>
                ))}
              </dl>
            </details>

            <div className="overflow-auto rounded-md border border-border bg-surface-secondary p-3" style={{ maxHeight: 420 }}>
              {result.json !== undefined ? (
                <JsonTree value={result.json} defaultOpenDepth={2} />
              ) : result.text ? (
                <pre className="whitespace-pre-wrap break-all font-mono text-[12px] text-text-secondary">{result.text}</pre>
              ) : (
                <p className="text-xs text-text-tertiary">Empty response body.</p>
              )}
            </div>
          </div>
        )}

        {!result && !pending && !error && (
          <p className="text-xs text-text-tertiary">
            Nothing sent yet. The call runs from your browser against this origin, so the status, latency and headers
            below are this deployment&apos;s real behaviour.
          </p>
        )}
      </div>
    </section>
  );
}
