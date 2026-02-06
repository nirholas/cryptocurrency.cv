/**
 * Article Detail Page
 * Shows full article with AI summary, related articles, and market context
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import ViewTracker from '@/components/ViewTracker';
import { 
  getArticleById, 
  getRelatedArticles,
  toNewsArticle,
  generateArticleSlug,
  type EnrichedArticle 
} from '@/lib/archive-v2';
import { getLatestNews } from '@/lib/crypto-news';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleContent } from '@/components/ArticleContent';
import { RelatedArticles } from '@/components/RelatedArticles';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData';
import ArticleShareCard from '@/components/ArticleShareCard';
import { ArticleIntelligenceBadges } from '@/components/ArticleIntelligenceBadges';
import ArticleReactions from '@/components/ArticleReactions';
import BookmarkButton from '@/components/BookmarkButton';
import TrendingNews from '@/components/sidebar/TrendingNews';
import NewsletterSignup from '@/components/sidebar/NewsletterSignup';
import { SentimentMeter, TickerCard } from './components';
import { FactCheckPanel } from '@/components/FactCheckPanel';
import { BullBearDebate } from '@/components/BullBearDebate';
import { ArticleTimeline } from '@/components/ArticleTimeline';
import { SentimentContext } from '@/components/SentimentContext';

interface Props {
  params: Promise<{ id: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

// Enable on-demand ISR for articles not pre-rendered
export const dynamicParams = true;

/**
 * Skip static generation for article pages entirely.
 * All article pages are generated on-demand via ISR.
 * This avoids loading the massive archive during build and
 * prevents the build output from exceeding Vercel's size limit.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  
  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }
  
  const canonicalUrl = `${BASE_URL}/en/article/${id}`;
  
  // Generate dynamic OG image URL for viral sharing
  const pubDate = article.pub_date || article.first_seen;
  const formattedDate = pubDate ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const ogImageUrl = `${BASE_URL}/api/og?title=${encodeURIComponent(article.title)}&source=${encodeURIComponent(article.source)}&date=${encodeURIComponent(formattedDate)}`;
  
  return {
    title: article.title,
    description: article.description || `Read the full article from ${article.source}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.description || `Read the full article from ${article.source}`,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.pub_date || article.first_seen,
      modifiedTime: article.last_seen || article.pub_date || article.first_seen,
      authors: [article.source],
      tags: [...article.tickers, ...article.tags],
      section: 'Cryptocurrency',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: article.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description || `Read the full article from ${article.source}`,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

export const revalidate = 300; // 5 minutes

const sourceColors: Record<string, string> = {
  'CoinDesk': 'bg-blue-100 text-blue-800 border-blue-200',
  'The Block': 'bg-purple-100 text-purple-800 border-purple-200',
  'Decrypt': 'bg-green-100 text-green-800 border-green-200',
  'CoinTelegraph': 'bg-orange-100 text-orange-800 border-orange-200',
  'Bitcoin Magazine': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Blockworks': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'The Defiant': 'bg-pink-100 text-pink-800 border-pink-200',
};

const sentimentConfig = {
  very_positive: { emoji: '🟢', label: 'Very Bullish', color: 'bg-green-100 text-green-800' },
  positive: { emoji: '🟢', label: 'Bullish', color: 'bg-green-50 text-green-700' },
  neutral: { emoji: '⚪', label: 'Neutral', color: 'bg-gray-100 text-gray-700' },
  negative: { emoji: '🔴', label: 'Bearish', color: 'bg-red-50 text-red-700' },
  very_negative: { emoji: '🔴', label: 'Very Bearish', color: 'bg-red-100 text-red-800' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: price < 10 ? 2 : 0,
  }).format(price);
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);
  
  if (!article) {
    notFound();
  }
  
  // Fetch related articles + more from this source in parallel
  const [relatedArticles, sourceNewsData] = await Promise.all([
    getRelatedArticles(article, 6),
    getLatestNews(5, article.source_key).catch(() => ({ articles: [] })),
  ]);
  const sentiment = sentimentConfig[article.sentiment.label] || sentimentConfig.neutral;

  // "More from this source" — exclude current article
  const moreFromSource = sourceNewsData.articles
    .filter(a => a.link !== article.link)
    .slice(0, 4);

  // Reading time estimate
  const readingTime = article.meta?.word_count ? Math.max(1, Math.ceil(article.meta.word_count / 200)) : null;
  
  // Use SEO-friendly slug for URL, fallback to id if no slug
  const articleSlug = article.slug || generateArticleSlug(article.title, article.pub_date || article.first_seen);
  const articleUrl = `https://cryptocurrency.cv/article/${articleSlug}`;
  
  // Breadcrumb data for structured data
  const breadcrumbs = [
    { name: 'Home', url: 'https://cryptocurrency.cv' },
    { name: article.source, url: `https://cryptocurrency.cv/source/${article.source_key}` },
    { name: article.title.slice(0, 50) + (article.title.length > 50 ? '...' : ''), url: articleUrl },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Structured Data for SEO */}
      <ArticleStructuredData article={article} url={articleUrl} />
      <BreadcrumbStructuredData items={breadcrumbs} />
      
      {/* Reading Progress Bar */}
      <ReadingProgress />
      
      {/* View Tracking */}
      <ViewTracker articleId={article.id} articleTitle={article.title} />
      
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main id="main-content" className="px-4 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/source/${article.source_key}`} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  {article.source}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-900 dark:text-white truncate max-w-xs">{article.title}</li>
            </ol>
          </nav>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Article Header */}
              <article className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`text-sm px-3 py-1 rounded-full border ${sourceColors[article.source] || 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200'}`}>
                      {article.source}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${sentiment.color}`}>
                      {sentiment.emoji} {sentiment.label}
                    </span>
                    {article.meta.is_breaking && (
                      <span className="text-sm px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                        🔴 Breaking
                      </span>
                    )}
                    {article.meta.is_opinion && (
                      <span className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300">
                        💭 Opinion
                      </span>
                    )}
                    {readingTime && (
                      <span className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                        📖 {readingTime} min read{article.meta.word_count ? ` · ${article.meta.word_count.toLocaleString()} words` : ''}
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight text-gray-900 dark:text-white">
                    {article.title}
                  </h1>

                  {/* Intelligence Badges (clickbait, AI-written, event type) */}
                  <div className="mb-4">
                    <ArticleIntelligenceBadges
                      articleId={article.id}
                      title={article.title}
                      compact={false}
                    />
                  </div>

                  {/* Sentiment Meter */}
                  {article.sentiment && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <SentimentMeter
                        score={article.sentiment.score}
                        label={article.sentiment.label}
                        confidence={article.sentiment.confidence}
                      />
                    </div>
                  )}
                  
                  {/* Description */}
                  {article.description && (
                    <p className="text-lg text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                  
                  {/* Date, source link, and bookmark */}
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700 pt-4">
                    <div className="flex items-center gap-3">
                      <time dateTime={article.pub_date || article.first_seen}>
                        📅 {formatDate(article.pub_date || article.first_seen)}
                      </time>
                      <BookmarkButton
                        article={{
                          title: article.title,
                          link: article.link,
                          source: article.source,
                          pubDate: article.pub_date || article.first_seen,
                        }}
                        size="sm"
                      />
                    </div>
                    <a 
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Read original on {article.source} ↗
                    </a>
                  </div>
                </div>
              </article>
              
              {/* AI Analysis - Client Component */}
              <ArticleContent article={article} />
              
              {/* Entities & Tags */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">📋 Article Details</h2>
                
                <div className="space-y-4">
                  {/* Tickers with live price cards */}
                  {article.tickers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Mentioned Tickers</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tickers.map(ticker => (
                          <TickerCard key={ticker} ticker={ticker} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Companies */}
                  {article.entities.companies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Companies</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.entities.companies.map(company => (
                          <span
                            key={company}
                            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                          >
                            🏢 {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Protocols */}
                  {article.entities.protocols.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Protocols</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.entities.protocols.map(protocol => (
                          <span
                            key={protocol}
                            className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm"
                          >
                            ⚡ {protocol}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* People */}
                  {article.entities.people.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">People</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.entities.people.map(person => (
                          <span
                            key={person}
                            className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm"
                          >
                            👤 {person}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map(tag => (
                          <Link
                            key={tag}
                            href={`/topic/${tag}`}
                            className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deep Intelligence Panel */}
              <div className="space-y-6">
                {/* Fact Check */}
                <FactCheckPanel
                  articleUrl={article.link}
                  articleTitle={article.title}
                  source={article.source}
                />

                {/* Bull vs Bear Debate */}
                <BullBearDebate topic={article.title} />

                {/* Story Origins Timeline */}
                {article.tickers.length > 0 && (
                  <ArticleTimeline tickers={article.tickers} />
                )}

                {/* Sentiment Context */}
                {article.tickers.length > 0 && (
                  <SentimentContext
                    tickers={article.tickers}
                    articleSentiment={article.sentiment?.label || 'neutral'}
                  />
                )}
              </div>

              {/* Article Reactions */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">💬 What do you think?</h2>
                <ArticleReactions articleId={article.id} />
              </div>

              {/* More from This Source */}
              {moreFromSource.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    📰 More from {article.source}
                  </h2>
                  <div className="space-y-3">
                    {moreFromSource.map((a, i) => (
                      <Link
                        key={i}
                        href={`/article/${a.link ? encodeURIComponent(Buffer.from(a.link).toString('base64url').slice(0, 12)) : i}`}
                        className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition group"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 text-sm">
                          {a.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                          <span>{a.timeAgo || 'Recently'}</span>
                          {a.category && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{a.category}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/source/${article.source_key}`}
                    className="inline-block mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all from {article.source} →
                  </Link>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Market Context */}
              {article.market_context && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">📊 Market Context</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                    Prices at time of publication
                  </p>
                  
                  <div className="space-y-3">
                    {article.market_context.btc_price && (
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">₿ Bitcoin</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(article.market_context.btc_price)}</span>
                      </div>
                    )}
                    {article.market_context.eth_price && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">Ξ Ethereum</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(article.market_context.eth_price)}</span>
                      </div>
                    )}
                    {article.market_context.sol_price && (
                      <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">◎ Solana</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(article.market_context.sol_price)}</span>
                      </div>
                    )}
                    {article.market_context.total_market_cap && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">📈 Total Market Cap</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          ${(article.market_context.total_market_cap / 1e12).toFixed(2)}T
                        </span>
                      </div>
                    )}
                    {article.market_context.btc_dominance && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">👑 BTC Dominance</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {article.market_context.btc_dominance.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {article.market_context.fear_greed_index != null && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">😱 Fear & Greed</span>
                        <span className="font-bold text-gray-900 dark:text-white">{article.market_context.fear_greed_index}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <RelatedArticles articles={relatedArticles} />
              )}
              
              {/* Share */}
              <ArticleShareCard title={article.title} url={articleUrl} />
              
              {/* Source Info */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">📰 Source</h2>
                <Link 
                  href={`/source/${article.source_key}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${sourceColors[article.source]?.split(' ')[0] || 'bg-gray-200 dark:bg-slate-600'}`}>
                    {article.source.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{article.source}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">View all articles →</div>
                  </div>
                </Link>
              </div>

              {/* Trending News */}
              {relatedArticles.length > 0 && (
                <TrendingNews
                  articles={relatedArticles.slice(0, 5).map(a => ({
                    title: a.title,
                    link: a.link,
                    source: a.source,
                    pubDate: a.pub_date || a.first_seen,
                    timeAgo: '',
                  }))}
                  title="Trending Now"
                />
              )}

              {/* Newsletter Signup */}
              <NewsletterSignup />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
