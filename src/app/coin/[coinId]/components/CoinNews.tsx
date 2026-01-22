/**
 * CoinNews Component - Related news section for coin page
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  excerpt?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  categories?: string[];
}

interface CoinNewsProps {
  articles: Article[];
  coinName: string;
  coinSymbol: string;
}

const ITEMS_PER_PAGE = 9;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getSentimentColor(sentiment?: string): string {
  switch (sentiment) {
    case 'bullish':
      return 'bg-green-500/20 text-green-400';
    case 'bearish':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

function ArticleCard({ article }: { article: Article }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-gray-900/50 rounded-xl border border-gray-700/30 overflow-hidden hover:border-gray-600/50 transition-all"
    >
      {/* Image */}
      <Link href={article.url} target="_blank" rel="noopener noreferrer">
        <div className="relative aspect-[16/9] bg-gray-800 overflow-hidden">
          {article.imageUrl && !imgError ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}
          
          {/* Sentiment badge */}
          {article.sentiment && (
            <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full ${getSentimentColor(article.sentiment)}`}>
              {article.sentiment}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Source and date */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-amber-400 font-medium">
            {article.source}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <Link href={article.url} target="_blank" rel="noopener noreferrer">
          <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-amber-400 transition-colors mb-2">
            {article.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xs text-gray-400 line-clamp-2">
            {article.excerpt}
          </p>
        )}

        {/* Categories */}
        {article.categories && article.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default function CoinNews({ articles, coinName, coinSymbol }: CoinNewsProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');

  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter((a) => a.sentiment === filter);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  if (articles.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-8 text-center">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <h3 className="text-lg font-medium text-white mb-2">No News Found</h3>
        <p className="text-gray-400 text-sm">
          We couldn't find any recent news about {coinName}. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            📰 {coinName} News
          </h3>
          <p className="text-sm text-gray-400">
            Latest news and updates about {coinSymbol.toUpperCase()}
          </p>
        </div>

        {/* Sentiment Filter */}
        <div className="flex bg-gray-800 rounded-lg p-0.5">
          {(['all', 'bullish', 'bearish'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? f === 'bullish'
                    ? 'bg-green-500/20 text-green-400'
                    : f === 'bearish'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleArticles.map((article, index) => (
          <ArticleCard key={article.id || index} article={article} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Load More ({filteredArticles.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Empty filter state */}
      {filteredArticles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No {filter} news found. Try changing the filter.
          </p>
        </div>
      )}
    </div>
  );
}
