import { setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateSEOMetadata } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Bitcoin,
  Globe,
  LineChart,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: "Macro Dashboard — Economic Indicators & Crypto Market Impact",
    description:
      "Track macroeconomic indicators that impact crypto markets. Monitor Fed rates, CPI, DXY, Treasury yields, and their correlation with Bitcoin and digital assets.",
    path: "/macro",
    locale,
    tags: [
      "macro",
      "federal reserve",
      "interest rates",
      "CPI",
      "DXY",
      "economic indicators",
    ],
  });
}

/* ------------------------------------------------------------------ */
/*  Types & data                                                       */
/* ------------------------------------------------------------------ */

interface MacroIndicator {
  label: string;
  value: string;
  change: string;
  changeDir: "up" | "down" | "flat";
  icon: typeof DollarSign;
  description: string;
}

const MACRO_INDICATORS: MacroIndicator[] = [
  {
    label: "Fed Funds Rate",
    value: "4.25–4.50%",
    change: "-25 bps",
    changeDir: "down",
    icon: Landmark,
    description: "Current Federal Reserve target rate range",
  },
  {
    label: "CPI (YoY)",
    value: "2.8%",
    change: "-0.1%",
    changeDir: "down",
    icon: BarChart3,
    description: "Consumer Price Index year-over-year change",
  },
  {
    label: "DXY Index",
    value: "103.42",
    change: "-0.8%",
    changeDir: "down",
    icon: DollarSign,
    description: "US Dollar Index — strength against major currencies",
  },
  {
    label: "Gold Price",
    value: "$2,945",
    change: "+2.3%",
    changeDir: "up",
    icon: Activity,
    description: "Spot gold price per troy ounce",
  },
  {
    label: "S&P 500",
    value: "5,820",
    change: "+1.1%",
    changeDir: "up",
    icon: TrendingUp,
    description: "S&P 500 stock market index",
  },
  {
    label: "10Y Treasury Yield",
    value: "4.15%",
    change: "-5 bps",
    changeDir: "down",
    icon: LineChart,
    description: "US 10-year Treasury bond yield",
  },
];

interface CorrelationRow {
  indicator: string;
  correlation: number;
  relationship: string;
}

const CORRELATIONS: CorrelationRow[] = [
  {
    indicator: "DXY Index",
    correlation: -0.72,
    relationship: "Strong negative — weaker dollar tends to boost BTC",
  },
  {
    indicator: "S&P 500",
    correlation: 0.65,
    relationship: "Moderate positive — BTC often follows risk-on sentiment",
  },
  {
    indicator: "Gold",
    correlation: 0.48,
    relationship: "Moderate positive — both seen as inflation hedges",
  },
  {
    indicator: "10Y Treasury Yield",
    correlation: -0.55,
    relationship: "Moderate negative — higher yields draw capital from crypto",
  },
  {
    indicator: "CPI (YoY)",
    correlation: 0.35,
    relationship: "Weak positive — inflation expectations can boost BTC narrative",
  },
  {
    indicator: "Fed Funds Rate",
    correlation: -0.42,
    relationship:
      "Moderate negative — rate cuts historically bullish for crypto",
  },
];

interface UpcomingEvent {
  title: string;
  date: string;
  type: string;
  impact: "High" | "Medium" | "Low";
}

const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    title: "FOMC Meeting & Rate Decision",
    date: "2026-03-18",
    type: "Federal Reserve",
    impact: "High",
  },
  {
    title: "CPI Report (February)",
    date: "2026-03-12",
    type: "Inflation Data",
    impact: "High",
  },
  {
    title: "PPI Report (February)",
    date: "2026-03-13",
    type: "Inflation Data",
    impact: "Medium",
  },
  {
    title: "Retail Sales Data",
    date: "2026-03-14",
    type: "Consumer Data",
    impact: "Medium",
  },
  {
    title: "Jobless Claims (Weekly)",
    date: "2026-03-06",
    type: "Employment",
    impact: "Low",
  },
  {
    title: "ECB Rate Decision",
    date: "2026-03-06",
    type: "European Central Bank",
    impact: "Medium",
  },
];

interface EducationCard {
  title: string;
  description: string;
  icon: typeof BookOpen;
}

