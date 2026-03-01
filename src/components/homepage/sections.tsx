/**
 * Homepage Section Components
 * 
 * Extracted from page.tsx to improve maintainability and enable
 * lazy loading of below-fold sections.
 */

import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { categories } from '@/lib/categories';

/* ------------------------------------------------------------------ */
/* Market Activity Section (Whale Alerts + Liquidations)              */
/* ------------------------------------------------------------------ */

import WhaleAlerts from '@/components/WhaleAlerts';
import { LiquidationsFeed } from '@/components/LiquidationsFeed';

const sectionFallback = (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 h-64 animate-pulse" />
);

export function MarketActivitySection() {
  return (
    <section
      className="px-4 sm:px-6 lg:px-8 mb-8"
      aria-label="Real-time market activity"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-brand-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Live Market Activity
        </h2>
        <span className="relative flex h-3 w-3" aria-label="Live indicator">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={sectionFallback}>
          <WhaleAlerts />
        </Suspense>
        <Suspense fallback={sectionFallback}>
          <LiquidationsFeed />
        </Suspense>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Categories Navigation                                              */
/* ------------------------------------------------------------------ */

export function CategoriesNav() {
  return (
    <nav className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="News categories">
      <ScrollIndicator showArrows={true} arrowSize="sm">
        <div className="flex gap-2 pb-2 min-w-max">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-gray-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-sm focus-ring ${cat.color}`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <span aria-hidden="true">{cat.icon}</span>
              <span className="text-gray-700 dark:text-slate-300 font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </ScrollIndicator>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* AI Insights Section (Flash Brief + Topic Digest combined)          */
/* ------------------------------------------------------------------ */

import { AIFlashBrief } from '@/components/AIFlashBrief';
import { AITopicDigest } from '@/components/AITopicDigest';

const aiFallback = (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 h-48 animate-pulse" />
);

export function AIInsightsSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-8 space-y-6" aria-label="AI insights">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-brand-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          <span aria-hidden="true" className="mr-2">🤖</span>
          <span className="sr-only">AI </span>Insights
        </h2>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={aiFallback}>
          <AIFlashBrief />
        </Suspense>
        <Suspense fallback={aiFallback}>
          <AITopicDigest />
        </Suspense>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Market Intelligence Section (Signals + Trending Topics combined)   */
/* ------------------------------------------------------------------ */

import { MarketSignals } from '@/components/MarketSignals';
import { TrendingTopicsLive } from '@/components/TrendingTopicsLive';

export function MarketIntelligenceSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-8 space-y-6" aria-label="Market intelligence">
      <Suspense fallback={aiFallback}>
        <MarketSignals />
      </Suspense>
      <Suspense fallback={<div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 h-32 animate-pulse" />}>
        <TrendingTopicsLive />
      </Suspense>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trending Narratives Section                                        */
/* ------------------------------------------------------------------ */

import { TrendingNarratives } from '@/components/TrendingNarratives';

export function TrendingNarrativesSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Trending narratives">
      <Suspense fallback={aiFallback}>
        <TrendingNarratives />
      </Suspense>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Explore & Connect Section (sidebars grid)                          */
/* ------------------------------------------------------------------ */

import MarketStats from '@/components/MarketStats';
import { PredictionPoll } from '@/components/PredictionPoll';
import { NewsletterSignup } from '@/components/sidebar';

export function ExploreSection({ sourceCount }: { sourceCount: number }) {
  return (
    <section
      className="px-4 sm:px-6 lg:px-8 mb-8"
      aria-label="Explore and connect"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-brand-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Explore &amp; Connect
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Market Overview — spans 2 cols on large */}
        <div className="sm:col-span-2 lg:col-span-2">
          <MarketStats />
        </div>

        {/* Your Outlook */}
        <div>
          <PredictionPoll />
        </div>

        {/* Categories */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-lg">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
            <h3 className="font-bold text-gray-900 dark:text-white">
              <span aria-hidden="true" className="mr-2">📁</span>
              <span className="sr-only">Browse </span>Categories
            </h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors ${cat.color}`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link
              href="/topics"
              className="mt-3 text-sm font-semibold text-brand-600 dark:text-amber-400 hover:text-brand-700 dark:hover:text-amber-300 transition-colors flex items-center justify-center gap-1"
            >
              All Topics →
            </Link>
          </div>
        </div>

        {/* Free API */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/30 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span aria-hidden="true" className="text-2xl">🚀</span>
              <h3 className="font-bold text-lg">
                <span className="sr-only">Our </span>Free API
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              No API keys required. No rate limits. Get real-time news from{' '}
              {sourceCount}+ crypto sources.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Learn more
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Stay Updated — Newsletter */}
        <div>
          <NewsletterSignup />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom CTA Section                                                 */
/* ------------------------------------------------------------------ */

export function BottomCTASection({ sourceCount }: { sourceCount: number }) {
  return (
    <section
      className="px-4 sm:px-6 lg:px-8 py-16 mt-8"
      aria-label="Developer resources"
    >
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px]" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]" aria-hidden="true" />

        <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Build with Free Crypto News
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            No API keys required. No rate limits. Get real-time news from{' '}
            {sourceCount}+ crypto sources.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-gray-100 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
              Deploy Your Own
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-brand-500 text-black px-6 py-3.5 rounded-full font-semibold hover:bg-brand-400 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <span aria-hidden="true">📚</span>
              <span className="sr-only">View </span>API Documentation
            </Link>
            <Link
              href="/examples"
              className="inline-flex items-center gap-2 bg-transparent text-white border-2 border-white/30 px-6 py-3.5 rounded-full font-semibold hover:bg-white hover:text-black hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <span aria-hidden="true">💻</span>
              <span className="sr-only">View </span>Code Examples
            </Link>
          </div>

          {/* Quick features */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-400">
            {[
              { label: 'No API Keys' },
              { label: 'No Rate Limits' },
              { label: `${sourceCount}+ News Sources` },
              { label: 'MIT Licensed' },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
