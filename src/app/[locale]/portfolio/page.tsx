/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Skeleton, Card, CardContent } from "@/components/ui";
import type { Metadata } from "next";
import PortfolioContent from "@/components/PortfolioContent";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Portfolio Tracker — Track Holdings, P&L & Allocation",
    description:
      "Track your cryptocurrency portfolio in real time. Monitor holdings, profit & loss, allocation breakdown, and performance against live market prices. Free, no sign-up required.",
    path: "/portfolio",
    locale,
    noindex: true,
    tags: [
      "crypto portfolio tracker",
      "portfolio pnl",
      "crypto holdings",
      "bitcoin portfolio",
      "cryptocurrency tracker",
      "portfolio allocation",
    ],
  });
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-8">
      {/* Dashboard cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </CardContent>
        </Card>
      </div>
      {/* Table skeleton */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text-primary">
          Portfolio Tracker
        </h1>
        <p className="text-text-secondary mb-8 max-w-2xl">
          Track your crypto holdings, monitor profit &amp; loss in real time,
          and visualize your allocation — all stored locally, no sign-up required.
        </p>

        <Suspense fallback={<PortfolioSkeleton />}>
          <PortfolioContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
