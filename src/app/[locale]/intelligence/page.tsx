/**
 * Market Intelligence Dashboard
 *
 * Unified view of AI signals, whale alerts, market narratives, sentiment,
 * and anomaly detection — the smartest page on the platform.
 */

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import IntelligenceContent from "./IntelligenceContent";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Market Intelligence — AI Signals, Whale Alerts & Narratives",
    description:
      "Real-time crypto market intelligence: AI-powered trading signals, whale transaction alerts, market narrative tracking, sentiment analysis, and anomaly detection.",
    path: "/intelligence",
    locale,
    tags: ["market intelligence", "trading signals", "whale alerts", "crypto sentiment", "anomaly detection"],
  });
}

export default async function IntelligencePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <IntelligenceContent />
      </main>
      <Footer />
    </>
  );
}
