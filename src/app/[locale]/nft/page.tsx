/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { NewsCardCompact } from "@/components/NewsCard";
import NFTCollections, {
  type NFTCollectionRow,
} from "@/components/NFTCollections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getNewsByCategory, type NewsResponse } from "@/lib/crypto-news";
import {
  getNFTMarketOverview,
  getTrendingCollections,
  type NFTMarketOverview,
  type TrendingCollection,
} from "@/lib/apis/nft-markets";
import {
  gamingDataChain,
  type GamingOverview,
  type GameData,
} from "@/lib/providers/adapters/gaming-data";
import { generateSEOMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "NFT Collections & Blockchain Gaming Dashboard",
    description:
      "Track top NFT collections by floor price and volume, discover trending mints, explore blockchain gaming data, and read the latest NFT news — all in one place.",
    path: "/nft",
    locale,
    tags: [
      "nft",
      "nft collections",
      "floor price",
      "opensea",
      "blockchain gaming",
      "metaverse",
      "crypto games",
      "play to earn",
    ],
  });
}

/* ── helpers ── */

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatETH(value: number): string {
  if (value <= 0) return "—";
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M ETH`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K ETH`;
  return `${value.toFixed(2)} ETH`;
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/* ── stat card ── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        accent &&
          "ring-1 ring-accent/20 bg-accent/[0.03]"
      )}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
            {label}
          </p>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <p className="text-xl md:text-2xl font-bold tabular-nums text-text-primary">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-text-secondary mt-0.5">
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ── section heading ── */

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-xl">{icon}</span>}
      <div>
        <h2 className="font-serif text-2xl font-bold text-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-text-tertiary mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── page ── */

export default async function NFTPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  /* ── fetch all data in parallel ── */
  const [marketResult, trendingResult, newsResult, gamingResult] =
    await Promise.allSettled([
      getNFTMarketOverview(),
      getTrendingCollections("24h", 50),
      getNewsByCategory("nft", 8),
      gamingDataChain.fetch({}),
    ]);

  const market: NFTMarketOverview | null =
    marketResult.status === "fulfilled" ? marketResult.value : null;

  const trending: TrendingCollection[] =
    trendingResult.status === "fulfilled" ? trendingResult.value : [];

  const newsData: NewsResponse | null =
    newsResult.status === "fulfilled" ? newsResult.value : null;

  const gaming: GamingOverview | null =
    gamingResult.status === "fulfilled" ? gamingResult.value.data : null;

  const articles = newsData?.articles ?? [];

  /* ── derive stats ── */
  const topChainByVolume =
    market?.volumeByChain
      ? Object.entries(market.volumeByChain).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] ?? "—"
      : "—";

  const stats = [
    {
      label: "NFT Volume (24h)",
      value: market ? formatETH(market.totalVolume24h) : "—",
      icon: "🖼️",
      accent: true,
    },
    {
      label: "Top Chain",
      value: topChainByVolume.charAt(0).toUpperCase() + topChainByVolume.slice(1),
      icon: "⛓️",
    },
    {
      label: "Collections Tracked",
      value: trending.length > 0 ? trending.length.toLocaleString() : "—",
      icon: "📁",
    },
    {
      label: "Avg Sale Price",
      value: market
        ? `${market.averageFloorPrice.toFixed(market.averageFloorPrice < 1 ? 4 : 2)} ETH`
        : "—",
      icon: "💰",
    },
  ];

  /* ── collection rows ── */
  const collectionRows: NFTCollectionRow[] = trending.map((t) => ({
    rank: t.rank,
    name: t.collection.name,
    slug: t.collection.slug,
    imageUrl: t.collection.imageUrl,
    chain: t.collection.chain,
    floorPrice: t.collection.stats.floorPrice,
    volume24h: t.volume24h,
    volumeChange24h: t.volumeChange,
    sales24h: t.salesCount,
  }));

  /* ── trending mints (top 8 by trend score) ── */
  const trendingMints = [...trending]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 8);

  /* ── gaming data ── */
  const topGames: GameData[] = gaming?.topGames?.slice(0, 10) ?? [];
  const gamingColumns = {
    dau: topGames.some((g) => g.dau !== null),
    volume: topGames.some((g) => g.volume24h !== null),
    tvl: topGames.some((g) => g.balance !== null),
    change: topGames.some((g) => g.change24h !== null),
  };
  const gamingStats: { label: string; value: string; icon: string }[] = gaming
    ? [
        gaming.totalDau !== null && {
          label: "Total DAU",
          value: gaming.totalDau.toLocaleString(),
          icon: "👥",
        },
        gaming.totalVolume24h !== null && {
          label: "Gaming Volume (24h)",
          value: formatLargeNumber(gaming.totalVolume24h),
          icon: "💎",
        },
        gaming.totalTvl !== null && {
          label: "Value Locked",
          value: formatLargeNumber(gaming.totalTvl),
          icon: "🏦",
        },
        {
          label: "Games Tracked",
          value: gaming.topGames.length.toLocaleString(),
          icon: "🕹️",
        },
        {
          label: "Chains",
          value: Object.keys(gaming.byChain).length.toLocaleString(),
          icon: "⛓️",
        },
      ]
        .filter((stat): stat is { label: string; value: string; icon: string } => Boolean(stat))
        .slice(0, 4)
    : [];

  /* ── data freshness ── */
  const lastUpdated = market?.timestamp
    ? new Date(market.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <Header />
      <main className="container-main py-10 space-y-14">
        {/* ══════════ Hero ══════════ */}
        <section>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text-primary">
            🖼️ NFT &amp; Gaming Dashboard
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Track top NFT collections, discover trending mints, explore
            blockchain gaming metrics, and stay up to date with the latest NFT
            news.
          </p>
          {lastUpdated && (
            <p className="text-[10px] text-text-tertiary mt-2">
              Last updated: {lastUpdated} UTC
            </p>
          )}
        </section>

        {/* ══════════ 1. NFT Market Stats ══════════ */}
        <section>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* ══════════ 2. Top Collections Table ══════════ */}
        <section>
          <SectionHeading
            title="Top Collections"
            subtitle={
              collectionRows.length > 0
                ? `${collectionRows.length} collections · Sortable · Click headers to sort`
                : "No collection data available"
            }
            icon="🏆"
          />
          <NFTCollections collections={collectionRows} />
        </section>

        {/* ══════════ 3. Trending Mints ══════════ */}
        {trendingMints.length > 0 && (
          <section>
            <SectionHeading
              title="Trending Mints"
              subtitle="Collections gaining the most momentum right now"
              icon="🔥"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trendingMints.map((t) => (
                <Card key={t.collection.slug} className="group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {t.collection.imageUrl ? (
                        <img
                          src={t.collection.imageUrl}
                          alt={t.collection.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover bg-surface-tertiary shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-surface-tertiary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-text-primary">
                          {t.collection.name}
                        </p>
                        <Badge variant="nft" className="mt-0.5 text-[9px]">
                          {t.collection.chain}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-text-tertiary">
                          Floor
                        </p>
                        <p className="font-semibold tabular-nums text-text-primary">
                          {t.collection.stats.floorPrice > 0
                            ? `${t.collection.stats.floorPrice.toFixed(
                                t.collection.stats.floorPrice < 1 ? 4 : 2
                              )} ETH`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">
                          Sales
                        </p>
                        <p className="font-semibold tabular-nums text-text-primary">
                          {t.salesCount > 0
                            ? t.salesCount.toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">
                          Volume
                        </p>
                        <p className="font-semibold tabular-nums text-text-primary">
                          {formatETH(t.volume24h)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">
                          Trend
                        </p>
                        <p
                          className={cn(
                            "font-semibold tabular-nums",
                            t.volumeChange > 0
                              ? "text-green-600 dark:text-green-400"
                              : t.volumeChange < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-text-tertiary"
                          )}
                        >
                          {t.volumeChange !== 0
                            ? formatPct(t.volumeChange)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ 4. Gaming Section ══════════ */}
        <section>
          <SectionHeading
            title="Blockchain Gaming"
            subtitle={
              topGames.length > 0
                ? `Top ${topGames.length} games by ${
                    gaming?.rankedBy === "dau" ? "daily active users" : "value locked"
                  }`
                : "Crypto gaming & metaverse data"
            }
            icon="🎮"
          />

          {gamingStats.length > 0 && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
              {gamingStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                />
              ))}
            </div>
          )}

          {topGames.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                      #
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary min-w-[180px]">
                      Game
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                      Chain
                    </th>
                    {gamingColumns.dau && (
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                        Players (24h)
                      </th>
                    )}
                    {gamingColumns.volume && (
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                        Volume (24h)
                      </th>
                    )}
                    {gamingColumns.tvl && (
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                        Value Locked
                      </th>
                    )}
                    {gamingColumns.change && (
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                        24h
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topGames.map((game, i) => (
                    <tr
                      key={game.slug}
                      className="hover:bg-surface-secondary transition-colors"
                    >
                      <td className="px-3 py-3 tabular-nums font-medium text-text-primary">
                        {i + 1}
                      </td>
                      <td className="px-3 py-3">
                        {game.url ? (
                          <a
                            href={game.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-text-primary hover:underline"
                          >
                            {game.name}
                          </a>
                        ) : (
                          <p className="font-semibold text-text-primary">
                            {game.name}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="default" className="text-[9px]">
                          {game.chain}
                        </Badge>
                      </td>
                      {gamingColumns.dau && (
                        <td className="px-3 py-3 tabular-nums text-text-primary">
                          {game.dau !== null && game.dau > 0
                            ? game.dau.toLocaleString()
                            : "—"}
                        </td>
                      )}
                      {gamingColumns.volume && (
                        <td className="px-3 py-3 tabular-nums text-text-primary">
                          {game.volume24h !== null && game.volume24h > 0
                            ? formatLargeNumber(game.volume24h)
                            : "—"}
                        </td>
                      )}
                      {gamingColumns.tvl && (
                        <td className="px-3 py-3 tabular-nums text-text-primary">
                          {game.balance !== null && game.balance > 0
                            ? formatLargeNumber(game.balance)
                            : "—"}
                        </td>
                      )}
                      {gamingColumns.change && (
                        <td
                          className={cn(
                            "px-3 py-3 tabular-nums",
                            game.change24h === null
                              ? "text-text-tertiary"
                              : game.change24h >= 0
                                ? "text-green-500"
                                : "text-red-500",
                          )}
                        >
                          {game.change24h === null
                            ? "—"
                            : `${game.change24h >= 0 ? "+" : ""}${game.change24h.toFixed(2)}%`}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-text-tertiary py-8 text-center">
              No gaming data available right now. Check back soon.
            </p>
          )}
        </section>

        {/* ══════════ 5. NFT News Feed ══════════ */}
        <section>
          <SectionHeading
            title="Latest NFT News"
            subtitle="Real-time news from top NFT sources"
            icon="📰"
          />
          {articles.length === 0 ? (
            <p className="text-text-tertiary py-8 text-center">
              No NFT articles available right now. Check back soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article) => (
                <NewsCardCompact key={article.link} article={article} />
              ))}
            </div>
          )}
        </section>

        {/* ══════════ 6. Quick Links ══════════ */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">
                🔗 NFT &amp; Gaming API
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {[
                { label: "NFT Market API", href: "/api/nft", icon: "🖼️" },
                { label: "Gaming Data API", href: "/api/gaming", icon: "🎮" },
                {
                  label: "NFT Collections",
                  href: "/api/nft/collections",
                  icon: "📁",
                },
                {
                  label: "Recent Sales",
                  href: "/api/nft/sales",
                  icon: "💰",
                },
                {
                  label: "NFT News Feed",
                  href: "/api/news?category=nft",
                  icon: "📰",
                },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="outline" size="sm">
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}
