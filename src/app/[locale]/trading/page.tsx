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
    title: "Trading & Charts — Crypto Vision News",
    description:
      "Advanced cryptocurrency charts with candlestick views, AI-powered chart analysis, live order book depth, and real-time trading signals.",
    path: "/trading",
    locale,
    tags: [
      "crypto trading",
      "candlestick chart",
      "chart analysis",
      "order book",
      "trading signals",
      "technical analysis",
      "bitcoin chart",
      "ethereum chart",
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
