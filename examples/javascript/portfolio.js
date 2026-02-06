/**
 * Free Crypto News API - Portfolio & User Examples
 * https://github.com/nirholas/free-crypto-news
 * 
 * Portfolio tracking, alerts, watchlists, and user preferences.
 * Note: These endpoints require authentication (API key).
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// HELPER
// =============================================================================

/**
 * Create authenticated fetch helper
 * @param {string} apiKey - Your API key
 * @returns {Function} Authenticated fetch function
 */
function createAuthFetch(apiKey) {
  return async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  };
}

// =============================================================================
// PORTFOLIO
// =============================================================================

/**
 * Get portfolio
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Portfolio data
 */
async function getPortfolio(apiKey) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/portfolio`);
}

/**
 * Create or update portfolio
 * @param {string} apiKey - API key
 * @param {Object} portfolio - Portfolio data
 * @returns {Promise<Object>} Updated portfolio
 */
async function updatePortfolio(apiKey, portfolio) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/portfolio`, {
    method: 'POST',
    body: JSON.stringify(portfolio),
  });
}

/**
 * Add holding to portfolio
 * @param {string} apiKey - API key
 * @param {Object} holding - Holding data
 * @returns {Promise<Object>} Updated portfolio
 */
async function addHolding(apiKey, holding) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/portfolio/holdings`, {
    method: 'POST',
    body: JSON.stringify(holding),
  });
}

/**
 * Remove holding from portfolio
 * @param {string} apiKey - API key
 * @param {string} holdingId - Holding ID
 * @returns {Promise<Object>} Updated portfolio
 */
async function removeHolding(apiKey, holdingId) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/portfolio/holdings/${holdingId}`, {
    method: 'DELETE',
  });
}

/**
 * Get portfolio performance
 * @param {string} apiKey - API key
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Performance data
 */
async function getPortfolioPerformance(apiKey, options = {}) {
  const params = new URLSearchParams({
    period: options.period || '30d',
    ...options
  });
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/portfolio/performance?${params}`);
}

/**
 * Get news related to portfolio holdings
 * @param {string} apiKey - API key
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Portfolio news
 */
async function getPortfolioNews(apiKey, options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 20,
    ...options
  });
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/portfolio/news?${params}`);
}

// =============================================================================
// ALERTS
// =============================================================================

/**
 * Get user alerts
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Alerts list
 */
async function getAlerts(apiKey) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/alerts`);
}

/**
 * Create alert
 * @param {string} apiKey - API key
 * @param {Object} alert - Alert configuration
 * @returns {Promise<Object>} Created alert
 */
async function createAlert(apiKey, alert) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/alerts`, {
    method: 'POST',
    body: JSON.stringify(alert),
  });
}

/**
 * Update alert
 * @param {string} apiKey - API key
 * @param {string} alertId - Alert ID
 * @param {Object} updates - Alert updates
 * @returns {Promise<Object>} Updated alert
 */
async function updateAlert(apiKey, alertId, updates) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete alert
 * @param {string} apiKey - API key
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>} Delete response
 */
async function deleteAlert(apiKey, alertId) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/alerts/${alertId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// WATCHLIST
// =============================================================================

/**
 * Get watchlist
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Watchlist
 */
async function getWatchlist(apiKey) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/watchlist`);
}

/**
 * Add to watchlist
 * @param {string} apiKey - API key
 * @param {string} symbol - Asset symbol
 * @returns {Promise<Object>} Updated watchlist
 */
async function addToWatchlist(apiKey, symbol) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/watchlist`, {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
}

/**
 * Remove from watchlist
 * @param {string} apiKey - API key
 * @param {string} symbol - Asset symbol
 * @returns {Promise<Object>} Updated watchlist
 */
async function removeFromWatchlist(apiKey, symbol) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/watchlist/${symbol}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * Get notifications
 * @param {string} apiKey - API key
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Notifications
 */
async function getNotifications(apiKey, options = {}) {
  const params = new URLSearchParams({
    unread: options.unread || false,
    limit: options.limit || 50,
    ...options
  });
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/notifications?${params}`);
}

/**
 * Mark notifications as read
 * @param {string} apiKey - API key
 * @param {string[]} ids - Notification IDs
 * @returns {Promise<Object>} Update response
 */
async function markNotificationsRead(apiKey, ids) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/notifications/read`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * Mark all notifications as read
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Update response
 */
async function markAllRead(apiKey) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/notifications/read-all`, {
    method: 'POST',
  });
}

// =============================================================================
// PREFERENCES
// =============================================================================

/**
 * Get user preferences
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} User preferences
 */
async function getPreferences(apiKey) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/preferences`);
}

