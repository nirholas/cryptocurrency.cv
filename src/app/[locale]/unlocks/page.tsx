import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Card, CardContent } from "@/components/ui/Card";
import UnlocksTimeline from "@/components/UnlocksTimeline";
import { Lock, AlertTriangle, Info } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

/* ---------- Types -------------------------------------------------------- */

type Props = {
  params: Promise<{ locale: string }>;
};

/* ---------- Metadata ----------------------------------------------------- */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Token Unlocks — Crypto Vision News",
    description:
      "Track upcoming token unlock events and vesting schedules. See which tokens are about to unlock large amounts and assess their potential market impact.",
    path: "/unlocks",
    locale,
    tags: [
      "token unlocks",
      "vesting schedule",
      "crypto unlocks",
      "token release",
      "supply unlock",
    ],
  });
}

/* ---------- Page --------------------------------------------------------- */

export default async function UnlocksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main-content" className="container-main py-8">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
              <Lock className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Token Unlocks
            </h1>
          </div>
          <p className="max-w-2xl text-[var(--color-text-secondary)]">
            Track upcoming token unlock and vesting events. Large unlocks can
            increase circulating supply and put selling pressure on token prices.
          </p>
        </div>

        {/* ── Explainer Cards ──────────────────────────────────── */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
              <div>
                <p className="font-medium">What are Token Unlocks?</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Locked tokens from vesting schedules, team allocations, or
                  investor agreements that become transferable on a set date.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium">Why They Matter</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Large unlocks increase circulating supply. If recipients sell,
                  it can create downward price pressure — especially when unlock
                  size exceeds 5% of supply.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-medium">How to Use This Data</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Monitor high-impact unlocks (red) and plan accordingly. Check historical
                  impact to see how previous unlocks affected price.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Timeline ─────────────────────────────────────────── */}
        <UnlocksTimeline />
      </main>
      <Footer />
    </>
  );
}
