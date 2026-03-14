import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  BarChart3,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  Brain,
  Sparkles,
  TrendingUp,
  Search,
} from "lucide-react";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

// =============================================================================
// Types
// =============================================================================

interface ResearchReport {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: "market-analysis" | "token-review" | "sector-report" | "weekly-digest";
  readTime: number; // minutes
  author?: string;
}

// =============================================================================
// Constants
// =============================================================================

const CATEGORIES = [
  { key: "all", label: "All Research", icon: BookOpen },
  { key: "market-analysis", label: "Market Analysis", icon: BarChart3 },
  { key: "token-review", label: "Token Reports", icon: FileText },
  { key: "sector-report", label: "Sector Deep Dives", icon: Layers },
  { key: "weekly-digest", label: "Weekly Digest", icon: Calendar },
] as const;

function getCategoryBadge(category: ResearchReport["category"]): {
  label: string;
  className: string;
} {
  switch (category) {
    case "market-analysis":
      return {
        label: "Market Analysis",
        className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      };
    case "token-review":
      return {
        label: "Token Review",
        className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      };
    case "sector-report":
      return {
        label: "Sector Report",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      };
    case "weekly-digest":
      return {
        label: "Weekly Digest",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      };
  }
}

// =============================================================================
// Mock Data (realistic sample research reports)
// =============================================================================

function getResearchReports(): ResearchReport[] {
  return [
    {
      id: "btc-institutional-flows-2026",
      title: "Bitcoin Institutional Flows: Q1 2026 Deep Dive",
      excerpt:
        "Analysis of institutional adoption trends, ETF inflows, and corporate treasury allocations shaping Bitcoin's market structure in early 2026.",
      date: "2026-02-28",
      category: "market-analysis",
      readTime: 12,
      author: "Research Team",
    },
    {
      id: "eth-pectra-upgrade-impact",
      title: "Ethereum Pectra Upgrade: Technical Analysis & Price Impact",
      excerpt:
        "Comprehensive review of Ethereum's Pectra upgrade, its effects on staking economics, gas efficiency, and potential market implications.",
      date: "2026-02-25",
      category: "token-review",
      readTime: 15,
      author: "Research Team",
    },
    {
      id: "defi-yield-landscape-q1",
      title: "DeFi Yield Landscape: Where the Real Yields Are in 2026",
      excerpt:
        "Sector analysis of sustainable DeFi yields, comparing lending protocols, liquid staking, and RWA-backed opportunities across major chains.",
      date: "2026-02-22",
      category: "sector-report",
      readTime: 18,
      author: "Research Team",
    },
    {
      id: "weekly-digest-2026-w08",
      title: "Weekly Crypto Digest — Feb 17–23, 2026",
      excerpt:
        "Key market movements, regulatory updates, notable project launches, and the most impactful crypto news from the past week.",
      date: "2026-02-23",
      category: "weekly-digest",
      readTime: 8,
      author: "Research Team",
    },
    {
      id: "sol-ecosystem-growth-2026",
      title: "Solana Ecosystem Growth Report: Firedancer & Beyond",
      excerpt:
        "Reviewing Solana's network performance improvements, DEX volume dominance, and ecosystem expansion through the Firedancer client upgrade.",
      date: "2026-02-20",
      category: "token-review",
      readTime: 14,
      author: "Research Team",
    },
    {
      id: "l2-wars-comparison",
      title: "Layer 2 Wars: Arbitrum vs Base vs Optimism vs ZkSync",
      excerpt:
        "Comparative analysis of leading Ethereum L2s by TVL, transaction volume, fee economics, developer activity, and ecosystem growth.",
      date: "2026-02-18",
      category: "sector-report",
      readTime: 20,
      author: "Research Team",
    },
    {
      id: "macro-crypto-correlation",
      title: "Macro & Crypto: Interest Rate Cycle Impact on Digital Assets",
      excerpt:
        "How central bank policies, inflation trends, and liquidity cycles are affecting crypto market dynamics heading into mid-2026.",
      date: "2026-02-15",
      category: "market-analysis",
      readTime: 10,
      author: "Research Team",
    },
    {
      id: "weekly-digest-2026-w07",
      title: "Weekly Crypto Digest — Feb 10–16, 2026",
      excerpt:
        "Bitcoin ETF milestone, new DeFi protocol launches, and regulatory developments from the EU and Asia summarized for the week.",
      date: "2026-02-16",
      category: "weekly-digest",
      readTime: 7,
      author: "Research Team",
    },
    {
      id: "rwa-tokenization-report",
      title: "Real-World Asset Tokenization: The Next Trillion-Dollar Opportunity",
      excerpt:
        "Deep dive into RWA tokenization covering treasury bills, real estate, and commodities on-chain, with market sizing and key players.",
      date: "2026-02-12",
      category: "sector-report",
      readTime: 16,
      author: "Research Team",
    },
  ];
}

