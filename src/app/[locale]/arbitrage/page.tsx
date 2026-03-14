import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import ArbitrageTable from "@/components/ArbitrageTable";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Arbitrage Scanner — Live Cross-Exchange Opportunities | Crypto Vision News",
    description:
      "Find real-time cryptocurrency arbitrage opportunities across exchanges. Compare buy and sell prices, spread percentages, and estimated profits for BTC, ETH, and altcoins.",
    path: "/arbitrage",
    locale,
    tags: [
      "arbitrage",
      "crypto arbitrage",
      "cross-exchange",
      "trading",
      "spread",
      "profit",
    ],
  });
}

export default async function ArbitragePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Arbitrage Scanner
          </h1>
          <p className="mt-2 max-w-2xl text-text-secondary">
            Discover real-time price discrepancies across cryptocurrency
            exchanges. Auto-refreshes every 15 seconds to surface the latest
            opportunities.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Spot the Spread",
              desc: "We scan prices across major exchanges to find coins trading at different prices.",
            },
            {
              step: "2",
              title: "Evaluate the Opportunity",
              desc: "Compare buy/sell prices, spread percentages, and estimated profit after fees.",
            },
            {
              step: "3",
              title: "Act Quickly",
              desc: "Arbitrage windows close fast. Use the data for research — always DYOR.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-lg border border-border bg-(--color-surface) p-5"
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                {item.step}
              </div>
              <h3 className="font-serif text-sm font-bold text-text-primary">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-text-tertiary">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Live Arbitrage Table */}
        <ArbitrageTable />
      </main>
      <Footer />
    </>
  );
}