const EDUCATION_CARDS: EducationCard[] = [
  {
    title: "Interest Rates & Crypto",
    description:
      "When the Fed cuts rates, borrowing becomes cheaper and investors seek higher-yield assets. This typically drives capital into riskier assets like cryptocurrencies, making rate cuts historically bullish for BTC.",
    icon: Landmark,
  },
  {
    title: "Inflation & Digital Assets",
    description:
      "Bitcoin was designed as an inflation hedge with a fixed supply of 21 million. When CPI rises, it reinforces the narrative of BTC as \"digital gold\" and a store of value against currency debasement.",
    icon: BarChart3,
  },
  {
    title: "Dollar Strength (DXY)",
    description:
      "The DXY measures USD strength against major currencies. A weakening dollar often correlates with rising crypto prices, as global investors seek alternatives to depreciating fiat currencies.",
    icon: DollarSign,
  },
  {
    title: "Risk-On vs Risk-Off",
    description:
      "During risk-on environments (falling yields, stock rally, weak dollar), crypto tends to outperform. Risk-off events (geopolitical tension, rate hikes) can cause sharp crypto sell-offs as investors flee to safety.",
    icon: Activity,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function SectionHeading({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Landmark;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)] md:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ indicator }: { indicator: MacroIndicator }) {
  const Icon = indicator.icon;
  const isUp = indicator.changeDir === "up";
  const isDown = indicator.changeDir === "down";
  const ChangeIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Activity;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              isUp && "text-emerald-600 dark:text-emerald-400",
              isDown && "text-red-600 dark:text-red-400",
              !isUp && !isDown && "text-[var(--color-text-tertiary)]",
            )}
          >
            <ChangeIcon className="h-3 w-3" />
            {indicator.change}
          </span>
        </div>
        <p className="text-2xl font-bold text-[var(--color-text-primary)]">
          {indicator.value}
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
          {indicator.label}
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
          {indicator.description}
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function MacroPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10 space-y-14">
        {/* Page Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">Macro</Badge>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
            Macro Dashboard
          </h1>
          <p className="max-w-2xl text-[var(--color-text-secondary)]">
            Track macroeconomic indicators that impact cryptocurrency markets.
            Monitor interest rates, inflation data, dollar strength, and their
            correlation with digital assets.
          </p>
        </header>

        {/* Section 1 — Key Macro Indicators */}
        <section>
          <SectionHeading
            title="Key Macro Indicators"
            subtitle="Core economic metrics that influence crypto markets"
            icon={BarChart3}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MACRO_INDICATORS.map((ind) => (
              <StatCard key={ind.label} indicator={ind} />
            ))}
          </div>
        </section>

        {/* Section 2 — Crypto vs Macro Correlation */}
        <section>
          <SectionHeading
            title="BTC vs Macro Correlation"
            subtitle="How Bitcoin correlates with major macroeconomic indicators (90-day rolling)"
            icon={Bitcoin}
          />
          <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)]">
                    Indicator
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--color-text-primary)]">
                    Correlation
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] hidden sm:table-cell">
                    Relationship
                  </th>
                </tr>
              </thead>
              <tbody>
                {CORRELATIONS.map((row) => {
                  const isPositive = row.correlation > 0;
                  const absCorr = Math.abs(row.correlation);
                  // Color intensity: stronger correlation → more vivid
                  return (
                    <tr
                      key={row.indicator}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-secondary)] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                        {row.indicator}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Visual bar */}
                          <div className="hidden md:flex w-24 items-center">
                            <div className="relative h-2 w-full rounded-full bg-[var(--color-surface-tertiary)]">
                              <div
                                className={cn(
                                  "absolute top-0 h-2 rounded-full",
                                  isPositive
                                    ? "left-1/2 bg-emerald-500"
                                    : "right-1/2 bg-red-500",
                                )}
                                style={{ width: `${absCorr * 50}%` }}
                              />
                              <div className="absolute left-1/2 top-0 h-2 w-px bg-[var(--color-border)]" />
                            </div>
                          </div>
                          <span
                            className={cn(
                              "font-mono font-semibold",
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {row.correlation.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)] hidden sm:table-cell">
                        {row.relationship}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            Correlation values range from -1 (perfect inverse) to +1 (perfect
            positive). Based on 90-day rolling data. Past correlations do not
            guarantee future relationships.
          </p>
        </section>

        {/* Section 3 — Upcoming Events */}
        <section>
          <SectionHeading
            title="Upcoming Economic Events"
            subtitle="Key dates that could impact crypto markets"
            icon={Calendar}
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {UPCOMING_EVENTS.map((event) => (
              <Card
                key={event.title}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                        {event.type}
                      </p>
                    </div>
                    <Badge
                      variant={
                        event.impact === "High"
                          ? "breaking"
                          : event.impact === "Medium"
                            ? "trading"
                            : "default"
                      }
                    >
                      {event.impact}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <Calendar className="h-3 w-3" />
                    <time>{event.date}</time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 4 — Impact Analysis */}
        <section>
          <SectionHeading
            title="How Macro Affects Crypto"
            subtitle="Understanding the relationship between traditional finance and digital assets"
            icon={BookOpen}
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {EDUCATION_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <CardTitle className="font-serif text-base">
                        {card.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Disclaimer */}
        <aside className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            <strong>Disclaimer:</strong> Macroeconomic data shown is for
            informational purposes only. Correlations are based on historical
            data and may not predict future market behavior. This is not
            financial advice. Always do your own research.
          </p>
        </aside>
      </main>
      <Footer />
    </>
  );
}
