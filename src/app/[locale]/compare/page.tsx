/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Skeleton } from "@/components/ui/Skeleton";
import { GitCompareArrows } from "lucide-react";
import CoinCompare from "@/components/CoinCompare";
import type { Metadata } from "next";

// ---------- Types ------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string }>;
};

// ---------- Metadata ---------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Compare Cryptocurrencies — Free Crypto News",
    description:
      "Compare Bitcoin, Ethereum, Solana, and other cryptocurrencies side-by-side. Price, market cap, volume, supply, and performance metrics.",
    path: "/compare",
    locale,
    tags: [
      "crypto comparison",
      "compare coins",
      "bitcoin vs ethereum",
      "crypto metrics",
      "market cap comparison",
    ],
  });
}

// ---------- Page component ---------------------------------------------------

export const revalidate = 60;

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-8">
        {/* Heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GitCompareArrows className="h-7 w-7 text-[var(--color-accent)]" />
            <h1 className="font-serif text-3xl font-bold text-[var(--color-text-primary)]">
              Compare Cryptocurrencies
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] max-w-2xl">
            Select up to 4 coins to compare side-by-side across price, market
            cap, volume, supply, and performance metrics.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <CoinCompare />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
