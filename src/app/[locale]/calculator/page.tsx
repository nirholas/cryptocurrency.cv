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
import { setRequestLocale } from "next-intl/server";
import { generateSEOMetadata } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CryptoCalculator from "@/components/CryptoCalculator";
import {
  Calculator,
  Zap,
  Globe,
  Shield,
  RefreshCw,
  Share2,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Crypto Calculator — Convert Crypto to Fiat & Crypto Instantly",
    description:
      "Free real-time cryptocurrency calculator. Convert Bitcoin, Ethereum, Solana & 15+ coins to USD, EUR, GBP. Crypto-to-crypto converter, investment simulator, and live rates table. No API key required.",
    path: "/calculator",
    locale,
    tags: [
      "crypto calculator",
      "bitcoin converter",
      "crypto to fiat",
      "crypto to crypto",
      "investment simulator",
      "btc calculator",
      "eth calculator",
      "cryptocurrency converter",
    ],
  });
}

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Conversion",
    desc: "Real-time prices with automatic refreshing every 60 seconds.",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    desc: "Convert between 15+ cryptocurrencies and 3 fiat currencies.",
  },
  {
    icon: Shield,
    title: "No API Key Needed",
    desc: "Completely free — no signup, no rate limits, no tracking.",
  },
  {
    icon: RefreshCw,
    title: "Auto-Refresh",
    desc: "Prices update automatically so you always see the latest rates.",
  },
  {
    icon: Calculator,
    title: "Investment Simulator",
    desc: "Model potential returns with our built-in investment calculator.",
  },
  {
    icon: Share2,
    title: "Copy & Share",
    desc: "Instantly copy conversion results to share with others.",
  },
] as const;

export default async function CalculatorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4">
            <Calculator className="h-3.5 w-3.5" />
            Real-time Crypto Calculator
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Crypto Calculator
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Convert between cryptocurrencies and fiat currencies with live
            prices. Supports crypto-to-crypto, fiat presets, and an investment
            simulator.
          </p>
        </div>

        {/* Calculator */}
        <div className="max-w-2xl mx-auto">
          <CryptoCalculator />
        </div>

        {/* Features grid */}
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-center text-text-primary mb-8">
            Why Use This Calculator?
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

        {/* FAQ / Educational */}
        <section className="mt-16 max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-center text-text-primary mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "How often are prices updated?",
                a: "Prices refresh automatically every 60 seconds using our multi-provider API pipeline with five fallback layers for maximum reliability.",
              },
              {
                q: "What is crypto-to-crypto conversion?",
                a: "Instead of converting to a fiat currency like USD, you can see how much of one cryptocurrency equals another. For example, how many ETH you'd get for 1 BTC.",
              },
              {
                q: "Is the investment simulator financial advice?",
                a: "No. The simulator extrapolates the current 24-hour price trend for illustrative purposes only. Crypto markets are highly volatile — always do your own research.",
              },
              {
                q: "Do I need an API key?",
                a: "Nope! This calculator is entirely free with no API key, no account, and no rate limits.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="p-4 rounded-xl border border-border bg-(--color-surface)"
              >
                <h3 className="font-semibold text-text-primary mb-1">
                  {q}
                </h3>
                <p className="text-sm text-text-secondary">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
