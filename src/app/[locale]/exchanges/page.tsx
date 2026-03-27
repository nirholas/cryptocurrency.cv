/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import ExchangesClient from "./ExchangesClient";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Cryptocurrency Exchanges — Rankings, Volume & Comparison | Crypto Vision News",
    description:
      "Compare cryptocurrency exchanges by volume, trust score, fees, and supported markets. Rankings for centralized (CEX) and decentralized (DEX) exchanges.",
    path: "/exchanges",
    locale,
    tags: [
      "exchanges",
      "crypto exchanges",
      "CEX",
      "DEX",
      "trading",
      "volume",
      "trust score",
    ],
  });
}

export default async function ExchangesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Cryptocurrency Exchanges
          </h1>
          <p className="mt-2 max-w-2xl text-text-secondary">
            Compare the top centralized and decentralized exchanges by trading
            volume, trust score, fees, and available markets.
          </p>
        </div>

        <ExchangesClient />
      </main>
      <Footer />
    </>
  );
}
