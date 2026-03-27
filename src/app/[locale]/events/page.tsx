/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import EventCalendar from "@/components/EventCalendar";
import { CalendarDays } from "lucide-react";
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
    title: "Crypto Events Calendar — Crypto Vision News",
    description:
      "Stay up to date with upcoming crypto conferences, network upgrades, token launches, AMAs, and community events. Never miss an important date in crypto.",
    path: "/events",
    locale,
    tags: [
      "crypto events",
      "crypto calendar",
      "blockchain conferences",
      "network upgrades",
      "token launches",
    ],
  });
}

/* ---------- Page --------------------------------------------------------- */

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main-content" className="container-main py-8">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <CalendarDays className="h-5 w-5 text-accent" />
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Crypto Events Calendar
            </h1>
          </div>
          <p className="max-w-2xl text-text-secondary">
            Track upcoming crypto conferences, network upgrades, token launches,
            AMAs, and community events. Click any date to see scheduled events.
          </p>
        </div>

        {/* ── Calendar ─────────────────────────────────────────── */}
        <EventCalendar />
      </main>
      <Footer />
    </>
  );
}
