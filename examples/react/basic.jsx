/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Basic React Example
 * 
 * Simple usage of Free Crypto News React components and hooks.
 */

import React from 'react';
import { 
  CryptoNews, 
  useCryptoNews, 
  useTrendingTopics,
  CryptoNewsTicker 
} from '@nirholas/react-crypto-news';

// ═══════════════════════════════════════════════════════════════
// Basic Component Usage
// ═══════════════════════════════════════════════════════════════

/**
 * Simple drop-in component - just works!
 */
export function SimpleNews() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Latest Crypto News</h1>
      <CryptoNews limit={10} showSource showTime />
    </div>
  );
}

/**
 * Cards layout
 */
export function NewsCards() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">News Cards</h1>
      <CryptoNews 
        variant="cards" 
        limit={6} 
        showSource 
        showDescription 
      />
    </div>
  );
}

/**
 * Compact list
 */
export function CompactNewsList() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Headlines</h1>
      <CryptoNews 
        variant="compact" 
        limit={15} 
        showTime 
      />
    </div>
  );
}

/**
 * Breaking news ticker
 */
export function NewsTicker() {
  return (
    <div className="bg-red-600 text-white">
      <CryptoNewsTicker 
        endpoint="breaking" 
        speed={50} 
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Hook Usage for Custom UI
// ═══════════════════════════════════════════════════════════════

/**
 * Using the hook for full control
 */
export function CustomNewsFeed() {
  const { articles, loading, error, refresh, lastUpdated } = useCryptoNews({
    limit: 10,
    refreshInterval: 60000, // Refresh every minute
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error.message}
        <button 
          onClick={refresh}
          className="ml-4 px-3 py-1 bg-red-100 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Latest News</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {lastUpdated && (
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button 
            onClick={refresh}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="divide-y">
        {articles.map((article, i) => (
          <a
            key={i}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {article.source}
              </span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{article.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{article.timeAgo}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Trending topics with hook
 */
export function TrendingTopics() {
  const { topics, loading, error } = useTrendingTopics({
    limit: 10,
    hours: 24,
  });

  if (loading) return <div>Loading trending...</div>;
  if (error) return <div>Error loading trending</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🔥 Trending</h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <span 
            key={i}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              topic.sentiment === 'bullish' ? 'bg-green-100 text-green-800' :
              topic.sentiment === 'bearish' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {topic.topic} ({topic.count})
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Themed Components
// ═══════════════════════════════════════════════════════════════

/**
 * Dark theme
 */
export function DarkThemeNews() {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <CryptoNews 
        theme="dark"
        limit={5} 
        variant="list"
        showSource
        showTime
      />
    </div>
  );
}

/**
 * Light theme with custom styles
 */
export function CustomStyledNews() {
  return (
    <CryptoNews 
      theme="light"
      limit={5}
      style={{
        fontFamily: 'Inter, sans-serif',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
      className="custom-news-feed"
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// Filtered News
// ═══════════════════════════════════════════════════════════════

/**
 * Bitcoin-specific news
 */
export function BitcoinNews() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">₿ Bitcoin News</h2>
      <CryptoNews 
        endpoint="bitcoin"
        limit={10}
        showSource
        showTime
      />
    </div>
  );
}

/**
 * DeFi news
 */
export function DeFiNews() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🌾 DeFi News</h2>
      <CryptoNews 
        endpoint="defi"
        limit={10}
        showSource
        showDescription
      />
    </div>
  );
}

/**
 * Breaking news
 */
export function BreakingNews() {
  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <h2 className="text-xl font-bold mb-4 text-red-600">🚨 Breaking</h2>
      <CryptoNews 
        endpoint="breaking"
        limit={5}
        showSource
        showTime
        refreshInterval={30000}
      />
    </div>
  );
}

/**
 * Filter by source
 */
export function SourceFilteredNews() {
  const [source, setSource] = React.useState('');
  
  const sources = [
    { value: '', label: 'All Sources' },
    { value: 'coindesk', label: 'CoinDesk' },
    { value: 'theblock', label: 'The Block' },
    { value: 'cointelegraph', label: 'Cointelegraph' },
    { value: 'decrypt', label: 'Decrypt' },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-bold">News by Source</h2>
        <select 
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {sources.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <CryptoNews 
        source={source || undefined}
        limit={10}
        showTime
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Full App Example
// ═══════════════════════════════════════════════════════════════

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breaking Ticker */}
      <NewsTicker />
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">
          📰 Free Crypto News - React Examples
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main News Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <CustomNewsFeed />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending */}
            <div className="bg-white rounded-lg shadow">
              <TrendingTopics />
            </div>
            
            {/* Breaking */}
            <BreakingNews />
          </div>
        </div>
        
        {/* Category Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <BitcoinNews />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <DeFiNews />
          </div>
        </div>
        
        {/* Dark Theme Example */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Dark Theme</h2>
          <DarkThemeNews />
        </div>
      </div>
    </div>
  );
}
