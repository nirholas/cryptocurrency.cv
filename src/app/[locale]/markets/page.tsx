import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Markets — Free Crypto News",
    description:
      "Live cryptocurrency market data, prices, and trends. Track Bitcoin, Ethereum, and top altcoins in real time.",
    path: "/markets",
    locale,
    tags: ["crypto markets", "bitcoin price", "ethereum price", "market data", "cryptocurrency prices"],
  });
}

const placeholderCards = [
  { title: "Bitcoin (BTC)", stat: "—", change: "—" },
  { title: "Ethereum (ETH)", stat: "—", change: "—" },
  { title: "Solana (SOL)", stat: "—", change: "—" },
  { title: "Total Market Cap", stat: "—", change: "—" },
  { title: "24h Volume", stat: "—", change: "—" },
  { title: "Fear & Greed Index", stat: "—", change: "—" },
];

export default async function MarketsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[var(--color-text-primary)]">
          Markets
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-2xl">
          Market data coming soon. Real-time prices, charts, and market analysis
          for hundreds of cryptocurrencies.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {placeholderCards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6"
            >
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-1">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {card.stat}
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                {card.change}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
