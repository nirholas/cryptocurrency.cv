/**
 * News API Examples - JavaScript/Node.js
 * Free Crypto News API - https://github.com/nirholas/free-crypto-news
 * 
 * Examples for all news-related endpoints.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// GET /api/news - Main News Feed
// =============================================================================

/**
 * Fetch aggregated news from all sources.
 * @param {Object} options - Query options
 * @param {number} [options.limit=20] - Number of articles (max: 100)
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.source] - Filter by source
 * @returns {Promise<Object>} News articles
 */
async function getNews({ limit = 20, category, source } = {}) {
  const params = new URLSearchParams({ limit });
  if (category) params.append('category', category);
  if (source) params.append('source', source);
  
  const response = await fetch(`${BASE_URL}/api/news?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/news/international - International News
// =============================================================================

/**
 * Fetch news from 75 international sources in 18 languages.
 * @param {Object} options - Query options
 * @param {string} [options.lang] - Language code (ko, zh, ja, es, de, fr, etc.)
 * @param {boolean} [options.translate=true] - Auto-translate to English
 * @returns {Promise<Object>} International news articles
 */
async function getInternationalNews({ lang, translate = true } = {}) {
  const params = new URLSearchParams({ translate });
  if (lang) params.append('lang', lang);
  
  const response = await fetch(`${BASE_URL}/api/news/international?${params}`);
  return response.json();
}

// =============================================================================
// POST /api/news/extract - Extract Article Content
// =============================================================================

/**
 * Extract full article content from any URL.
 * @param {string} url - Article URL to extract content from
 * @returns {Promise<Object>} Extracted article
 */
async function extractArticle(url) {
  const response = await fetch(`${BASE_URL}/api/news/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return response.json();
}

// =============================================================================
// GET /api/news/categories - Available Categories
// =============================================================================

/**
 * Get all available news categories with article counts.
 * @returns {Promise<Object>} Categories list
 */
async function getCategories() {
  const response = await fetch(`${BASE_URL}/api/news/categories`);
  return response.json();
}

// =============================================================================
// GET /api/bitcoin - Bitcoin-specific News
// =============================================================================

/**
 * Get Bitcoin-specific news and analysis.
 * @param {number} [limit=20] - Number of articles
 * @returns {Promise<Object>} Bitcoin news
 */
async function getBitcoinNews(limit = 20) {
  const response = await fetch(`${BASE_URL}/api/bitcoin?limit=${limit}`);
  return response.json();
}

// =============================================================================
// GET /api/defi - DeFi News
// =============================================================================

/**
 * Get DeFi protocol news and updates.
 * @param {number} [limit=20] - Number of articles
 * @returns {Promise<Object>} DeFi news
 */
async function getDefiNews(limit = 20) {
  const response = await fetch(`${BASE_URL}/api/defi?limit=${limit}`);
  return response.json();
}

// =============================================================================
// GET /api/breaking - Breaking News
// =============================================================================

/**
 * Get breaking/urgent news from the last hour.
 * @returns {Promise<Object>} Breaking news
 */
async function getBreakingNews() {
  const response = await fetch(`${BASE_URL}/api/breaking`);
  return response.json();
}

// =============================================================================
// GET /api/search - Search News
// =============================================================================

/**
 * Full-text search across all news articles.
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} [options.limit=20] - Number of results
 * @param {string} [options.from] - Start date (YYYY-MM-DD)
 * @param {string} [options.to] - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Search results
 */
async function searchNews(query, { limit = 20, from, to } = {}) {
  const params = new URLSearchParams({ q: query, limit });
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  
  const response = await fetch(`${BASE_URL}/api/search?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/trending - Trending Topics
// =============================================================================

/**
 * Get trending topics and keywords.
 * @param {number} [limit=10] - Number of trending items
 * @returns {Promise<Object>} Trending topics
 */
async function getTrending(limit = 10) {
  const response = await fetch(`${BASE_URL}/api/trending?limit=${limit}`);
  return response.json();
}

// =============================================================================
// GET /api/sources - Available Sources
// =============================================================================

/**
 * Get all available news sources with metadata.
 * @returns {Promise<Object>} Sources list
 */
async function getSources() {
  const response = await fetch(`${BASE_URL}/api/sources`);
  return response.json();
}

// =============================================================================
// GET /api/digest - AI Daily Digest
// =============================================================================

/**
 * Get AI-generated daily news digest.
 * @param {string} [date] - Date for digest (YYYY-MM-DD)
 * @returns {Promise<Object>} Daily digest
 */
async function getDigest(date) {
  const params = date ? `?date=${date}` : '';
  const response = await fetch(`${BASE_URL}/api/digest${params}`);
  return response.json();
}

// =============================================================================
// GET /api/tags - Browse by Tags
// =============================================================================

/**
 * Get all available tags/topics.
 * @returns {Promise<Object>} Tags list
 */
async function getTags() {
  const response = await fetch(`${BASE_URL}/api/tags`);
  return response.json();
}

/**
 * Get articles for a specific tag.
 * @param {string} slug - Tag slug
 * @param {number} [limit=20] - Number of articles
 * @returns {Promise<Object>} Tagged articles
 */
async function getTagArticles(slug, limit = 20) {
  const response = await fetch(`${BASE_URL}/api/tags/${slug}?limit=${limit}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getNews,
  getInternationalNews,
  extractArticle,
  getCategories,
  getBitcoinNews,
  getDefiNews,
  getBreakingNews,
  searchNews,
  getTrending,
  getSources,
  getDigest,
  getTags,
  getTagArticles,
  BASE_URL
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('FREE CRYPTO NEWS API - JAVASCRIPT EXAMPLES');
  console.log('='.repeat(60));

  // 1. Basic News
  console.log('\n📰 1. Latest News (5 articles)');
  const news = await getNews({ limit: 5 });
  const articles = news.articles || news;
  articles.slice(0, 5).forEach((article, i) => {
    console.log(`   ${i + 1}. ${article.title?.substring(0, 60)}...`);
  });

  // 2. Category Filter
  console.log('\n₿ 2. Bitcoin News');
  const btcNews = await getBitcoinNews(3);
  (btcNews.articles || btcNews).slice(0, 3).forEach(article => {
    console.log(`   - ${article.title?.substring(0, 60)}...`);
  });

  // 3. Search
  console.log('\n🔍 3. Search "Ethereum ETF"');
  const searchResults = await searchNews('Ethereum ETF', { limit: 3 });
  (searchResults.articles || searchResults).slice(0, 3).forEach(article => {
    console.log(`   - ${article.title?.substring(0, 60)}...`);
  });

  // 4. Trending
  console.log('\n🔥 4. Trending Topics');
  const trending = await getTrending(5);
  (trending.topics || trending).slice(0, 5).forEach(topic => {
    const keyword = typeof topic === 'object' ? topic.keyword : topic;
    console.log(`   - ${keyword}`);
  });

  // 5. International
  console.log('\n🌏 5. Korean News (translated)');
  const intlNews = await getInternationalNews({ lang: 'ko' });
  (intlNews.articles || intlNews).slice(0, 3).forEach(article => {
    console.log(`   - ${article.title?.substring(0, 60)}...`);
  });

  // 6. Breaking
  console.log('\n⚡ 6. Breaking News');
  const breaking = await getBreakingNews();
  (breaking.articles || breaking).slice(0, 3).forEach(article => {
    console.log(`   - ${article.title?.substring(0, 60)}...`);
  });

  // 7. Sources
  console.log('\n📡 7. Available Sources');
  const sources = await getSources();
  console.log(`   Total sources: ${Array.isArray(sources) ? sources.length : 'See response'}`);

  console.log('\n' + '='.repeat(60));
  console.log('All examples completed!');
  console.log('='.repeat(60));
}

// Run examples if executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
