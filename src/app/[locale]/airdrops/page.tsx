import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Card, CardContent, Skeleton } from "@/components/ui";
import type { Metadata } from "next";
import AirdropCards from "@/components/AirdropCards";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Airdrop Tracker — Active, Upcoming & Past Crypto Airdrops",
    description:
      "Track active and upcoming cryptocurrency airdrops. Filter by chain, check eligibility criteria, and never miss a free token distribution. Updated in real time.",
    path: "/airdrops",
    locale,
    tags: [
      "crypto airdrops",
      "free crypto",
      "token airdrops",
      "airdrop tracker",
      "ethereum airdrops",
      "solana airdrops",
      "defi airdrops",
    ],
  });
}

function AirdropSkeleton() {
  return (
    <div className="space-y-8">
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function AirdropsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text-primary">
          Airdrop Tracker
        </h1>
        <p className="text-text-secondary mb-8 max-w-2xl">
          Discover active and upcoming crypto airdrops. Filter by chain, check
          eligibility requirements, and track deadlines — all in one place.
        </p>

        <Suspense fallback={<AirdropSkeleton />}>
          <AirdropCards />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
