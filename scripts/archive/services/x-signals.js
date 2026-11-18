#!/usr/bin/env node

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * X/Twitter Social Signals Tracker
 * 
 * Uses XActions (https://github.com/nirholas/XActions) for X/Twitter scraping
 * without requiring the expensive official API ($100+/month).
 * 
 * Features:
 * - Search crypto-related tweets
 * - Track trending topics and hashtags
 * - Sentiment analysis on crypto discussions
 * - Influencer activity monitoring
 * 
 * SETUP:
 * 1. npm install xactions
 * 2. Run: xactions login (to set up session cookie)
 * 3. Set X_AUTH_TOKEN env var with your auth_token cookie
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// Check if XActions is available
let xactions = null;
let xactionsAvailable = false;

try {
  xactions = require('xactions');
  xactionsAvailable = true;
} catch (e) {
  // XActions not installed - will use fallback
}

// X session cookie (get from browser after login)
const X_AUTH_TOKEN = process.env.X_AUTH_TOKEN;
const X_ENABLED = xactionsAvailable && !!X_AUTH_TOKEN;

// Crypto accounts to monitor
const CRYPTO_INFLUENCERS = [
  'CryptoHayes',      // Arthur Hayes
  'VitalikButerin',   // Vitalik
  'caboronell',       // Crypto analyst
  'trader1sz',        // Trader
  'inversebrah',      // Crypto humor/sentiment
  'lookonchain',      // On-chain analytics
  'WuBlockchain',     // Wu Blockchain
  'whale_alert',      // Whale Alert
];

// Search queries for crypto sentiment
const CRYPTO_SEARCH_QUERIES = [
  'bitcoin',
  'ethereum',
  '$BTC',
  '$ETH',
  'crypto',
  '#bitcoin',
  '#ethereum',
  'defi',
];

// Rate limiting
const RATE_LIMIT_MS = 3000; // 3 seconds between requests

// =============================================================================
// UTILITIES
// =============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract tickers/coins mentioned in text
 */
function extractTickers(text) {
  if (!text) return [];
  
  const tickerPattern = /\$([A-Z]{2,10})\b/g;
  const matches = text.match(tickerPattern) || [];
  return [...new Set(matches.map(m => m.replace('$', '')))];
}

/**
 * Simple sentiment analysis for crypto content
 */
function analyzeSentiment(text) {
  if (!text) return 'neutral';
  
  const lower = text.toLowerCase();
  
  const bullishWords = [
    'moon', 'bullish', 'pump', 'buy', 'long', 'rocket', '🚀', 
    'ath', 'gains', 'profit', 'green', 'breakout', 'surge',
    'accumulate', 'hodl', 'wagmi', 'gm', 'send it', 'lfg',
    'undervalued', 'gem', '100x', 'alpha'
  ];
  
  const bearishWords = [
    'crash', 'bearish', 'dump', 'sell', 'short', 'rekt', 
    'scam', 'rug', 'loss', 'red', 'down', 'fear', 'dead',
    'ngmi', 'panic', 'liquidated', 'ponzi', 'bubble'
  ];
  
  let bullScore = 0;
  let bearScore = 0;
  
  bullishWords.forEach(word => {
    if (lower.includes(word)) bullScore++;
  });
  
  bearishWords.forEach(word => {
    if (lower.includes(word)) bearScore++;
  });
  
  if (bullScore > bearScore + 1) return 'bullish';
  if (bearScore > bullScore + 1) return 'bearish';
  return 'neutral';
}

// =============================================================================
// X SERVICE (Using XActions)
// =============================================================================

const XService = {
  browser: null,
  page: null,

  /**
   * Initialize browser and login
   */
  async init() {
    if (!X_ENABLED) {
      console.log('⚠️  X/Twitter disabled (install xactions and set X_AUTH_TOKEN)');
      return false;
    }

    try {
      const { createBrowser, createPage } = xactions;
      
      this.browser = await createBrowser({ headless: true });
      this.page = await createPage(this.browser, X_AUTH_TOKEN);
      
      console.log('✅ X/Twitter browser initialized');
      return true;
    } catch (error) {
      console.error('Failed to init X browser:', error.message);
      return false;
    }
  },

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  },

  /**
   * Search tweets by query
   */
  async searchTweets(query, limit = 20) {
    if (!this.page) return [];

    try {
      const { searchTweets } = xactions;
      const tweets = await searchTweets(this.page, query, { 
        limit, 
        filter: 'latest' 
      });

      return tweets.map(t => ({
        id: t.id,
        text: t.text,
        author: t.author,
        timestamp: t.timestamp,
        likes: t.likes || 0,
        retweets: t.retweets || 0,
        replies: t.replies || 0,
        views: t.views || 0,
        tickers_mentioned: extractTickers(t.text),
        sentiment: analyzeSentiment(t.text),
        url: t.url
      }));
    } catch (error) {
      console.error(`X search failed for "${query}":`, error.message);
      return [];
    }
  },

  /**
   * Get tweets from a specific user
   */
  async getUserTweets(username, limit = 10) {
    if (!this.page) return [];

    try {
      const { scrapeTweets } = xactions;
      const tweets = await scrapeTweets(this.page, username, { limit });

      return tweets.map(t => ({
        id: t.id,
        text: t.text,
        author: username,
        timestamp: t.timestamp,
        likes: t.likes || 0,
        retweets: t.retweets || 0,
        views: t.views || 0,
        tickers_mentioned: extractTickers(t.text),
        sentiment: analyzeSentiment(t.text)
      }));
    } catch (error) {
      console.error(`X user tweets failed for @${username}:`, error.message);
      return [];
    }
  },

  /**
   * Get user profile info
   */
  async getProfile(username) {
    if (!this.page) return null;

    try {
      const { scrapeProfile } = xactions;
      const profile = await scrapeProfile(this.page, username);

      return {
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        verified: profile.verified,
        location: profile.location
      };
    } catch (error) {
      console.error(`X profile failed for @${username}:`, error.message);
      return null;
    }
  }
};