// =============================================================================
// Metadata
// =============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Crypto Research Hub — Market Analysis, Token Reports & Deep Dives",
    description:
      "In-depth cryptocurrency research including market analysis, token reviews, sector deep dives, and weekly digests. AI-powered insights and expert analysis.",
    path: "/research",
    locale,
    tags: [
      "crypto research",
      "market analysis",
      "token review",
      "defi research",
      "crypto reports",
      "blockchain analysis",
    ],
  });
}

// =============================================================================
// Page Component
// =============================================================================

export default async function ResearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reports = getResearchReports();

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-accent" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">
              Research Hub
            </h1>
          </div>
          <p className="text-text-secondary max-w-2xl">
            In-depth cryptocurrency research, market analysis, token reviews, sector deep dives,
            and weekly digests powered by AI and expert analysis.
          </p>
        </div>

        {/* AI-Powered Analysis CTA */}
        <section className="mb-10">
          <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-(--color-surface) to-surface-secondary">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      AI-Powered
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">
                    Ask AI About Any Crypto Topic
                  </h2>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Get instant AI-generated analysis on any cryptocurrency, market trend, or
                    blockchain project. Powered by real-time news data and market intelligence.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button asChild variant="default" size="lg">
                    <Link href="/predictions">
                      <Brain className="h-4 w-4 mr-2" />
                      View Predictions
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/search">
                      <Search className="h-4 w-4 mr-2" />
                      Search Research
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Research Categories */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  "border border-border hover:bg-surface-secondary",
                  key === "all" &&
                    "bg-accent text-white border-accent hover:bg-accent/90"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Research Grid */}
        <section className="mb-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const catBadge = getCategoryBadge(report.category);
              return (
                <Card
                  key={report.id}
                  className="flex flex-col hover:shadow-lg transition-shadow group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                          catBadge.className
                        )}
                      >
                        {catBadge.label}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-text-tertiary">
                        <Clock className="h-3 w-3" />
                        {report.readTime} min read
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-snug group-hover:text-accent transition-colors">
                      {report.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-4">
                      {report.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent group-hover:underline">
                        Read Report <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Research Stats */}
        <section className="mb-12">
          <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary mb-6">
            Research Coverage
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Reports Published",
                value: "240+",
                icon: FileText,
                description: "In-depth analyses",
              },
              {
                label: "Tokens Covered",
                value: "150+",
                icon: TrendingUp,
                description: "Active coverage",
              },
              {
                label: "Sectors Tracked",
                value: "12",
                icon: Layers,
                description: "DeFi, L2, NFT, etc.",
              },
              {
                label: "Weekly Digests",
                value: "52+",
                icon: Calendar,
                description: "Every week, on time",
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stat.value}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <stat.icon className="h-5 w-5 text-accent opacity-60" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Topics Section */}
        <section>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-text-primary mb-6">
            Popular Research Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Bitcoin ETF",
              "Ethereum L2s",
              "DeFi Yields",
              "Solana Ecosystem",
              "RWA Tokenization",
              "AI & Crypto",
              "Stablecoin Regulation",
              "Liquid Staking",
              "Cross-Chain Bridges",
              "NFT Market",
              "Memecoins",
              "Layer 2 Scaling",
              "Bitcoin Halving",
              "Crypto Derivatives",
              "Macro & Crypto",
              "On-Chain Analytics",
            ].map((topic) => (
              <Badge
                key={topic}
                variant="default"
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-surface-secondary transition-colors"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
