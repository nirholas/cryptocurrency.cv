/**
 * Free Crypto News - Professional Homepage
 * Inspired by CoinDesk, The Block, and Google News layouts
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceTicker from "@/components/PriceTicker";
import BreakingNewsBanner from "@/components/BreakingNewsBanner";
import HeroArticle from "@/components/HeroArticle";
import FeaturedStoryTabs from "@/components/FeaturedStoryTabs";
import HomeMarketStrip from "@/components/HomeMarketStrip";
import NewsCard from "@/components/NewsCard";
import NewsCluster from "@/components/NewsCluster";
import LatestNewsFeed from "@/components/LatestNewsFeed";
import MostRead from "@/components/MostRead";
import TrendingSidebar from "@/components/TrendingSidebar";
import SourceSections from "@/components/SourceSections";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import {
  WebsiteStructuredData,
  OrganizationStructuredData,
  NewsListStructuredData,
} from "@/components/StructuredData";
import WhaleAlerts from "@/components/WhaleAlerts";
import { LiquidationsFeed } from "@/components/LiquidationsFeed";
import { MarketSignals } from "@/components/MarketSignals";
import { TrendingNarratives } from "@/components/TrendingNarratives";
import { WhaleActivityFeed } from "@/components/WhaleActivityFeed";
import { LiveNewsTicker } from "@/components/LiveNewsTicker";
import { AskAboutThis } from "@/components/AskAboutThis";
import { AIFlashBrief } from "@/components/AIFlashBrief";
import { AITopicDigest } from "@/components/AITopicDigest";
import { TrendingTopicsLive } from "@/components/TrendingTopicsLive";
import MarketStats from "@/components/MarketStats";
import { PredictionPoll } from "@/components/PredictionPoll";
import { NewsletterSignup } from "@/components/sidebar";
import {
  getHomepageNews,
  getSourceCount,
  getLocalizedDescription,
  type NewsResponse,
} from "@/lib/crypto-news";
import { clusterSimilarArticles } from "@/lib/ai-intelligence";
import { categories } from "@/lib/categories";
import { Link } from "@/i18n/navigation";

export const revalidate = 120; // Revalidate every 2 minutes

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const tNews = await getTranslations("news");

  const emptyFeed: NewsResponse = {
    articles: [],
    totalCount: 0,
    sources: [],
    fetchedAt: new Date().toISOString(),
  };
  let newsData: NewsResponse;
  let breakingData: NewsResponse;
  let trendingData: NewsResponse;
  try {
    const result = await getHomepageNews({
      latestLimit: 50,
      breakingLimit: 5,
      trendingLimit: 10,
    });
    newsData = result.latest;
    breakingData = result.breaking;
    trendingData = result.trending;
  } catch (error) {
    console.error("[Homepage] Failed to fetch news data:", error);
    newsData = emptyFeed;
    breakingData = emptyFeed;
    trendingData = emptyFeed;
  }

  // Get dynamic source count
  const sourceCount = getSourceCount();

  // Use trending articles for hero and featured sections
  const heroArticle = trendingData.articles[0]; // Top trending article as hero
  const heroSidebarArticles = trendingData.articles.slice(1, 7); // Articles 2-7 for hero sidebar list
  const featuredArticles = newsData.articles.slice(0, 20); // CoinDesk-style tabbed featured stories

  // Cluster similar articles for Google News-style multi-source view
  let newsClusters: ReturnType<typeof clusterSimilarArticles> = [];
  try {
    newsClusters = clusterSimilarArticles(newsData.articles.slice(0, 30));
  } catch (error) {
    console.error("[Homepage] Failed to cluster articles:", error);
  }

  // Deduplicate: exclude trending articles from latest news to avoid showing same content
  const trendingLinks = new Set(trendingData.articles.map((a) => a.link));
  const latestNews = newsData.articles
    .filter((article) => !trendingLinks.has(article.link))
    .slice(0, 12); // First 12 unique latest articles

  // CoinDesk-style timeline feed (left column)
  const timelineFeedArticles = newsData.articles.slice(0, 15);

  const trendingArticles = trendingData.articles.slice(0, 10); // Top 10 for sidebar
  const sourceArticles = newsData.articles.slice(12); // Rest for source sections

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Structured Data for SEO */}
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      <NewsListStructuredData
        articles={newsData.articles.slice(0, 20).map(a => ({
          ...a,
          description: getLocalizedDescription(a, locale) ?? a.description,
        }))}
        listName="Latest Crypto News"
      />

      {/* Live News Ticker - SSE powered */}
      <LiveNewsTicker />

      {/* Price Ticker - Full width */}
      <PriceTicker />

      {/* Breaking News Banner */}
      <BreakingNewsBanner articles={breakingData.articles} />

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-[1400px] mx-auto">
        {/* 1. Hero Section - CoinDesk-style split layout */}
        {heroArticle && (
          <section className="px-4 sm:px-6 lg:px-8 mb-8">
            <HeroArticle
              article={heroArticle}
              sidebarArticles={heroSidebarArticles}
            />
          </section>
        )}

        {/* 2. AI Ask Bar */}
        <section className="px-4 sm:px-6 lg:px-8 mb-6">
          <AskAboutThis
            context="crypto market news today"
            contextType="general"
            placeholder="Ask anything about crypto..."
          />
        </section>

        {/* 3. Market Overview - CoinDesk-style ranked table */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8">
          <HomeMarketStrip />
        </section>

        {/* 3. Latest News - standalone section (extracted from 3-col layout) */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-labelledby="latest-heading"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-brand-500 rounded-full" />
              <h2
                id="latest-heading"
                className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
              >
                {t("latestNews")}
              </h2>
            </div>
            <Link
              href="/read"
              className="text-sm font-semibold text-brand-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              {tCommon("viewAll")}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* News Grid - responsive 2-3 columns */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article) => (
              <NewsCard
                key={article.link}
                article={article}
                showDescription={true}
              />
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <Link
              href="/read"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-slate-700 text-white rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-slate-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              {tCommon("showMore")}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* 4. Featured Stories with sidebars */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid lg:grid-cols-[320px_1fr_380px] gap-8 xl:gap-10">
            {/* Left Column: CoinDesk-style Latest News Timeline */}
            <div className="hidden lg:block">
              <LatestNewsFeed
                articles={timelineFeedArticles}
                maxArticles={15}
              />
            </div>

            {/* Center Column: Featured Stories with Topic Tabs */}
            <section aria-label="Featured Stories">
              <FeaturedStoryTabs articles={featuredArticles} maxArticles={6} />
            </section>

            {/* Right Column: Trending Sidebar */}
            <TrendingSidebar trendingArticles={trendingArticles} />
          </div>
        </div>

        {/* 5. Most Read - CoinDesk-inspired numbered section */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Most read articles"
        >
          <MostRead articles={trendingData.articles} maxArticles={7} />
        </section>

        {/* 6. Source Sections */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="News by source"
        >
          <SourceSections
            articles={sourceArticles}
            maxSources={3}
            articlesPerSource={4}
          />
        </section>

        {/* 7. Live Market Activity: Whale Alerts + Liquidations */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Real-time market activity"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-brand-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Live Market Activity
            </h2>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <WhaleAlerts />
            <LiquidationsFeed />
          </div>
        </section>

        {/* 8. Categories Navigation with scroll indicators */}
        <nav className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="News categories">
          <ScrollIndicator showArrows={true} arrowSize="sm">
            <div className="flex gap-2 pb-2 min-w-max">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-gray-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-sm focus-ring ${cat.color}`}
                  style={{ scrollSnapAlign: "start" }}
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

        {/* 9. AI Flash Briefing */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Flash briefing"
        >
          <AIFlashBrief />
        </section>

        {/* 9b. AI Topic Digest */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="AI topic digest"
        >
          <AITopicDigest />
        </section>

        {/* 10. Market Intelligence Signals */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Market signals"
        >
          <MarketSignals />
        </section>

        {/* 11. Trending Topics - Live */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Trending topics"
        >
          <TrendingTopicsLive />
        </section>

        {/* 12. Google News-style Multi-Source Clusters */}
        {newsClusters.length > 0 && (
          <section
            className="px-4 sm:px-6 lg:px-8 mb-8"
            aria-label="Story clusters"
          >
            <NewsCluster clusters={newsClusters} maxClusters={4} />
          </section>
        )}

        {/* 13. Trending Narratives */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Trending narratives"
        >
          <TrendingNarratives />
        </section>

        {/* 14. Whale Activity Feed - Enhanced */}
        <section
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="Whale activity"
        >
          <WhaleActivityFeed />
        </section>

        {/* 15. Sidebar Widgets Grid — all sidebar cards displayed at the bottom in a responsive grid */}
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
                  <span className="mr-2">📁</span>Categories
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
                      <span>{cat.icon}</span>
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
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🚀</span>
                  <h3 className="font-bold text-lg">Free API</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  No API keys required. No rate limits. Build your own crypto
                  news app.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Learn more about our free API
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/examples"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
                  >
                    <span>💻</span>
                    Code Examples
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

        {/* 16. Bottom CTA Section */}
        <section
          className="px-4 sm:px-6 lg:px-8 py-16 mt-8"
          aria-label="Developer resources"
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]" />

            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Build with Free Crypto News
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                No API keys required. No rate limits. Get real-time news from{" "}
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
                  >
                    <path d="M24 22.525H0l12-21.05 12 21.05z" />
                  </svg>
                  Deploy Your Own
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 bg-brand-500 text-black px-6 py-3.5 rounded-full font-semibold hover:bg-brand-400 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <span>📚</span>
                  API Documentation
                </Link>
                <Link
                  href="/examples"
                  className="inline-flex items-center gap-2 bg-transparent text-white border-2 border-white/30 px-6 py-3.5 rounded-full font-semibold hover:bg-white hover:text-black hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <span>💻</span>
                  Code Examples
                </Link>
              </div>

              {/* Quick features */}
              <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>No API Keys</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>No Rate Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{sourceCount}+ News Sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>MIT Licensed</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Footer />
      </div>
    </div>
  );
}
