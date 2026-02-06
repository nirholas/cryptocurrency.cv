/**
 * Free Crypto News API - Blockchain & On-Chain Examples
 * https://github.com/nirholas/free-crypto-news
 * 
 * On-chain data, DeFi TVL, NFTs, security, and more.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// ON-CHAIN DATA
// =============================================================================

/**
 * Get on-chain data for a blockchain
 * @param {string} chain - Blockchain name (ethereum, bitcoin, etc.)
 * @returns {Promise<Object>} On-chain metrics
 */
async function getOnChainData(chain) {
  const response = await fetch(`${BASE_URL}/api/blockchain/onchain?chain=${chain}`);
  return response.json();
}

/**
 * Get current gas prices
 * @param {string} chain - Blockchain (default: ethereum)
 * @returns {Promise<Object>} Gas price data
 */
async function getGasPrices(chain = 'ethereum') {
  const response = await fetch(`${BASE_URL}/api/blockchain/gas?chain=${chain}`);
  return response.json();
}

/**
 * Get token holder distribution
 * @param {string} token - Token address or symbol
 * @param {string} chain - Blockchain
 * @returns {Promise<Object>} Holder distribution
 */
async function getTokenHolders(token, chain = 'ethereum') {
  const response = await fetch(
    `${BASE_URL}/api/blockchain/holders?token=${token}&chain=${chain}`
  );
  return response.json();
}

/**
 * Get whale movements (large transactions)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Whale alerts
 */
