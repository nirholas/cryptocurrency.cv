/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CoinCompare from "@/components/CoinCompare";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BarChart3,
  Trophy,
  Layers,
  Share2,
  ArrowUpDown,
  Target,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Coin Compare — Side-by-Side Cryptocurrency Comparison",
    description:
      "Compare Bitcoin, Ethereum, Solana & 20+ cryptocurrencies side by side. Market cap, price changes, volume, ATH, supply metrics, winner scorecard, and market dominance chart. Free, no API key.",
    path: "/compare",
    locale,
    tags: [
      "crypto comparison",
      "compare coins",
      "bitcoin vs ethereum",
      "coin compare",
      "crypto metrics",
      "market cap comparison",
      "cryptocurrency analysis",
    ],
  });
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "15+ Metrics",
    desc: "Compare price, market cap, volume, supply, ATH, and more across coins.",
  },
  {
    icon: Trophy,
    title: "Winner Highlight",
    desc: "Instantly see which coin leads in each metric with trophy indicators.",
  },
  {
    icon: Layers,
    title: "Preset Groups",
    desc: "Quick-compare Layer 1s, Layer 2s, DeFi tokens, and more with one click.",
  },
  {
    icon: ArrowUpDown,
    title: "Sortable Columns",
    desc: "Sort by any metric to rank coins from best to worst — or reverse.",
  },
  {
    icon: Target,
    title: "Market Dominance",
    desc: "Visual bar chart showing relative market dominance among selected coins.",
  },
  {
    icon: Share2,
    title: "Shareable URLs",
    desc: "Copy a link to your comparison. Coin selections are saved in the URL.",
  },
] as const;

function CompareSkeleton() {
  return (
    <div className="space-y-4 mt-8">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4">
            <BarChart3 className="h-3.5 w-3.5" />
            Side-by-Side Comparison
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Coin Compare
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Compare up to 5 cryptocurrencies across 15+ metrics. Spot winners,
            analyse market dominance, and share your comparison with a single
            URL.
          </p>
        </div>

        {/* Compare */}
        <Suspense fallback={<CompareSkeleton />}>
          <CoinCompare />
        </Suspense>

        {/* Features grid */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-center text-text-primary mb-8">
            Comparison Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-xl border border-border bg-(--color-surface) hover:bg-surface-secondary transition-colors"
              >
                <f.icon className="h-6 w-6 text-accent mb-3" />
                <h3 className="font-semibold text-text-primary mb-1">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-center text-text-primary mb-6">
            How to Use This Tool
          </h2>
          <div className="space-y-4">
            {[
              {
                title: "1. Pick your coins",
                body: "Start with a preset group like \"Top 5\" or \"Layer 1s\", or add individual coins from the search bar. You can compare up to 5 at once.",
              },
              {
                title: "2. Read the metrics",
                body: "Each row shows a different metric. Trophy icons mark the winner in that category. Green and red colouring indicates positive or negative changes.",
              },
              {
                title: "3. Sort and explore",
                body: "Click any sortable metric label to rank coins by that value. Toggle ascending or descending. Expand to see all 15+ metrics.",
              },
              {
                title: "4. Share your comparison",
                body: "Your coin selection is saved in the URL. Copy the share link to send your exact comparison to anyone.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="p-4 rounded-xl border border-border bg-(--color-surface)"
              >
                <h3 className="font-semibold text-text-primary mb-1">
                  {tip.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
