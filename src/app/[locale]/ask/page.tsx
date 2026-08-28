/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { AIChatInterface } from '@/components/AIChatInterface';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

/**
 * Clicking one of these navigates to `/ask?q=...`, which prefills the composer
 * so the reader can edit the question before sending it.
 */
const EXAMPLE_QUESTIONS = [
  'What moved Bitcoin in the last 24 hours?',
  'Which DeFi protocols gained the most TVL this week?',
  'What are the biggest regulatory stories in crypto right now?',
];

/** Longest question we will accept from the URL, so a crafted link cannot flood the composer. */
const MAX_PREFILL_LENGTH = 500;

function ChatSkeleton() {
  return (
    <div
      className="border-border flex h-125 flex-col rounded-xl border p-4"
      aria-busy="true"
      aria-label="Loading the assistant"
    >
      <div className="border-border mb-4 flex items-center gap-3 border-b pb-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="flex-1 space-y-3">
        <Skeleton className="h-16 w-16 self-center rounded-2xl" />
        <Skeleton className="mx-auto h-6 w-64" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full" />
        <div className="mx-auto grid max-w-lg gap-2 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="mt-4 h-14 w-full rounded-xl" />
    </div>
  );
}

export default async function AskPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { q } = await searchParams;
  const raw = Array.isArray(q) ? q[0] : q;
  const initialQuestion = (raw ?? '').trim().slice(0, MAX_PREFILL_LENGTH);

  return (
    <>
      <Header />
      <main className="container-main py-8">
        <section className="mb-8">
          <h1 className="mb-3 font-serif text-3xl font-bold md:text-4xl">Ask AI</h1>
          <p className="text-text-secondary max-w-2xl leading-relaxed">
            Ask a question in plain language and get an answer grounded in the crypto news we
            aggregate from 300+ sources, with links to the articles it drew on. It reads the live
            feed, so it can answer about what happened this morning, not just what a model learned
            during training.
          </p>
          <nav aria-label="Example questions" className="mt-5 flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((question) => (
              <Link
                key={question}
                href={`/ask?q=${encodeURIComponent(question)}`}
                className="border-border hover:bg-surface-secondary hover:border-accent focus-visible:ring-accent text-text-primary rounded-full border bg-(--color-surface) px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {question}
              </Link>
            ))}
          </nav>
        </section>

        <Suspense fallback={<ChatSkeleton />}>
          <AIChatInterface initialQuestion={initialQuestion} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