/**
 * Update preferences
 * @param {string} apiKey - API key
 * @param {Object} preferences - Preference updates
 * @returns {Promise<Object>} Updated preferences
 */
async function updatePreferences(apiKey, preferences) {
  const authFetch = createAuthFetch(apiKey);
  return authFetch(`${BASE_URL}/api/preferences`, {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Helper
  createAuthFetch,
  
  // Portfolio
  getPortfolio,
  updatePortfolio,
  addHolding,
  removeHolding,
  getPortfolioPerformance,
  getPortfolioNews,
  
  // Alerts
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  
  // Watchlist
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  
  // Notifications
  getNotifications,
  markNotificationsRead,
  markAllRead,
  
  // Preferences
  getPreferences,
  updatePreferences,
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n=== Portfolio & User API Examples ===\n');
  console.log('Note: These examples require a valid API key.\n');
  
  const API_KEY = process.env.CRYPTO_NEWS_API_KEY || 'your-api-key';
  
  if (API_KEY === 'your-api-key') {
    console.log('⚠️  Set CRYPTO_NEWS_API_KEY environment variable to run examples.');
    console.log('   export CRYPTO_NEWS_API_KEY="your-actual-api-key"');
    return;
  }
  
  try {
    // Portfolio
    console.log('1. Fetching portfolio...');
    const portfolio = await getPortfolio(API_KEY);
    console.log(`   Holdings: ${portfolio.holdings?.length || 0}`);
    
    // Add holding
    console.log('2. Adding BTC to portfolio...');
    const added = await addHolding(API_KEY, {
      symbol: 'BTC',
      amount: 0.5,
      purchasePrice: 40000,
      purchaseDate: '2024-01-15',
    });
    console.log(`   Result: ${added.success ? 'Success' : 'Failed'}`);
    
    // Performance
    console.log('3. Fetching portfolio performance...');
    const performance = await getPortfolioPerformance(API_KEY, { period: '30d' });
    console.log(`   Return: ${performance.totalReturn || 'N/A'}%`);
    
    // Alerts
    console.log('4. Fetching alerts...');
    const alerts = await getAlerts(API_KEY);
    console.log(`   Active alerts: ${alerts.data?.length || 0}`);
    
    // Create alert
    console.log('5. Creating price alert...');
    const alert = await createAlert(API_KEY, {
      type: 'price',
      asset: 'BTC',
      condition: 'above',
      value: 100000,
      channels: ['email', 'push'],
    });
    console.log(`   Alert created: ${alert.id || 'N/A'}`);
    
    // Watchlist
    console.log('6. Fetching watchlist...');
    const watchlist = await getWatchlist(API_KEY);
    console.log(`   Watching: ${watchlist.assets?.length || 0} assets`);
    
    // Notifications
    console.log('7. Fetching notifications...');
    const notifications = await getNotifications(API_KEY, { unread: true });
    console.log(`   Unread: ${notifications.data?.length || 0}`);
    
    // Preferences
    console.log('8. Fetching preferences...');
    const prefs = await getPreferences(API_KEY);
    console.log(`   Theme: ${prefs.theme || 'default'}`);
    
    console.log('\n✅ All portfolio examples completed!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
