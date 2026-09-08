/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Loader2, Search, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { ConformanceReport, Finding, Severity } from '@/lib/x402/conformance';

const LAYER_TITLE: Record<Finding['layer'], string> = {
  document: 'Discovery document',
  operation: 'Declared operations',
  runtime: 'Live payment challenges',
  cross: 'Document versus wire',
};

const LAYER_BLURB: Record<Finding['layer'], string> = {
  document: 'Fields every reader needs before it can do anything else.',
  operation: 'What each route promises an agent that has not called it yet.',
  runtime: 'What the server actually hands an unpaid caller.',
  cross: 'Where the two disagree. This is the layer no other tool checks.',
};

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warn: 1, info: 2 };

const GRADE_STYLE: Record<string, string> = {
  A: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  B: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  C: 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10',
  D: 'text-orange-600 dark:text-orange-400 border-orange-500/40 bg-orange-500/10',
  F: 'text-red-600 dark:text-red-400 border-red-500/40 bg-red-500/10',
};

function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === 'error') return <XCircle className="size-4 shrink-0 text-red-500" aria-hidden />;
  if (severity === 'warn') return <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden />;
  return <Info className="size-4 shrink-0 text-sky-500" aria-hidden />;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-mono text-lg font-semibold tabular-nums">{value}</dd>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const where = finding.location.method
    ? `${finding.location.method} ${finding.location.path ?? ''}`.trim()
    : (finding.location.pointer ?? finding.location.url ?? '');

  return (
    <li className="group border-t border-border/70 py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <SeverityIcon severity={finding.severity} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{finding.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>{finding.code}</span>
            {where ? <span className="truncate">{where}</span> : null}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{finding.detail}</p>
          <p className="mt-2 text-sm leading-relaxed">
            <span className="font-medium text-foreground">Fix.</span>{' '}
            <span className="text-muted-foreground">{finding.fix}</span>
          </p>
        </div>
      </div>
    </li>
  );
}

export default function ConformanceClient({ defaultOrigin }: { defaultOrigin: string }) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [report, setReport] = useState<ConformanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (target: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/x402/conformance?origin=${encodeURIComponent(target)}&probe=14`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      const body = (await response.json()) as ConformanceReport & { error?: string; message?: string };
      if (!response.ok) throw new Error(body.message ?? body.error ?? `Audit failed (${response.status})`);
      setReport(body);
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Audit failed');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Audit this origin on first paint, so the page is never an empty form.
  useEffect(() => {
    void run(defaultOrigin);
    return () => abortRef.current?.abort();
  }, [defaultOrigin, run]);

  useEffect(() => {
    if (report) resultRef.current?.setAttribute('data-loaded', 'true');
  }, [report]);

  const grouped = useMemo(() => {
    if (!report) return [];
    const visible = report.findings.filter((f) => showNotes || f.severity !== 'info');
    const order: Finding['layer'][] = ['cross', 'runtime', 'document', 'operation'];
    return order
      .map((layer) => ({
        layer,
        findings: visible
          .filter((f) => f.layer === layer)
          .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.code.localeCompare(b.code)),
      }))
      .filter((group) => group.findings.length > 0);
  }, [report, showNotes]);

  const hiddenNotes = report ? report.findings.filter((f) => f.severity === 'info').length : 0;

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void run(origin.trim());
        }}
      >
        <label className="sr-only" htmlFor="conformance-origin">
          Origin to audit
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="conformance-origin"
            type="text"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            placeholder="https://your-api.example.com"
            spellCheck={false}
            autoComplete="url"
            className="h-11 w-full rounded-md border border-border bg-(--color-surface) pl-9 pr-3 font-mono text-sm outline-none transition-colors focus-visible:border-(--color-accent) focus-visible:ring-2 focus-visible:ring-(--color-accent)/30"
          />
        </div>
        <Button type="submit" disabled={loading || !origin.trim()} className="h-11 gap-2 sm:w-40">
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
          {loading ? 'Auditing' : 'Audit origin'}
        </Button>
      </form>

      <p className="-mt-4 text-xs text-muted-foreground">
        Reads the origin&apos;s discovery document, then sends up to 14 ordinary unpaid requests to see what it
        actually challenges with. No payment header is ever sent and nothing is spent.
      </p>

      <div ref={resultRef} aria-live="polite" aria-busy={loading}>
        {loading && !report ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Reading the discovery document and probing live challenges.
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-500/40">
            <CardContent className="flex items-start gap-3 p-6">
              <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" aria-hidden />
              <div>
                <p className="font-medium">Could not audit that origin</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  The origin must be a public HTTPS host serving a discovery document at{' '}
                  <code className="font-mono text-xs">/openapi.json</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {report ? (
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    'flex size-24 shrink-0 flex-col items-center justify-center rounded-xl border-2 font-mono',
                    GRADE_STYLE[report.score.grade] ?? GRADE_STYLE.F,
                  )}
                >
                  <span className="text-4xl font-bold leading-none">{report.score.grade}</span>
                  <span className="mt-1 text-xs tabular-nums opacity-80">{report.score.value}/100</span>
                </div>

                <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Errors" value={String(report.score.errors)} />
                  <Stat label="Warnings" value={String(report.score.warnings)} />
                  <Stat
                    label="Operations"
                    value={String(report.operations.total)}
                    hint={`${report.operations.paid} paid, ${report.operations.free} free`}
                  />
                  <Stat
                    label="Probed live"
                    value={String(report.probes.attempted)}
                    hint={`${report.probes.challenged} challenged`}
                  />
                </dl>
              </CardContent>
            </Card>

            {report.findings.length === 0 ? (
              <Card className="border-emerald-500/40">
                <CardContent className="flex items-start gap-3 p-6">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
                  <div>
                    <p className="font-medium">Every check passed</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The discovery document is complete, every probed challenge is well formed and payable, and the two
                      agree on price, protection and call shape.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              grouped.map((group) => (
                <section key={group.layer} className="flex flex-col gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold tracking-tight">{LAYER_TITLE[group.layer]}</h2>
                    <p className="text-sm text-muted-foreground">{LAYER_BLURB[group.layer]}</p>
                  </div>
                  <Card>
                    <CardContent className="px-5 py-1">
                      <ul>
                        {group.findings.map((finding, index) => (
                          <FindingRow key={`${finding.code}-${index}`} finding={finding} />
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </section>
              ))
            )}

            {hiddenNotes > 0 ? (
              <button
                type="button"
                onClick={() => setShowNotes((value) => !value)}
                className="self-start rounded-md px-2 py-1 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)/40"
              >
                {showNotes ? 'Hide' : 'Show'} {hiddenNotes} advisory {hiddenNotes === 1 ? 'note' : 'notes'}
              </button>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge className="font-mono">{report.origin}</Badge>
              {report.specUrl ? (
                <a
                  href={report.specUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono underline-offset-4 hover:underline"
                >
                  {report.specUrl.replace(report.origin, '')}
                </a>
              ) : null}
              <a
                href={`/api/x402/conformance?origin=${encodeURIComponent(report.origin)}&format=sarif`}
                className="font-mono underline-offset-4 hover:underline"
              >
                SARIF
              </a>
              <a
                href={`/api/x402/conformance?origin=${encodeURIComponent(report.origin)}`}
                className="font-mono underline-offset-4 hover:underline"
              >
                JSON
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
