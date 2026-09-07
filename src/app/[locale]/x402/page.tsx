/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from 'next-intl/server';
import { generateSEOMetadata } from '@/lib/seo';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ClientOnly } from '@/components/ClientOnly';
import X402Visualizer from '@/components/X402Visualizer';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'x402 Payment Protocol Visualizer',
    description:
      'An interactive 3D walkthrough of how an x402 payment moves between protocols such as Coinbase, Base, USDC, Stripe and Aave. The traffic is simulated to illustrate the flow, and the companion auditor tests whether a real API implements the protocol correctly.',
    path: '/x402',
    locale,
  });
}

export default async function X402Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <ClientOnly>
          <X402Visualizer />
        </ClientOnly>

        {/* The visualizer explains the protocol; the auditor checks whether a
            given origin actually implements it. Linking them means someone who
            just learned how x402 works can immediately test their own API. */}
        <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
          <Link
            href="/x402/conformance"
            className="group flex flex-col gap-2 rounded-lg border border-border bg-(--color-surface) p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)/40"
          >
            <span className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight">
              Audit an x402 API
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              A paid API states its price twice, in two different units, and nothing makes the two agree. Check any
              origin, including your own: prices that disagree, payments routed to unspendable addresses, and schemas
              no client can resolve.
            </span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
