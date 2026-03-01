/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Digest / Newsletter Archive Page
 */

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DigestArchive from "@/components/DigestArchive";
import DigestSubscribeForm from "@/components/DigestSubscribeForm";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { generateSEOMetadata } from "@/lib/seo";
import {
  Newspaper,
  TrendingUp,
  BarChart3,
  Shield,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Crypto Digest — Daily & Weekly Newsletter Archive",
    description:
      "Browse the Free Crypto News daily and weekly digests. AI-powered summaries of the most important crypto news, market movers, DeFi updates, and regulatory developments.",
    path: "/digest",
    locale,
    tags: [
      "crypto digest",
      "newsletter",
      "daily recap",
      "weekly recap",
      "crypto news summary",
    ],
  });
}

interface DigestHighlight {
  text: string;
}

interface LatestDigest {
  title: string;
  date: string;
  summary: string;
  highlights: DigestHighlight[];
}

const FEATURES = [
  {
    icon: Newspaper,
    title: "Top Stories",
    description:
      "Curated selection of the most impactful crypto news from 300+ sources, distilled into key takeaways.",
  },
  {
    icon: TrendingUp,
    title: "Market Movers",
    description:
      "Biggest price gainers & losers, volume surges, and notable market cap shifts across all major coins.",
  },
  {
    icon: BarChart3,
    title: "DeFi Updates",
    description:
      "TVL changes, new protocol launches, yield opportunities, and governance proposals across DeFi ecosystems.",
  },
  {
    icon: Shield,
    title: "Regulatory News",
    description:
      "SEC rulings, international policy changes, and legislation updates that could impact the crypto market.",
  },
  {
    icon: Sparkles,
    title: "AI Analysis",
    description:
      "AI-generated market sentiment summary, trend detection, and data-driven insights for each digest.",
  },
  {
    icon: Lightbulb,
    title: "Predictions",
    description:
      "Forward-looking analysis and market predictions with confidence levels, tracked for accuracy over time.",
  },
] as const;

async function getLatestDigest(): Promise<LatestDigest | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://cryptocurrency.cv";
    const res = await fetch(`${baseUrl}/api/digest?limit=1`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const digest = data?.digests?.[0] ?? data?.items?.[0] ?? null;
    if (!digest) return null;
    return {
      title: digest.title ?? "Crypto Daily Digest",
      date: digest.date ?? new Date().toISOString(),
      summary: digest.summary ?? digest.description ?? "",
      highlights: (digest.highlights ?? digest.items ?? []).slice(0, 5).map(
        (h: string | DigestHighlight) =>
          typeof h === "string" ? { text: h } : h
      ),
    };
  } catch {
    return null;
  }
}

export default async function DigestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const latest = await getLatestDigest();

  const fallbackDigest: LatestDigest = {
    title: `Crypto Daily: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    date: new Date().toISOString(),
    summary:
      "Today's digest covers the latest developments in Bitcoin, Ethereum, and the broader crypto market. From price action to regulatory updates, here's everything you need to know.",
    highlights: [
      { text: "Bitcoin holds above key support as institutional inflows continue" },
      { text: "Ethereum L2 ecosystem TVL reaches new all-time high" },
      { text: "DeFi lending protocols see $2B in new deposits this week" },
      { text: "SEC provides updated guidance on crypto asset classification" },
      { text: "AI-crypto crossover tokens surge amid growing narrative" },
    ],
  };

  const digest = latest ?? fallbackDigest;

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {/* ── Hero ── */}
        <section className="border-b border-[var(--color-border)]">
          <div className="container-main py-10 lg:py-14 text-center">
            <Badge className="mb-4">
              <Newspaper className="h-3 w-3 mr-1" /> Newsletter
            </Badge>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[var(--color-text-primary)]">
              Crypto Digest
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              AI-powered daily and weekly summaries of everything happening in crypto.
              Never miss a market-moving story again.
            </p>
          </div>
        </section>

        {/* ── Subscribe CTA ── */}
        <section className="border-b border-[var(--color-border)]">
          <div className="container-main py-8 lg:py-10">
            <DigestSubscribeForm />
          </div>
        </section>

        {/* ── Latest Digest ── */}
        <section className="border-b border-[var(--color-border)]">
          <div className="container-main py-8 lg:py-10">
            <h2 className="text-xl font-bold font-serif mb-6">Latest Digest</h2>
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                      {digest.title}
                    </h3>
                    <time className="text-sm text-[var(--color-text-tertiary)]">
                      {new Date(digest.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <Badge>
                    <Sparkles className="h-3 w-3 mr-1" /> AI Summary
                  </Badge>
                </div>

                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
                  {digest.summary}
                </p>

                {digest.highlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      Key Highlights
                    </h4>
                    <ul className="space-y-2">
                      {digest.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                          {h.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Digest Archive ── */}
        <section className="border-b border-[var(--color-border)]">
          <div className="container-main py-8 lg:py-10">
            <h2 className="text-xl font-bold font-serif mb-6">
              Digest Archive
            </h2>
            <DigestArchive />
          </div>
        </section>

        {/* ── What's Included ── */}
        <section>
          <div className="container-main py-8 lg:py-10">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-3">
                What&apos;s Inside Each Digest
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto">
                Every edition is packed with the information you need to stay ahead of the crypto market.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.title}
                    className="group hover:border-[var(--color-accent)]/50 transition-colors"
                  >
                    <CardContent className="p-5">
                      <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5 text-[var(--color-accent)]" />
                      </div>
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
