/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import TradingPageClient from "./TradingPageClient";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Trading & Charts — TradingView Charts — Crypto Vision",
    description:
      "Advanced cryptocurrency charts powered by TradingView with candlestick views, AI-powered chart analysis, crypto heatmap, live order book depth, and real-time trading signals.",
    path: "/trading",
    locale,
    tags: [
      "crypto trading",
      "tradingview charts",
      "candlestick chart",
      "chart analysis",
      "order book",
      "trading signals",
      "technical analysis",
      "bitcoin chart",
      "ethereum chart",
      "crypto heatmap",
    ],
  });
}

export default async function TradingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-6">
        <TradingPageClient />
      </main>
      <Footer />
    </>
  );
}
