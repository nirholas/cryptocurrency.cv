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
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';

export interface SpecErrorProps {
  /** Message from the failed spec build, shown verbatim for debugging. */
  reason: string;
}

/**
 * Shown when the OpenAPI document could not be built.
 *
 * Retry re-runs the server render rather than reloading the tab, so a
 * transient failure recovers in place with the reader's scroll intact.
 */
export function SpecError({ reason }: SpecErrorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState(0);

  function retry() {
    setAttempts((n) => n + 1);
    startTransition(() => router.refresh());
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-secondary px-4 py-16">
      <div className="w-full max-w-lg rounded-lg border border-border bg-(--color-surface) p-8 text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, #ef4444 15%, var(--color-surface))' }}
          aria-hidden="true"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'color-mix(in srgb, #ef4444 74%, var(--color-text-primary))' }}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="mt-4 font-serif text-xl font-bold text-text-primary">The API reference could not load</h1>
        <p className="mt-2 text-sm text-text-secondary">
          The OpenAPI document failed to build on this request, so there is nothing to explore yet.
        </p>
        <p className="mt-3 break-words rounded-md border border-border bg-surface-secondary px-3 py-2 text-left font-mono text-[11px] text-text-tertiary">
          {reason}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={retry} disabled={pending}>
            {pending ? 'Retrying' : attempts > 0 ? `Retry again (${attempts})` : 'Retry'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/api/openapi.json">Open the raw spec</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/docs">Read the docs</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
