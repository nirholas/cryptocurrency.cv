/**
 * Article Detail Page
 * Shows full article with AI summary, related articles, and market context
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReadingProgress from '@/components/ReadingProgress';
import { 
  getArticleById, 
  getRelatedArticles,
  toNewsArticle,
  type EnrichedArticle 
} from '@/lib/archive-v2';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleContent } from '@/components/ArticleContent';
import { RelatedArticles } from '@/components/RelatedArticles';
import { ArticleStructuredData, BreadcrumbStructuredData } from '@/components/StructuredData';

interface Props {
  params: Promise<{ id: string }>;
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
  
  return {
    title: article.title,
    description: article.description || `Read the full article from ${article.source}`,
    openGraph: {
      title: article.title,
      description: article.description || `Read the full article from ${article.source}`,
      type: 'article',
      publishedTime: article.pub_date || article.first_seen,
      authors: [article.source],
      tags: [...article.tickers, ...article.tags],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description || `Read the full article from ${article.source}`,
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
  
  const relatedArticles = await getRelatedArticles(article, 6);
  const sentiment = sentimentConfig[article.sentiment.label] || sentimentConfig.neutral;
  const articleUrl = `https://free-crypto-news.vercel.app/article/${id}`;
  
  // Breadcrumb data for structured data
  const breadcrumbs = [
    { name: 'Home', url: 'https://free-crypto-news.vercel.app' },
    { name: article.source, url: `https://free-crypto-news.vercel.app/source/${article.source_key}` },
    { name: article.title.slice(0, 50) + (article.title.length > 50 ? '...' : ''), url: articleUrl },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Structured Data for SEO */}
      <ArticleStructuredData article={article} url={articleUrl} />
      <BreadcrumbStructuredData items={breadcrumbs} />
      
      {/* Reading Progress Bar */}
      <ReadingProgress />
      
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
              <li className="text-gray-900 truncate max-w-xs">{article.title}</li>
            </ol>
          </nav>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Article Header */}
              <article className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`text-sm px-3 py-1 rounded-full border ${sourceColors[article.source] || 'bg-gray-100 text-gray-800'}`}>
                      {article.source}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${sentiment.color}`}>
                      {sentiment.emoji} {sentiment.label}
                    </span>
                    {article.meta.is_breaking && (
                      <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-800">
                        🔴 Breaking
                      </span>
                    )}
                    {article.meta.is_opinion && (
                      <span className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                        💭 Opinion
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                    {article.title}
                  </h1>
                  
                  {/* Description */}
                  {article.description && (
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                  
                  {/* Date and source link */}
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 border-t pt-4">
                    <time dateTime={article.pub_date || article.first_seen}>
                      📅 {formatDate(article.pub_date || article.first_seen)}
                    </time>
                    <a 
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Read original on {article.source} ↗
                    </a>
                  </div>
                </div>
              </article>
              
              {/* AI Analysis - Client Component */}
              <ArticleContent article={article} />
              
              {/* Entities & Tags */}
              <div className="bg-white rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">📋 Article Details</h2>
                
                <div className="space-y-4">
                  {/* Tickers */}
                  {article.tickers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Mentioned Tickers</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tickers.map(ticker => (
                          <Link
                            key={ticker}
                            href={`/coin/${ticker.toLowerCase()}`}
                            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition"
                          >
                            ${ticker}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Companies */}
                  {article.entities.companies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Companies</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.entities.companies.map(company => (
                          <span
                            key={company}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
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
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Protocols</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.entities.protocols.map(protocol => (
                          <span
                            key={protocol}
                            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
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
                      <h3 className="text-sm font-medium text-gray-500 mb-2">People</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.entities.people.map(person => (
                          <span
                            key={person}
                            className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
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
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map(tag => (
                          <Link
                            key={tag}
                            href={`/topic/${tag}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Market Context */}
              {article.market_context && (
                <div className="bg-white rounded-2xl border p-6">
                  <h2 className="font-bold text-lg mb-4">📊 Market Context</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Prices at time of publication
                  </p>
                  
                  <div className="space-y-3">
                    {article.market_context.btc_price && (
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">₿ Bitcoin</span>
                        <span className="font-bold">{formatPrice(article.market_context.btc_price)}</span>
                      </div>
                    )}
                    {article.market_context.eth_price && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Ξ Ethereum</span>
                        <span className="font-bold">{formatPrice(article.market_context.eth_price)}</span>
                      </div>
                    )}
                    {article.market_context.fear_greed_index !== null && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Fear & Greed</span>
                        <span className="font-bold">{article.market_context.fear_greed_index}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <RelatedArticles articles={relatedArticles} />
              )}
              
              {/* Actions */}
              <div className="bg-white rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">📤 Share</h2>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`https://free-crypto-news.vercel.app/article/${article.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-4 bg-black text-white rounded-lg text-center text-sm font-medium hover:bg-gray-800 transition"
                  >
                    𝕏 Post
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(`https://free-crypto-news.vercel.app/article/${article.id}`)}&text=${encodeURIComponent(article.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg text-center text-sm font-medium hover:bg-blue-600 transition"
                  >
                    Telegram
                  </a>
                </div>
                <button
                  className="w-full mt-3 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  data-copy-url={`https://free-crypto-news.vercel.app/article/${article.id}`}
                >
                  📋 Copy Link
                </button>
              </div>
              
              {/* Source Info */}
              <div className="bg-white rounded-2xl border p-6">
                <h2 className="font-bold text-lg mb-4">📰 Source</h2>
                <Link 
                  href={`/source/${article.source_key}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${sourceColors[article.source]?.split(' ')[0] || 'bg-gray-200'}`}>
                    {article.source.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{article.source}</div>
                    <div className="text-sm text-gray-500">View all articles →</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
