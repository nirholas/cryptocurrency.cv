/**
 * Free Crypto News API - Social Media Examples
 * https://github.com/nirholas/free-crypto-news
 * 
 * Social media feeds, sentiment, and community tracking.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// X (TWITTER) ENDPOINTS
// =============================================================================

/**
 * Get X/Twitter feed for crypto topics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Twitter feed data
 */
async function getXFeed(options = {}) {
  const params = new URLSearchParams({
    topic: options.topic || 'crypto',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/x?${params}`);
  return response.json();
}

/**
 * Get X/Twitter mentions for a specific asset
 * @param {string} asset - Asset symbol (BTC, ETH, etc.)
 * @returns {Promise<Object>} Mentions data
 */
async function getXMentions(asset) {
  const response = await fetch(`${BASE_URL}/api/social/x/mentions?asset=${asset}`);
  return response.json();
}

// =============================================================================
// REDDIT ENDPOINTS
// =============================================================================

/**
 * Get Reddit feed from crypto subreddits
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Reddit posts
 */
async function getRedditFeed(options = {}) {
  const params = new URLSearchParams({
    subreddit: options.subreddit || 'cryptocurrency',
    sort: options.sort || 'hot',
    limit: options.limit || 25,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/reddit?${params}`);
  return response.json();
}

/**
 * Get Reddit sentiment for an asset
 * @param {string} asset - Asset symbol
 * @returns {Promise<Object>} Reddit sentiment data
 */
async function getRedditSentiment(asset) {
  const response = await fetch(`${BASE_URL}/api/social/reddit/sentiment?asset=${asset}`);
  return response.json();
}

// =============================================================================
// YOUTUBE ENDPOINTS
// =============================================================================

/**
 * Get YouTube crypto videos
 * @param {Object} options - Query options
 * @returns {Promise<Object>} YouTube videos
 */
async function getYouTubeFeed(options = {}) {
  const params = new URLSearchParams({
    query: options.query || 'cryptocurrency news',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/youtube?${params}`);
  return response.json();
}

// =============================================================================
// DISCORD ENDPOINTS
// =============================================================================

/**
 * Get Discord activity for crypto communities
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Discord activity
 */
async function getDiscordActivity(options = {}) {
  const params = new URLSearchParams({
    project: options.project || '',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/discord?${params}`);
  return response.json();
}

// =============================================================================
// TELEGRAM ENDPOINTS
// =============================================================================

/**
 * Get Telegram channel feed
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Telegram messages
 */
async function getTelegramFeed(options = {}) {
  const params = new URLSearchParams({
    channel: options.channel || '',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/telegram?${params}`);
  return response.json();
}

// =============================================================================
// GITHUB ENDPOINTS
// =============================================================================

/**
 * Get GitHub activity for crypto projects
 * @param {string} project - Project name or repo
 * @returns {Promise<Object>} GitHub activity
 */
async function getGitHubActivity(project) {
  const response = await fetch(`${BASE_URL}/api/social/github?project=${project}`);
  return response.json();
}

/**
 * Get developer activity metrics
 * @param {string} project - Project name
 * @returns {Promise<Object>} Developer metrics
 */
async function getDeveloperActivity(project) {
  const response = await fetch(`${BASE_URL}/api/social/github/developer-activity?project=${project}`);
  return response.json();
}

// =============================================================================
// INFLUENCERS & TRENDING
// =============================================================================

/**
 * Get top crypto influencers
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Influencer data
 */
async function getInfluencers(options = {}) {
  const params = new URLSearchParams({
    platform: options.platform || 'all',
    category: options.category || 'crypto',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/influencers?${params}`);
  return response.json();
}

/**
 * Get aggregated social sentiment
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Social sentiment data
 */
async function getSocialSentiment(options = {}) {
  const params = new URLSearchParams({
    asset: options.asset || 'BTC',
    platforms: options.platforms?.join(',') || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/sentiment?${params}`);
  return response.json();
}

/**
 * Get trending topics across social media
 * @returns {Promise<Object>} Trending topics
 */
async function getSocialTrending() {
  const response = await fetch(`${BASE_URL}/api/social/trending`);
  return response.json();
}

/**
 * Get mentions volume for an asset
 * @param {string} asset - Asset symbol
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Mentions data
 */
async function getMentions(asset, options = {}) {
  const params = new URLSearchParams({
    asset,
    period: options.period || '24h',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/mentions?${params}`);
  return response.json();
}

// =============================================================================
// GOVERNANCE
// =============================================================================

/**
 * Get governance proposals for a project
 * @param {string} project - Project name
 * @returns {Promise<Object>} Governance proposals
 */
async function getGovernance(project) {
  const response = await fetch(`${BASE_URL}/api/social/governance?project=${project}`);
  return response.json();
}

/**
 * Get specific governance proposal
 * @param {string} project - Project name
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Proposal details
 */
async function getProposal(project, proposalId) {
  const response = await fetch(
    `${BASE_URL}/api/social/governance/proposal?project=${project}&id=${proposalId}`
  );
  return response.json();
}

// =============================================================================
// EVENTS & CALENDAR
// =============================================================================

/**
 * Get upcoming crypto events
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Events list
 */
async function getEvents(options = {}) {
  const params = new URLSearchParams({
    category: options.category || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/social/events?${params}`);
  return response.json();
}

/**
 * Get crypto calendar for date range
 * @param {string} start - Start date (YYYY-MM-DD)
 * @param {string} end - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Calendar events
 */
async function getCalendar(start, end) {
  const response = await fetch(
    `${BASE_URL}/api/social/calendar?start=${start}&end=${end}`
  );
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // X/Twitter
  getXFeed,
  getXMentions,
  
  // Reddit
  getRedditFeed,
  getRedditSentiment,
  
  // YouTube
  getYouTubeFeed,
  
  // Discord
  getDiscordActivity,
  
  // Telegram
  getTelegramFeed,
  
  // GitHub
  getGitHubActivity,
  getDeveloperActivity,
  
  // Influencers & Trending
  getInfluencers,
  getSocialSentiment,
  getSocialTrending,
  getMentions,
  
  // Governance
  getGovernance,
  getProposal,
  
  // Events
  getEvents,
  getCalendar,
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n=== Social Media API Examples ===\n');
  
  try {
    // X/Twitter feed
    console.log('1. Fetching X/Twitter feed...');
    const xFeed = await getXFeed({ topic: 'bitcoin', limit: 5 });
    console.log(`   Found ${xFeed.data?.length || 0} tweets`);
    
    // Reddit feed
    console.log('2. Fetching Reddit feed...');
    const reddit = await getRedditFeed({ subreddit: 'cryptocurrency', limit: 5 });
    console.log(`   Found ${reddit.data?.length || 0} posts`);
    
    // Social sentiment
    console.log('3. Getting social sentiment for BTC...');
    const sentiment = await getSocialSentiment({ asset: 'BTC' });
    console.log(`   Sentiment: ${sentiment.overall || 'N/A'}`);
    
    // Trending topics
    console.log('4. Fetching trending topics...');
    const trending = await getSocialTrending();
    console.log(`   Found ${trending.topics?.length || 0} trending topics`);
    
    // Influencers
    console.log('5. Fetching top influencers...');
    const influencers = await getInfluencers({ limit: 5 });
    console.log(`   Found ${influencers.data?.length || 0} influencers`);
    
    // GitHub activity
    console.log('6. Fetching GitHub activity for Bitcoin...');
    const github = await getGitHubActivity('bitcoin');
    console.log(`   Activity: ${github.commits || 0} recent commits`);
    
    // Governance
    console.log('7. Fetching governance proposals for Uniswap...');
    const governance = await getGovernance('uniswap');
    console.log(`   Found ${governance.proposals?.length || 0} proposals`);
    
    // Events
    console.log('8. Fetching upcoming events...');
    const events = await getEvents({ limit: 5 });
    console.log(`   Found ${events.data?.length || 0} events`);
    
    console.log('\n✅ All social examples completed!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
