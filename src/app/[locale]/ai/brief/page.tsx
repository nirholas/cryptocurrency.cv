import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ai');
  return {
    title: `${t('brief.title')} - Free Crypto News`,
    description: t('brief.description'),
  };
}

export const dynamic = 'force-dynamic';

interface DailyBrief {
  date: string;
  executiveSummary: string;
  marketOverview: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    btcTrend: string;
    keyMetrics: {
      fearGreedIndex: number;
      btcDominance: number;
      totalMarketCap: string;
    };
  };
  topStories: {
    headline: string;
    summary: string;
    impact: 'high' | 'medium' | 'low';
    relatedTickers: string[];
  }[];
  sectorsInFocus: {
    sector: string;
    trend: 'up' | 'down' | 'stable';
    reason: string;
  }[];
  upcomingEvents: {
    event: string;
    date: string;
    potentialImpact: string;
  }[];
  riskAlerts: string[];
  generatedAt: string;
}

async function getBrief(date?: string): Promise<DailyBrief | null> {
  if (process.env.VERCEL_ENV === 'production' && process.env.CI) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';
    const url = date 
      ? `${baseUrl}/api/ai/brief?date=${date}&format=full`
      : `${baseUrl}/api/ai/brief?format=full`;
    
    const res = await fetch(url, {
      next: { revalidate: 900 }, // 15 min cache
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.brief : null;
  } catch {
    return null;
  }
}

const sentimentConfig = {
  bullish: { color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: '🟢', label: 'Bullish' },
  bearish: { color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: '🔴', label: 'Bearish' },
  neutral: { color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300', icon: '⚪', label: 'Neutral' },
};

const impactConfig = {
  high: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🔥' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '⚡' },
  low: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '💡' },
};

const trendConfig = {
  up: { color: 'text-green-600 dark:text-green-400', icon: '📈' },
  down: { color: 'text-red-600 dark:text-red-400', icon: '📉' },
  stable: { color: 'text-gray-600 dark:text-gray-400', icon: '➡️' },
};

export default async function BriefPage() {
  const brief = await getBrief();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <Header />

        <main className="px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">📊 The Brief</h1>
            <p className="text-gray-600 dark:text-slate-400">
              AI-powered daily market intelligence
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/ai/debate" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                🎭 The Debate →
              </Link>
              <Link href="/ai/counter" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                ⚖️ The Counter →
              </Link>
            </div>
          </div>

          {brief ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-xl font-bold">Executive Summary</h2>
                  <span className="ml-auto text-sm opacity-80">{brief.date}</span>
                </div>
                <p className="text-lg leading-relaxed">{brief.executiveSummary}</p>
              </div>

              {/* Market Overview */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  📊 Market Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Sentiment Badge */}
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400">Sentiment:</span>
                    <span className={`px-4 py-2 rounded-full font-medium ${sentimentConfig[brief.marketOverview.sentiment].color}`}>
                      {sentimentConfig[brief.marketOverview.sentiment].icon} {sentimentConfig[brief.marketOverview.sentiment].label}
                    </span>
                  </div>
                  
                  {/* BTC Trend */}
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-slate-400">BTC Trend:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{brief.marketOverview.btcTrend}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{brief.marketOverview.keyMetrics.fearGreedIndex}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">Fear & Greed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{brief.marketOverview.keyMetrics.btcDominance}%</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">BTC Dominance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{brief.marketOverview.keyMetrics.totalMarketCap}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">Total Cap</div>
                  </div>
                </div>
              </div>

              {/* Top Stories */}
              {brief.topStories?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">🔥 Top Stories</h3>
                  <div className="space-y-4">
                    {brief.topStories.map((story, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${impactConfig[story.impact].color}`}>
                                {impactConfig[story.impact].icon} {story.impact.toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{story.headline}</h4>
                            <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">{story.summary}</p>
                            {story.relatedTickers?.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {story.relatedTickers.map((ticker) => (
                                  <Link
                                    key={ticker}
                                    href={`/search?q=${ticker}`}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                  >
                                    ${ticker}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sectors in Focus */}
              {brief.sectorsInFocus?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">🎯 Sectors in Focus</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {brief.sectorsInFocus.map((sector, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{sector.sector}</span>
                          <span className={trendConfig[sector.trend].color}>
                            {trendConfig[sector.trend].icon}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-300">{sector.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              {brief.upcomingEvents?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">📅 Upcoming Events</h3>
                  <div className="space-y-3">
                    {brief.upcomingEvents.map((event, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-gray-500 dark:text-slate-400">{event.date}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{event.event}</div>
                          <div className="text-sm text-gray-600 dark:text-slate-300">{event.potentialImpact}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Alerts */}
              {brief.riskAlerts?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 text-red-700 dark:text-red-400">⚠️ Risk Alerts</h3>
                  <ul className="space-y-2">
                    {brief.riskAlerts.map((alert, i) => (
                      <li key={i} className="flex items-start gap-2 text-red-700 dark:text-red-300">
                        <span>•</span>
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-center text-sm text-gray-500 dark:text-slate-400">
                Generated at {new Date(brief.generatedAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-300 mb-2">Daily Brief Unavailable</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">
                AI features require an API key (GROQ_API_KEY, OPENAI_API_KEY, etc.)
              </p>
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                ← Back to latest news
              </Link>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
