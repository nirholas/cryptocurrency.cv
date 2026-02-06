/**
 * Free Crypto News API - Feeds & Export Examples
 * https://github.com/nirholas/free-crypto-news
 * 
 * RSS, Atom, JSON feeds, exports, and integration formats.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// RSS FEEDS
// =============================================================================

/**
 * Get RSS feed (XML format)
 * @param {Object} options - Query options
 * @returns {Promise<string>} RSS XML
 */
async function getRSSFeed(options = {}) {
  const params = new URLSearchParams({
    category: options.category || '',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/rss?${params}`);
  return response.text();
}

/**
 * Get RSS feed as JSON
 * @param {Object} options - Query options
 * @returns {Promise<Object>} RSS as JSON
 */
async function getRSSJSON(options = {}) {
  const params = new URLSearchParams({
    category: options.category || '',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/rss/json?${params}`);
  return response.json();
}

/**
 * Get OPML file for feed readers
 * @returns {Promise<string>} OPML XML
 */
async function getOPML() {
  const response = await fetch(`${BASE_URL}/api/feeds/opml`);
  return response.text();
}

// =============================================================================
// ATOM & JSON FEEDS
// =============================================================================

/**
 * Get Atom feed
 * @param {Object} options - Query options
 * @returns {Promise<string>} Atom XML
 */
async function getAtomFeed(options = {}) {
  const params = new URLSearchParams({
    category: options.category || '',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/feeds/atom?${params}`);
  return response.text();
}

/**
 * Get JSON Feed (jsonfeed.org format)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} JSON Feed
 */
async function getJSONFeed(options = {}) {
  const params = new URLSearchParams({
    category: options.category || '',
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/feeds/json?${params}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Export data in specified format
 * @param {string} format - Export format (csv, json, xlsx)
 * @param {Object} options - Query options
 * @returns {Promise<string|Object>} Exported data
 */
async function exportData(format, options = {}) {
  const params = new URLSearchParams({
    format,
    category: options.category || '',
    from: options.from || '',
    to: options.to || '',
    limit: options.limit || 100,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/export?${params}`);
  
  if (format === 'json') {
    return response.json();
  }
  return response.text();
}

/**
 * Export to CSV
 * @param {Object} options - Query options
 * @returns {Promise<string>} CSV data
 */
async function exportCSV(options = {}) {
  return exportData('csv', options);
}

/**
 * Export to JSON
 * @param {Object} options - Query options
 * @returns {Promise<Object>} JSON data
 */
async function exportJSON(options = {}) {
  return exportData('json', options);
}

// =============================================================================
// LLM & AI INTEGRATIONS
// =============================================================================

/**
 * Get llms.txt file (AI-readable format)
 * @returns {Promise<string>} llms.txt content
 */
async function getLLMsTxt() {
  const response = await fetch(`${BASE_URL}/llms.txt`);
  return response.text();
}

/**
 * Get llms-full.txt with complete context
 * @returns {Promise<string>} llms-full.txt content
 */
async function getLLMsFullTxt() {
  const response = await fetch(`${BASE_URL}/llms-full.txt`);
  return response.text();
}

// =============================================================================
// SITEMAP & SEO
// =============================================================================

/**
 * Get sitemap XML
 * @returns {Promise<string>} Sitemap XML
 */
async function getSitemap() {
  const response = await fetch(`${BASE_URL}/sitemap.xml`);
  return response.text();
}

/**
 * Get sitemap index
 * @returns {Promise<string>} Sitemap index XML
 */
async function getSitemapIndex() {
  const response = await fetch(`${BASE_URL}/sitemap-index.xml`);
  return response.text();
}

// =============================================================================
// EMBED & OEMBED
// =============================================================================

/**
 * Get oEmbed data for an article
 * @param {string} url - Article URL
 * @returns {Promise<Object>} oEmbed data
 */
async function getOEmbed(url) {
  const response = await fetch(`${BASE_URL}/api/oembed?url=${encodeURIComponent(url)}`);
  return response.json();
}

/**
 * Get embed code for an article
 * @param {string} articleId - Article ID
 * @param {Object} options - Embed options
 * @returns {Promise<Object>} Embed code
 */
async function getEmbedCode(articleId, options = {}) {
  const params = new URLSearchParams({
    id: articleId,
    theme: options.theme || 'light',
    width: options.width || '100%',
    height: options.height || 'auto',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/embed?${params}`);
  return response.json();
}

// =============================================================================
// ARCHIVE
// =============================================================================

/**
 * Get archive for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} Archive data
 */
async function getArchive(date) {
  const response = await fetch(`${BASE_URL}/api/archive?date=${date}`);
  return response.json();
}

/**
 * Get archive index
 * @returns {Promise<Object>} Archive index
 */
async function getArchiveIndex() {
  const response = await fetch(`${BASE_URL}/api/archive/index`);
  return response.json();
}

// =============================================================================
// WEBHOOKS
// =============================================================================

/**
 * Create webhook subscription
 * @param {Object} webhook - Webhook configuration
 * @returns {Promise<Object>} Webhook response
 */
async function createWebhook(webhook) {
  const response = await fetch(`${BASE_URL}/api/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhook)
  });
  return response.json();
}

/**
 * List webhooks
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Webhooks list
 */
async function listWebhooks(apiKey) {
  const response = await fetch(`${BASE_URL}/api/webhooks`, {
    headers: { 'X-API-Key': apiKey }
  });
  return response.json();
}

/**
 * Delete webhook
 * @param {string} webhookId - Webhook ID
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} Delete response
 */
async function deleteWebhook(webhookId, apiKey) {
  const response = await fetch(`${BASE_URL}/api/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': apiKey }
  });
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // RSS
  getRSSFeed,
  getRSSJSON,
  getOPML,
  
  // Atom & JSON Feed
  getAtomFeed,
  getJSONFeed,
  
  // Exports
  exportData,
  exportCSV,
  exportJSON,
  
  // LLM
  getLLMsTxt,
  getLLMsFullTxt,
  
  // Sitemap
  getSitemap,
  getSitemapIndex,
  
  // Embed
  getOEmbed,
  getEmbedCode,
  
  // Archive
  getArchive,
  getArchiveIndex,
  
  // Webhooks
  createWebhook,
  listWebhooks,
  deleteWebhook,
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n=== Feeds & Export API Examples ===\n');
  
  try {
    // RSS JSON
    console.log('1. Fetching RSS feed as JSON...');
    const rss = await getRSSJSON({ limit: 5 });
    console.log(`   Items: ${rss.items?.length || 0}`);
    
    // JSON Feed
    console.log('2. Fetching JSON Feed...');
    const jsonFeed = await getJSONFeed({ limit: 5 });
    console.log(`   Items: ${jsonFeed.items?.length || 0}`);
    
    // Export JSON
    console.log('3. Exporting data as JSON...');
    const exported = await exportJSON({ limit: 5 });
    console.log(`   Exported: ${exported.data?.length || 0} items`);
    
    // LLMs.txt
    console.log('4. Fetching llms.txt...');
    const llms = await getLLMsTxt();
    console.log(`   Length: ${llms.length} characters`);
    
    // Archive index
    console.log('5. Fetching archive index...');
    const archiveIndex = await getArchiveIndex();
    console.log(`   Archives: ${archiveIndex.dates?.length || 0}`);
    
    // oEmbed
    console.log('6. Fetching oEmbed data...');
    const oembed = await getOEmbed('https://cryptocurrency.cv/article/example');
    console.log(`   Type: ${oembed.type || 'N/A'}`);
    
    console.log('\n✅ All feeds & export examples completed!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
