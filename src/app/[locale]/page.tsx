/**
 * Free Crypto News - Professional Homepage
 * Inspired by CoinDesk, The Block, and Google News layouts
 */

import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PriceTicker from '@/components/PriceTicker';
import BreakingNewsBanner from '@/components/BreakingNewsBanner';
import HeroArticle from '@/components/HeroArticle';
import FeaturedStoryTabs from '@/components/FeaturedStoryTabs';
import HomeMarketStrip from '@/components/HomeMarketStrip';
import NewsCard from '@/components/NewsCard';
import NewsCluster from '@/components/NewsCluster';
import LatestNewsFeed from '@/components/LatestNewsFeed';
import MostRead from '@/components/MostRead';
import TrendingSidebar from '@/components/TrendingSidebar';
import SourceSections from '@/components/SourceSections';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import { WebsiteStructuredData, OrganizationStructuredData, NewsListStructuredData } from '@/components/StructuredData';
import WhaleAlerts from '@/components/WhaleAlerts';
import { LiquidationsFeed } from '@/components/LiquidationsFeed';
import { MarketSignals } from '@/components/MarketSignals';
import { TrendingNarratives } from '@/components/TrendingNarratives';
import { WhaleActivityFeed } from '@/components/WhaleActivityFeed';
import { LiveNewsTicker } from '@/components/LiveNewsTicker';
import { AskAboutThis } from '@/components/AskAboutThis';
import { AIFlashBrief } from '@/components/AIFlashBrief';
import { TrendingTopicsLive } from '@/components/TrendingTopicsLive';
import { getHomepageNews, getSourceCount } from '@/lib/crypto-news';
import { clusterSimilarArticles } from '@/lib/ai-intelligence';
import { categories } from '@/lib/categories';
import { Link } from '@/i18n/navigation';

export const revalidate = 120; // Revalidate every 2 minutes

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const tNews = await getTranslations('news');

  const { latest: newsData, breaking: breakingData, trending: trendingData } = await getHomepageNews({
    latestLimit: 50,
    breakingLimit: 5,
    trendingLimit: 10,
  });

  // Get dynamic source count
  const sourceCount = getSourceCount();

  // Use trending articles for hero and featured sections
  const heroArticle = trendingData.articles[0]; // Top trending article as hero
  const heroSidebarArticles = trendingData.articles.slice(1, 7); // Articles 2-7 for hero sidebar list
  const featuredArticles = newsData.articles.slice(0, 20); // CoinDesk-style tabbed featured stories
  
  // Cluster similar articles for Google News-style multi-source view
  const newsClusters = clusterSimilarArticles(newsData.articles.slice(0, 30));
  
  // Deduplicate: exclude trending articles from latest news to avoid showing same content
  const trendingLinks = new Set(trendingData.articles.map(a => a.link));
  const latestNews = newsData.articles
    .filter(article => !trendingLinks.has(article.link))
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
        articles={newsData.articles.slice(0, 20)}
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

        {/* Hero Section - CoinDesk-style split layout */}
        {heroArticle && (
          <section className="px-4 sm:px-6 lg:px-8 mb-8">
            <HeroArticle article={heroArticle} sidebarArticles={heroSidebarArticles} />
          </section>
        )}

        {/* Market Overview - CoinDesk-style ranked table (moved higher) */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8">
          <HomeMarketStrip />
        </section>

        {/* AI Flash Briefing */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Flash briefing">
          <AIFlashBrief />
        </section>

        {/* Market Intelligence Signals */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Market signals">
          <MarketSignals />
        </section>

        {/* Categories Navigation with scroll indicators */}
        <nav 
          className="px-4 sm:px-6 lg:px-8 mb-8"
          aria-label="News categories"
        >
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
                  <span className="text-gray-700 dark:text-slate-300 font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </ScrollIndicator>
        </nav>

        {/* Trending Topics - Live */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Trending topics">
          <TrendingTopicsLive />
        </section>

        {/* CoinDesk-style Featured Stories with Topic Tabs */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Featured Stories">
          <FeaturedStoryTabs articles={featuredArticles} maxArticles={6} />
        </section>

        {/* Google News-style Multi-Source Clusters */}
        {newsClusters.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Story clusters">
            <NewsCluster clusters={newsClusters} maxClusters={4} />
          </section>
        )}

        {/* Trending Narratives */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Trending narratives">
          <TrendingNarratives />
        </section>

        {/* Main Content: CoinDesk-style 3-column layout */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[320px_1fr_380px] gap-8 xl:gap-10">
            
            {/* Left Column: CoinDesk-style Latest News Timeline */}
            <div className="hidden lg:block">
              <LatestNewsFeed articles={timelineFeedArticles} maxArticles={15} />
            </div>

            {/* Center Column: Latest News Cards */}
            <section aria-labelledby="latest-heading">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-brand-500 rounded-full" />
                  <h2 id="latest-heading" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {t('latestNews')}
                  </h2>
                </div>
                <Link 
                  href="/read" 
                  className="text-sm font-semibold text-brand-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  {tCommon('viewAll')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* News Grid - 2 columns in the center column */}
              <div className="grid sm:grid-cols-2 gap-6">
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
                  {tCommon('showMore')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </div>
            </section>

            {/* Right Column: Sidebar */}
            <TrendingSidebar trendingArticles={trendingArticles} />
          </div>
        </div>

        {/* Most Read - CoinDesk-inspired numbered section */}
        <section className="px-4 sm:px-6 lg:px-8 mt-12 mb-8" aria-label="Most read articles">
          <MostRead articles={trendingData.articles} maxArticles={7} />
        </section>

        {/* Whale Activity Feed - Enhanced */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Whale activity">
          <WhaleActivityFeed />
        </section>

        {/* Real-Time Activity: Whale Alerts + Liquidations */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8" aria-label="Real-time market activity">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-brand-500 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Live Market Activity</h2>
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

        {/* Source Sections */}
        <section className="px-4 sm:px-6 lg:px-8 mt-12" aria-label="News by source">
          <SourceSections 
            articles={sourceArticles} 
            maxSources={3}
            articlesPerSource={4}
          />
        </section>

        {/* Bottom CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 mt-8" aria-label="Developer resources">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]" />
            
            <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Build with Free Crypto News
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                No API keys required. No rate limits. Get real-time news from {sourceCount}+ crypto sources.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-full font-semibold hover:bg-gray-100 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
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
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No API Keys</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No Rate Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{sourceCount}+ News Sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
