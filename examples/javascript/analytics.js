/**
 * Free Crypto News API - Analytics Examples
 * https://github.com/nirholas/free-crypto-news
 * 
 * News analytics, trends, sentiment tracking, and reporting.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// OVERVIEW & TRENDS
// =============================================================================

/**
 * Get analytics overview
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Analytics overview
 */
async function getAnalyticsOverview(options = {}) {
  const params = new URLSearchParams({
    period: options.period || '24h',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/overview?${params}`);
  return response.json();
}

/**
 * Get trend analysis
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Trends data
 */
async function getTrends(options = {}) {
  const params = new URLSearchParams({
    period: options.period || '7d',
    category: options.category || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/trends?${params}`);
  return response.json();
}

/**
 * Get news coverage analysis
 * @param {string} topic - Topic to analyze
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Coverage data
 */
async function getCoverageAnalysis(topic, options = {}) {
  const params = new URLSearchParams({
    topic,
    period: options.period || '30d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/coverage?${params}`);
  return response.json();
}

// =============================================================================
// SENTIMENT ANALYTICS
// =============================================================================

/**
 * Get sentiment trends over time
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Sentiment trends
 */
async function getSentimentTrends(options = {}) {
  const params = new URLSearchParams({
    asset: options.asset || 'BTC',
    period: options.period || '30d',
    interval: options.interval || '1d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/sentiment?${params}`);
  return response.json();
}

/**
 * Get source-level analytics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Source analytics
 */
async function getSourceAnalytics(options = {}) {
  const params = new URLSearchParams({
    period: options.period || '30d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/sources?${params}`);
  return response.json();
}

// =============================================================================
// VOLUME & VELOCITY
// =============================================================================

/**
 * Get news volume analytics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Volume data
 */
async function getNewsVolume(options = {}) {
  const params = new URLSearchParams({
    period: options.period || '7d',
    interval: options.interval || '1h',
    category: options.category || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/volume?${params}`);
  return response.json();
}

/**
 * Get news velocity (rate of publishing)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Velocity data
 */
async function getVelocity(options = {}) {
  const params = new URLSearchParams({
    topic: options.topic || '',
    period: options.period || '24h',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/velocity?${params}`);
  return response.json();
}

// =============================================================================
// CREDIBILITY & IMPACT
// =============================================================================

/**
 * Get source credibility scores
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Credibility data
 */
async function getCredibility(options = {}) {
  const params = new URLSearchParams({
    source: options.source || '',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/credibility?${params}`);
  return response.json();
}

/**
 * Get news impact analysis
 * @param {string} articleId - Article ID
 * @returns {Promise<Object>} Impact data
 */
async function getImpact(articleId) {
  const response = await fetch(`${BASE_URL}/api/analytics/impact?id=${articleId}`);
  return response.json();
}

// =============================================================================
// CORRELATIONS & HEATMAPS
// =============================================================================

/**
 * Get news-price correlations
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Correlation data
 */
async function getCorrelations(options = {}) {
  const params = new URLSearchParams({
    asset: options.asset || 'BTC',
    period: options.period || '30d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/correlations?${params}`);
  return response.json();
}

/**
 * Get analytics heatmap
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Heatmap data
 */
async function getHeatmap(options = {}) {
  const params = new URLSearchParams({
    metric: options.metric || 'sentiment',
    period: options.period || '7d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/heatmap?${params}`);
  return response.json();
}

// =============================================================================
// STATISTICS & REPORTS
// =============================================================================

/**
 * Get aggregated statistics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Statistics
 */
async function getStatistics(options = {}) {
  const params = new URLSearchParams({
    period: options.period || '30d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/statistics?${params}`);
  return response.json();
}

/**
 * Get available reports
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Reports list
 */
async function getReports(options = {}) {
  const params = new URLSearchParams({
    type: options.type || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/reports?${params}`);
  return response.json();
}

/**
 * Get specific report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Report data
 */
async function getReport(reportId) {
  const response = await fetch(`${BASE_URL}/api/analytics/report?id=${reportId}`);
  return response.json();
}

// =============================================================================
// TIMELINE
// =============================================================================

/**
 * Get news timeline for topic
 * @param {string} topic - Topic to analyze
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Timeline data
 */
async function getTimeline(topic, options = {}) {
  const params = new URLSearchParams({
    topic,
    period: options.period || '30d',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/analytics/timeline?${params}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Overview
  getAnalyticsOverview,
  getTrends,
  getCoverageAnalysis,
  
  // Sentiment
  getSentimentTrends,
  getSourceAnalytics,
  
  // Volume
  getNewsVolume,
  getVelocity,
  
  // Credibility
  getCredibility,
  getImpact,
  
  // Correlations
  getCorrelations,
  getHeatmap,
  
  // Statistics
  getStatistics,
  getReports,
  getReport,
  
  // Timeline
  getTimeline,
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n=== Analytics API Examples ===\n');
  
  try {
    // Overview
    console.log('1. Fetching analytics overview...');
    const overview = await getAnalyticsOverview({ period: '24h' });
    console.log(`   Total articles: ${overview.totalArticles || 'N/A'}`);
    
    // Trends
    console.log('2. Fetching trends...');
    const trends = await getTrends({ period: '7d' });
    console.log(`   Trending topics: ${trends.topics?.length || 0}`);
    
    // Sentiment trends
    console.log('3. Fetching BTC sentiment trends...');
    const sentiment = await getSentimentTrends({ asset: 'BTC', period: '30d' });
    console.log(`   Data points: ${sentiment.data?.length || 0}`);
    
    // News volume
    console.log('4. Fetching news volume...');
    const volume = await getNewsVolume({ period: '7d' });
    console.log(`   Volume data: ${volume.data?.length || 0} intervals`);
    
    // Correlations
    console.log('5. Fetching news-price correlations...');
    const correlations = await getCorrelations({ asset: 'BTC' });
    console.log(`   Correlation: ${correlations.correlation || 'N/A'}`);
    
    // Source analytics
    console.log('6. Fetching source analytics...');
    const sources = await getSourceAnalytics();
    console.log(`   Sources tracked: ${sources.data?.length || 0}`);
    
    // Statistics
    console.log('7. Fetching statistics...');
    const stats = await getStatistics({ period: '30d' });
    console.log(`   Stats available: ${Object.keys(stats).length}`);
    
    // Reports
    console.log('8. Fetching available reports...');
    const reports = await getReports({ limit: 5 });
    console.log(`   Reports: ${reports.data?.length || 0}`);
    
    console.log('\n✅ All analytics examples completed!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
