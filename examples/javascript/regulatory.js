/**
 * Free Crypto News API - Regulatory & Compliance Examples
 * https://github.com/nirholas/free-crypto-news
 * 
 * Regulatory news, ETF updates, SEC filings, and compliance data.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// REGULATORY NEWS
// =============================================================================

/**
 * Get regulatory news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Regulatory news
 */
async function getRegulatoryNews(options = {}) {
  const params = new URLSearchParams({
    region: options.region || 'global',
    category: options.category || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/news?${params}`);
  return response.json();
}

/**
 * Get policy updates
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Policy updates
 */
async function getPolicyUpdates(options = {}) {
  const params = new URLSearchParams({
    jurisdiction: options.jurisdiction || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/policy?${params}`);
  return response.json();
}

// =============================================================================
// COUNTRY REGULATIONS
// =============================================================================

/**
 * Get all countries with crypto regulations
 * @returns {Promise<Object>} Country list
 */
async function getAllCountries() {
  const response = await fetch(`${BASE_URL}/api/regulatory/countries`);
  return response.json();
}

/**
 * Get regulations for a specific country
 * @param {string} countryCode - ISO country code
 * @returns {Promise<Object>} Country regulations
 */
async function getCountryRegulations(countryCode) {
  const response = await fetch(`${BASE_URL}/api/regulatory/country?code=${countryCode}`);
  return response.json();
}

// =============================================================================
// ETF NEWS
// =============================================================================

/**
 * Get crypto ETF news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} ETF news
 */
async function getETFNews(options = {}) {
  const params = new URLSearchParams({
    type: options.type || 'all', // spot, futures, all
    asset: options.asset || '',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/etf?${params}`);
  return response.json();
}

/**
 * Get ETF flow data
 * @param {Object} options - Query options
 * @returns {Promise<Object>} ETF flows
 */
async function getETFFlows(options = {}) {
  const params = new URLSearchParams({
    period: options.period || '30d',
    asset: options.asset || 'BTC',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/etf/flows?${params}`);
  return response.json();
}

// =============================================================================
// SEC & CFTC
// =============================================================================

/**
 * Get SEC crypto-related news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} SEC news
 */
async function getSECNews(options = {}) {
  const params = new URLSearchParams({
    type: options.type || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/sec?${params}`);
  return response.json();
}

/**
 * Get CFTC crypto-related news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} CFTC news
 */
async function getCFTCNews(options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/cftc?${params}`);
  return response.json();
}

/**
 * Get enforcement actions
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Enforcement actions
 */
async function getEnforcementActions(options = {}) {
  const params = new URLSearchParams({
    agency: options.agency || 'all',
    year: options.year || new Date().getFullYear(),
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/enforcement?${params}`);
  return response.json();
}

// =============================================================================
// LEGISLATION
// =============================================================================

/**
 * Get crypto legislation updates
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Legislation data
 */
async function getLegislation(options = {}) {
  const params = new URLSearchParams({
    jurisdiction: options.jurisdiction || 'US',
    status: options.status || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/legislation?${params}`);
  return response.json();
}

// =============================================================================
// CBDC
// =============================================================================

/**
 * Get CBDC (Central Bank Digital Currency) news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} CBDC news
 */
async function getCBDCNews(options = {}) {
  const params = new URLSearchParams({
    country: options.country || '',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/cbdc?${params}`);
  return response.json();
}

/**
 * Get CBDC tracker data
 * @returns {Promise<Object>} CBDC status by country
 */
async function getCBDCTracker() {
  const response = await fetch(`${BASE_URL}/api/regulatory/cbdc/tracker`);
  return response.json();
}

// =============================================================================
// SANCTIONS & COMPLIANCE
// =============================================================================

/**
 * Get sanctions news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Sanctions news
 */
async function getSanctionsNews(options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/sanctions?${params}`);
  return response.json();
}

/**
 * Get exchange regulation news
 * @param {string} exchange - Exchange name (optional)
 * @returns {Promise<Object>} Exchange regulations
 */
async function getExchangeRegulations(exchange = '') {
  const params = new URLSearchParams({ exchange });
  const response = await fetch(`${BASE_URL}/api/regulatory/exchanges?${params}`);
  return response.json();
}

// =============================================================================
// TAX & STABLECOINS
// =============================================================================

/**
 * Get crypto tax updates
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Tax news
 */
async function getTaxUpdates(options = {}) {
  const params = new URLSearchParams({
    country: options.country || '',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/tax?${params}`);
  return response.json();
}

/**
 * Get stablecoin regulation news
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Stablecoin regulation news
 */
async function getStablecoinRegulations(options = {}) {
  const params = new URLSearchParams({
    stablecoin: options.stablecoin || '',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/regulatory/stablecoins?${params}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Regulatory news
  getRegulatoryNews,
  getPolicyUpdates,
  
  // Countries
  getAllCountries,
  getCountryRegulations,
  
  // ETF
  getETFNews,
  getETFFlows,
  
  // SEC & CFTC
  getSECNews,
  getCFTCNews,
  getEnforcementActions,
  
  // Legislation
  getLegislation,
  
  // CBDC
  getCBDCNews,
  getCBDCTracker,
  
  // Sanctions
  getSanctionsNews,
  getExchangeRegulations,
  
  // Tax & Stablecoins
  getTaxUpdates,
  getStablecoinRegulations,
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n=== Regulatory & Compliance API Examples ===\n');
  
  try {
    // Regulatory news
    console.log('1. Fetching regulatory news...');
    const regNews = await getRegulatoryNews({ limit: 5 });
    console.log(`   Found ${regNews.data?.length || 0} regulatory articles`);
    
    // ETF news
    console.log('2. Fetching ETF news...');
    const etfNews = await getETFNews({ type: 'spot', limit: 5 });
    console.log(`   Found ${etfNews.data?.length || 0} ETF articles`);
    
    // SEC news
    console.log('3. Fetching SEC news...');
    const secNews = await getSECNews({ limit: 5 });
    console.log(`   Found ${secNews.data?.length || 0} SEC articles`);
    
    // Countries
    console.log('4. Fetching countries with regulations...');
    const countries = await getAllCountries();
    console.log(`   Found ${countries.data?.length || 0} countries`);
    
    // US regulations
    console.log('5. Fetching US regulations...');
    const usRegs = await getCountryRegulations('US');
    console.log(`   Legal status: ${usRegs.status || 'N/A'}`);
    
    // CBDC tracker
    console.log('6. Fetching CBDC tracker...');
    const cbdc = await getCBDCTracker();
    console.log(`   Countries with CBDC: ${cbdc.data?.length || 0}`);
    
    // Enforcement actions
    console.log('7. Fetching enforcement actions...');
    const enforcement = await getEnforcementActions({ limit: 5 });
    console.log(`   Found ${enforcement.data?.length || 0} enforcement actions`);
    
    // Legislation
    console.log('8. Fetching US legislation...');
    const legislation = await getLegislation({ jurisdiction: 'US', limit: 5 });
    console.log(`   Found ${legislation.data?.length || 0} bills`);
    
    console.log('\n✅ All regulatory examples completed!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