async function getWhaleMovements(options = {}) {
  const params = new URLSearchParams({
    chain: options.chain || 'all',
    minValue: options.minValue || 1000000,
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/whales?${params}`);
  return response.json();
}

// =============================================================================
// DEFI DATA
// =============================================================================

/**
 * Get DeFi Total Value Locked (TVL)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} TVL data
 */
async function getDefiTVL(options = {}) {
  const params = new URLSearchParams({
    protocol: options.protocol || '',
    chain: options.chain || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/defi/tvl?${params}`);
  return response.json();
}

/**
 * Get yield farming opportunities
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Yield data
 */
async function getYields(options = {}) {
  const params = new URLSearchParams({
    chain: options.chain || 'all',
    minApy: options.minApy || 0,
    limit: options.limit || 50,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/defi/yields?${params}`);
  return response.json();
}

/**
 * Get staking information
 * @param {string} asset - Asset symbol
 * @returns {Promise<Object>} Staking data
 */
async function getStaking(asset) {
  const response = await fetch(`${BASE_URL}/api/blockchain/staking?asset=${asset}`);
  return response.json();
}

// =============================================================================
// TOKENS
// =============================================================================

/**
 * Get token list for a chain
 * @param {string} chain - Blockchain
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Token list
 */
async function getTokens(chain, options = {}) {
  const params = new URLSearchParams({
    chain,
    limit: options.limit || 100,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/tokens?${params}`);
  return response.json();
}

/**
 * Get token details
 * @param {string} address - Token address
 * @param {string} chain - Blockchain
 * @returns {Promise<Object>} Token details
 */
async function getToken(address, chain = 'ethereum') {
  const response = await fetch(
    `${BASE_URL}/api/blockchain/token?address=${address}&chain=${chain}`
  );
  return response.json();
}

// =============================================================================
// LAYER 2 & BRIDGES
// =============================================================================

/**
 * Get Layer 2 data
 * @param {Object} options - Query options
 * @returns {Promise<Object>} L2 data
 */
async function getLayer2Data(options = {}) {
  const params = new URLSearchParams({
    network: options.network || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/l2?${params}`);
  return response.json();
}

/**
 * Get bridge statistics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Bridge data
 */
async function getBridges(options = {}) {
  const params = new URLSearchParams({
    sourceChain: options.sourceChain || 'all',
    destChain: options.destChain || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/bridges?${params}`);
  return response.json();
}

// =============================================================================
// NFT DATA
// =============================================================================

/**
 * Get NFT news and trends
 * @param {Object} options - Query options
 * @returns {Promise<Object>} NFT news
 */
async function getNFTNews(options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 20,
    category: options.category || 'all',
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/nft/news?${params}`);
  return response.json();
}

/**
 * Get NFT collection data
 * @param {string} collection - Collection slug or address
 * @returns {Promise<Object>} Collection data
 */
async function getNFTCollection(collection) {
  const response = await fetch(`${BASE_URL}/api/blockchain/nft/collection?id=${collection}`);
  return response.json();
}

// =============================================================================
// AIRDROPS
// =============================================================================

/**
 * Get upcoming airdrops
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Airdrop list
 */
async function getAirdrops(options = {}) {
  const params = new URLSearchParams({
    status: options.status || 'upcoming',
    chain: options.chain || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/airdrops?${params}`);
  return response.json();
}

// =============================================================================
// SECURITY
// =============================================================================

/**
 * Get security alerts for the crypto ecosystem
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Security alerts
 */
async function getSecurityAlerts(options = {}) {
  const params = new URLSearchParams({
    severity: options.severity || 'all',
    limit: options.limit || 20,
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/security/alerts?${params}`);
  return response.json();
}

/**
 * Get recent hacks and exploits
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Hacks data
 */
async function getHacks(options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 20,
    year: options.year || new Date().getFullYear(),
    ...options
  });
  const response = await fetch(`${BASE_URL}/api/blockchain/security/hacks?${params}`);
  return response.json();
}

/**
 * Check rug pull risk for a token
 * @param {string} address - Token address
 * @param {string} chain - Blockchain
 * @returns {Promise<Object>} Risk analysis
 */
async function checkRugPullRisk(address, chain = 'ethereum') {
  const response = await fetch(
    `${BASE_URL}/api/blockchain/security/rugcheck?address=${address}&chain=${chain}`
  );
  return response.json();
}

/**
 * Get audit information for a project
 * @param {string} project - Project name or contract address
 * @returns {Promise<Object>} Audit data
 */
async function getAudits(project) {
  const response = await fetch(`${BASE_URL}/api/blockchain/security/audits?project=${project}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // On-chain
  getOnChainData,
  getGasPrices,
  getTokenHolders,
  getWhaleMovements,
  
  // DeFi
  getDefiTVL,
  getYields,
  getStaking,
  
  // Tokens
  getTokens,
  getToken,
  
  // L2 & Bridges
  getLayer2Data,
  getBridges,
  
  // NFT
  getNFTNews,
  getNFTCollection,
  
  // Airdrops
  getAirdrops,
  
  // Security
  getSecurityAlerts,
  getHacks,
  checkRugPullRisk,
  getAudits,
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n=== Blockchain & On-Chain API Examples ===\n');
  
  try {
    // Gas prices
    console.log('1. Fetching Ethereum gas prices...');
    const gas = await getGasPrices('ethereum');
    console.log(`   Fast: ${gas.fast || 'N/A'} gwei`);
    
    // DeFi TVL
    console.log('2. Fetching DeFi TVL...');
    const tvl = await getDefiTVL({ chain: 'ethereum' });
    console.log(`   Total TVL: $${tvl.totalTvl?.toLocaleString() || 'N/A'}`);
    
    // Whale movements
    console.log('3. Fetching whale movements...');
    const whales = await getWhaleMovements({ minValue: 10000000, limit: 5 });
    console.log(`   Found ${whales.data?.length || 0} whale transactions`);
    
    // Yields
    console.log('4. Fetching yield farming opportunities...');
    const yields = await getYields({ chain: 'ethereum', limit: 5 });
    console.log(`   Found ${yields.data?.length || 0} yield opportunities`);
    
    // L2 data
    console.log('5. Fetching Layer 2 data...');
    const l2 = await getLayer2Data();
    console.log(`   L2 networks: ${l2.networks?.length || 0}`);
    
    // Security alerts
    console.log('6. Fetching security alerts...');
    const alerts = await getSecurityAlerts({ limit: 5 });
    console.log(`   Found ${alerts.data?.length || 0} security alerts`);
    
    // Recent hacks
    console.log('7. Fetching recent hacks...');
    const hacks = await getHacks({ limit: 5 });
    console.log(`   Found ${hacks.data?.length || 0} recent exploits`);
    
    // Airdrops
    console.log('8. Fetching upcoming airdrops...');
    const airdrops = await getAirdrops({ limit: 5 });
    console.log(`   Found ${airdrops.data?.length || 0} upcoming airdrops`);
    
    console.log('\n✅ All blockchain examples completed!\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
