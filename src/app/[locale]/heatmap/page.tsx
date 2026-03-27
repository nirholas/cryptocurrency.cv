import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Skeleton } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";
import MarketHeatmap from "@/components/MarketHeatmap";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Crypto Market Heatmap — Top 50 Coins by Market Cap",
    description:
      "Visual heatmap of the top 50 cryptocurrencies by market cap. See which coins are gaining or losing at a glance with color-coded price changes.",
    path: "/heatmap",
    locale,
    tags: [
      "crypto heatmap",
      "market heatmap",
      "bitcoin heatmap",
      "cryptocurrency visualization",
    ],
  });
}

async function fetchCoins() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/market/coins?type=top&limit=100`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.coins ?? [];
  } catch {
    return [];
  }
}

async function HeatmapContent() {
  const coins = await fetchCoins();

  if (!coins || coins.length === 0) {
    return (
      <div className="text-center py-20 text-text-secondary">
        <p className="text-lg">Unable to load market data right now.</p>
        <p className="text-sm mt-2">Please try again later.</p>
      </div>
    );
  }

  return <MarketHeatmap coins={coins} />;
}

function HeatmapSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export default async function HeatmapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text-primary">
          Market Heatmap
        </h1>
        <p className="text-text-secondary mb-8 max-w-2xl">
          Visual overview of the top 50 cryptocurrencies by market cap. Block
          size represents market cap, color represents price change.
        </p>

        <Suspense fallback={<HeatmapSkeleton />}>
          <HeatmapContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
