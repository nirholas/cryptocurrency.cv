import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import PredictionCards, {
  TradingSignals,
  PredictionHistoryTable,
} from "@/components/PredictionCards";
import {
  Brain,
  TrendingUp,
  History,
  Zap,
} from "lucide-react";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "AI Price Predictions & Trading Signals — Crypto Forecasts",
    description:
      "AI-powered cryptocurrency price predictions for Bitcoin, Ethereum, Solana and more. View trading signals, prediction accuracy history, and confidence-rated forecasts.",
    path: "/predictions",
    locale,
    tags: [
      "crypto predictions",
      "price forecast",
      "trading signals",
      "ai crypto",
      "bitcoin prediction",
      "ethereum forecast",
    ],
  });
}

export default async function PredictionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8 text-accent" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">
              AI Predictions
            </h1>
          </div>
          <p className="text-text-secondary max-w-2xl">
            AI-powered price predictions and trading signals based on news sentiment analysis,
            on-chain data, and market analytics. Updated in real time.
          </p>
        </div>

        {/* Section: AI Price Predictions */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary">
              Price Predictions
            </h2>
          </div>
          <PredictionCards />
        </section>

        {/* Section: Prediction History */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <History className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary">
              Prediction Track Record
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            How accurate were past AI predictions? Review the historical performance below.
          </p>
          <PredictionHistoryTable />
        </section>

        {/* Section: Trading Signals */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary">
              Trading Signals
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            AI-generated trading signals based on recent crypto news, sentiment, and market data.
          </p>
          <TradingSignals />
        </section>
      </main>
      <Footer />
    </>
  );
}