// =============================================================================
// SOCIAL SERVICE (Main Interface)
// =============================================================================

const SocialService = {
  /**
   * Get complete X/Twitter social snapshot for crypto
   */
  async getSocialSnapshot() {
    console.log('📲 Fetching social signals...');
    const startTime = Date.now();

    const results = {
      timestamp: new Date().toISOString(),
      platform: 'x',
      enabled: X_ENABLED,
      search_results: {},
      influencer_activity: [],
      trending_tickers: {},
      sentiment_summary: { bullish: 0, bearish: 0, neutral: 0 },
      top_tweets: [],
      total_tweets_analyzed: 0
    };

    if (!X_ENABLED) {
      console.log('⚠️  X/Twitter API disabled');
      console.log('   To enable:');
      console.log('   1. npm install xactions');
      console.log('   2. Run: xactions login');
      console.log('   3. Set X_AUTH_TOKEN env var');
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Social snapshot complete in ${elapsed}s (disabled)`);
      return results;
    }

    // Initialize browser
    const initialized = await XService.init();
    if (!initialized) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Social snapshot complete in ${elapsed}s (init failed)`);
      return results;
    }

    try {
      // Search for crypto topics
      console.log('🔍 Searching crypto topics...');
      for (const query of CRYPTO_SEARCH_QUERIES.slice(0, 4)) {
        await sleep(RATE_LIMIT_MS);
        const tweets = await XService.searchTweets(query, 15);
        
        results.search_results[query] = {
          count: tweets.length,
          avg_likes: tweets.reduce((s, t) => s + t.likes, 0) / (tweets.length || 1),
          avg_retweets: tweets.reduce((s, t) => s + t.retweets, 0) / (tweets.length || 1)
        };

        // Aggregate data
        tweets.forEach(t => {
          results.sentiment_summary[t.sentiment]++;
          results.total_tweets_analyzed++;
          
          t.tickers_mentioned.forEach(ticker => {
            results.trending_tickers[ticker] = (results.trending_tickers[ticker] || 0) + 1;
          });

          // Track high-engagement tweets
          if (t.likes > 100 || t.retweets > 20) {
            results.top_tweets.push(t);
          }
        });
      }

      // Check influencer activity
      console.log('👥 Checking influencer activity...');
      for (const influencer of CRYPTO_INFLUENCERS.slice(0, 3)) {
        await sleep(RATE_LIMIT_MS);
        const tweets = await XService.getUserTweets(influencer, 5);
        
        if (tweets.length > 0) {
          const recentTweet = tweets[0];
          results.influencer_activity.push({
            username: influencer,
            latest_tweet: {
              text: recentTweet.text?.slice(0, 200),
              timestamp: recentTweet.timestamp,
              likes: recentTweet.likes,
              sentiment: recentTweet.sentiment
            },
            tickers_mentioned: recentTweet.tickers_mentioned
          });
        }
      }

      // Calculate overall sentiment
      const total = Object.values(results.sentiment_summary).reduce((a, b) => a + b, 0);
      if (total > 0) {
        results.overall_sentiment = {
          bullish_pct: (results.sentiment_summary.bullish / total * 100).toFixed(1),
          bearish_pct: (results.sentiment_summary.bearish / total * 100).toFixed(1),
          neutral_pct: (results.sentiment_summary.neutral / total * 100).toFixed(1)
        };
      }

      // Sort trending tickers
      results.trending_tickers = Object.fromEntries(
        Object.entries(results.trending_tickers)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
      );

      // Sort and limit top tweets
      results.top_tweets = results.top_tweets
        .sort((a, b) => (b.likes + b.retweets * 2) - (a.likes + a.retweets * 2))
        .slice(0, 20);

    } finally {
      await XService.close();
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Social snapshot complete in ${elapsed}s`);
    console.log(`   Tweets analyzed: ${results.total_tweets_analyzed}`);

    return results;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  SocialService,
  XService,
  X_ENABLED
};

// =============================================================================
// CLI TEST
// =============================================================================

if (require.main === module) {
  (async () => {
    console.log('🐦 X/Twitter Social Signals Test\n');
    console.log(`XActions installed: ${xactionsAvailable}`);
    console.log(`X_AUTH_TOKEN set: ${!!X_AUTH_TOKEN}`);
    console.log(`X enabled: ${X_ENABLED}\n`);
    
    const snapshot = await SocialService.getSocialSnapshot();
    console.log('\n📊 Snapshot:');
    console.log(JSON.stringify(snapshot, null, 2));
  })();
}
