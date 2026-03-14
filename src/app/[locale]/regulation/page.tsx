import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { getNewsByCategory } from '@/lib/crypto-news';
import { NewsCardCompact } from '@/components/NewsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import RegulationMap from '@/components/RegulationMap';
import {
  Scale,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Landmark,
  ScrollText,
  Newspaper,
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Crypto Regulation Tracker — Global Cryptocurrency Policy & Legal Updates',
    description:
      'Track cryptocurrency regulations worldwide. Monitor policy changes, government stances, and legal developments across every jurisdiction in real-time.',
    path: '/regulation',
    locale,
    tags: ['regulation', 'crypto policy', 'SEC', 'MiCA', 'crypto law', 'compliance'],
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface RegulatoryAction {
  country: string;
  flag: string;
  title: string;
  date: string;
  impact: 'bullish' | 'bearish' | 'neutral';
}

const RECENT_ACTIONS: RegulatoryAction[] = [
  {
    country: 'United States',
    flag: '🇺🇸',
    title: 'SEC approves spot Ethereum ETF options trading',
    date: '2026-02-28',
    impact: 'bullish',
  },
  {
    country: 'European Union',
    flag: '🇪🇺',
    title: 'MiCA stablecoin reserve audit requirements take effect',
    date: '2026-02-25',
    impact: 'neutral',
  },
  {
    country: 'Hong Kong',
    flag: '🇭🇰',
    title: 'SFC expands retail access to tokenized securities',
    date: '2026-02-24',
    impact: 'bullish',
  },
  {
    country: 'UAE',
    flag: '🇦🇪',
    title: 'VARA issues updated licensing requirements for DeFi platforms',
    date: '2026-02-22',
    impact: 'bullish',
  },
  {
    country: 'India',
    flag: '🇮🇳',
    title: 'Government proposes raising TDS threshold on crypto transactions',
    date: '2026-02-20',
    impact: 'bullish',
  },
  {
    country: 'South Korea',
    flag: '🇰🇷',
    title: 'FSC releases institutional crypto investment guidelines',
    date: '2026-02-18',
    impact: 'bullish',
  },
  {
    country: 'Nigeria',
    flag: '🇳🇬',
    title: 'SEC proposes comprehensive crypto asset regulation framework',
    date: '2026-02-15',
    impact: 'neutral',
  },
  {
    country: 'China',
    flag: '🇨🇳',
    title: 'PBoC announces e-CNY cross-border payment pilot expansion',
    date: '2026-02-12',
    impact: 'neutral',
  },
];

function ImpactBadge({ impact }: { impact: 'bullish' | 'bearish' | 'neutral' }) {
  if (impact === 'bullish') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        Bullish
      </span>
    );
  }
  if (impact === 'bearish') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <TrendingDown className="h-3 w-3" />
        Bearish
      </span>
    );
  }
  return (
    <span className="bg-surface-tertiary text-text-secondary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
      <Minus className="h-3 w-3" />
      Neutral
    </span>
  );
}

function SectionHeading({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Scale;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-text-primary font-serif text-xl font-bold md:text-2xl">{title}</h2>
        {subtitle && <p className="text-text-secondary mt-0.5 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function RegulationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let regulationNews;
  try {
    regulationNews = await getNewsByCategory('regulation', 10);
  } catch {
    regulationNews = { articles: [] };
  }

  return (
    <>
      <Header />
      <main className="container-main space-y-14 py-10">
        {/* Page Header */}
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="regulation">Regulation</Badge>
          </div>
          <h1 className="text-text-primary font-serif text-3xl font-bold md:text-4xl">
            Crypto Regulation Tracker
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Monitor cryptocurrency regulations, government policies, and legal developments across
            every major jurisdiction worldwide.
          </p>
        </header>

        {/* Section 1 — Global Regulation Map */}
        <section>
          <SectionHeading
            title="Global Regulatory Stance"
            subtitle="Click a country to view regulatory details and recent actions"
            icon={Globe}
          />
          <div className="mt-6">
            <RegulationMap />
          </div>
        </section>

        {/* Section 2 — Recent Regulatory Actions Timeline */}
        <section>
          <SectionHeading
            title="Recent Regulatory Actions"
            subtitle="Latest regulatory decisions and policy changes worldwide"
            icon={ScrollText}
          />

          <div className="relative mt-6">
            {/* Timeline line */}
            <div className="bg-border absolute top-0 bottom-0 left-4 w-px md:left-6" />

            <div className="space-y-4">
              {RECENT_ACTIONS.map((action, i) => (
                <div
                  key={i}
                  className="border-border relative ml-10 rounded-lg border bg-(--color-surface) p-4 transition-shadow hover:shadow-md md:ml-14"
                >
                  {/* Timeline dot */}
                  <div className="border-accent absolute top-5 -left-6.5 h-3 w-3 rounded-full border-2 bg-(--color-surface) md:-left-8.5" />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{action.flag}</span>
                      <span className="text-text-primary text-sm font-medium">
                        {action.country}
                      </span>
                      <ImpactBadge impact={action.impact} />
                    </div>
                    <time className="text-text-tertiary flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {action.date}
                    </time>
                  </div>
                  <p className="text-text-secondary mt-1.5 text-sm">{action.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3 — Regulation News */}
        <section>
          <SectionHeading
            title="Regulation News"
            subtitle="Latest news and articles about cryptocurrency regulation"
            icon={Newspaper}
          />

          {regulationNews.articles.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {regulationNews.articles.slice(0, 9).map((article) => (
                <NewsCardCompact key={article.link} article={article} />
              ))}
            </div>
          ) : (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Landmark className="text-text-tertiary mb-3 h-10 w-10" />
                <p className="text-text-secondary text-sm">
                  No regulation news available at the moment.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Section 4 — Key Frameworks */}
        <section>
          <SectionHeading
            title="Key Regulatory Frameworks"
            subtitle="The most important crypto regulations you should know about"
            icon={Scale}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'MiCA (EU)',
                description:
                  "Markets in Crypto-Assets regulation — the EU's comprehensive framework for crypto-asset service providers covering licensing, stablecoins, and consumer protection.",
                status: 'Active',
              },
              {
                title: 'FIT21 Act (US)',
                description:
                  'Financial Innovation and Technology for the 21st Century Act — proposes SEC and CFTC jurisdiction framework for digital assets in the United States.',
                status: 'In Progress',
              },
              {
                title: 'Travel Rule (FATF)',
                description:
                  'FATF Recommendation 16 requires VASPs to share originator and beneficiary information for crypto transfers above threshold amounts.',
                status: 'Active',
              },
              {
                title: 'VATP Regime (HK)',
                description:
                  "Hong Kong's Virtual Asset Trading Platform licensing regime under the Securities and Futures Commission for regulated crypto trading.",
                status: 'Active',
              },
              {
                title: 'DLT Act (Switzerland)',
                description:
                  'Swiss Distributed Ledger Technology Act provides legal certainty for tokenized assets and DLT-based trading facilities.',
                status: 'Active',
              },
              {
                title: 'VARA Framework (UAE)',
                description:
                  "Dubai's Virtual Assets Regulatory Authority framework — one of the world's first dedicated crypto regulators with comprehensive licensing.",
                status: 'Active',
              },
            ].map((fw) => (
              <Card key={fw.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-base">{fw.title}</CardTitle>
                    <Badge variant={fw.status === 'Active' ? 'default' : 'trading'}>
                      {fw.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary text-sm">{fw.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
