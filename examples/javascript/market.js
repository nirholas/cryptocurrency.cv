/**
 * Market Data API Examples - JavaScript/Node.js
 * Free Crypto News API - https://github.com/nirholas/free-crypto-news
 * 
 * Examples for all market data endpoints.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// GET /api/market/coins - All Coins Data
// =============================================================================

async function getCoins({ limit = 100, page = 1, order = 'market_cap_desc' } = {}) {
  const params = new URLSearchParams({ limit, page, order });
  const response = await fetch(`${BASE_URL}/api/market/coins?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/market/ohlc/[coinId] - OHLC Data
// =============================================================================

async function getOHLC(coinId, days = 30) {
  const response = await fetch(`${BASE_URL}/api/market/ohlc/${coinId}?days=${days}`);
  return response.json();
}

// =============================================================================
// GET /api/market/history/[coinId] - Price History
// =============================================================================

async function getPriceHistory(coinId, days = 30) {
  const response = await fetch(`${BASE_URL}/api/market/history/${coinId}?days=${days}`);
  return response.json();
}

// =============================================================================
// GET /api/market/exchanges - Exchange Data
// =============================================================================

async function getExchanges(limit = 100) {
  const response = await fetch(`${BASE_URL}/api/market/exchanges?limit=${limit}`);
  return response.json();
}

async function getExchange(exchangeId) {
  const response = await fetch(`${BASE_URL}/api/market/exchanges/${exchangeId}`);
  return response.json();
}

// =============================================================================
// GET /api/market/derivatives - Derivatives Data
// =============================================================================

async function getDerivatives() {
  const response = await fetch(`${BASE_URL}/api/market/derivatives`);
  return response.json();
}

// =============================================================================
// GET /api/market/categories - Market Categories
// =============================================================================

async function getMarketCategories() {
  const response = await fetch(`${BASE_URL}/api/market/categories`);
  return response.json();
}

async function getCategory(categoryId) {
  const response = await fetch(`${BASE_URL}/api/market/categories/${categoryId}`);
  return response.json();
}

// =============================================================================
// GET /api/market/search - Search Markets
// =============================================================================

async function searchMarkets(query) {
  const response = await fetch(`${BASE_URL}/api/market/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

// =============================================================================
// GET /api/market/defi - DeFi Market Data
// =============================================================================

async function getDefiMarket() {
  const response = await fetch(`${BASE_URL}/api/market/defi`);
  return response.json();
}

// =============================================================================
// GET /api/market/compare - Compare Coins
// =============================================================================

async function compareCoins(coins) {
  const response = await fetch(`${BASE_URL}/api/market/compare?coins=${coins.join(',')}`);
  return response.json();
}

// =============================================================================
// GET /api/market/snapshot/[coinId] - Coin Snapshot
// =============================================================================

async function getCoinSnapshot(coinId) {
  const response = await fetch(`${BASE_URL}/api/market/snapshot/${coinId}`);
  return response.json();
}

// =============================================================================
// GET /api/market/tickers/[coinId] - Coin Tickers
// =============================================================================

async function getCoinTickers(coinId) {
  const response = await fetch(`${BASE_URL}/api/market/tickers/${coinId}`);
  return response.json();
}

// =============================================================================
// GET /api/market/social/[coinId] - Social Stats
// =============================================================================

async function getSocialStats(coinId) {
  const response = await fetch(`${BASE_URL}/api/market/social/${coinId}`);
  return response.json();
}

// =============================================================================
// GET /api/market/orderbook - Order Book
// =============================================================================

async function getOrderbook({ symbol = 'BTCUSDT', exchange = 'binance' } = {}) {
  const params = new URLSearchParams({ symbol, exchange });
  const response = await fetch(`${BASE_URL}/api/market/orderbook?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/fear-greed - Fear & Greed Index
// =============================================================================

async function getFearGreed() {
  const response = await fetch(`${BASE_URL}/api/fear-greed`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getCoins,
  getOHLC,
  getPriceHistory,
  getExchanges,
  getExchange,
  getDerivatives,
  getMarketCategories,
  getCategory,
  searchMarkets,
  getDefiMarket,
  compareCoins,
  getCoinSnapshot,
  getCoinTickers,
  getSocialStats,
  getOrderbook,
  getFearGreed,
  BASE_URL
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('FREE CRYPTO NEWS API - MARKET DATA EXAMPLES (JavaScript)');
  console.log('='.repeat(60));

  // 1. Top Coins
  console.log('\n💰 1. Top 10 Coins by Market Cap');
  const coins = await getCoins({ limit: 10 });
  const coinList = Array.isArray(coins) ? coins : coins.coins || [];
  coinList.slice(0, 10).forEach(coin => {
    const price = coin.current_price || coin.price || 'N/A';
    console.log(`   ${coin.name}: $${price}`);
  });

  // 2. OHLC Data
  console.log('\n📊 2. Bitcoin OHLC (7 days)');
  const ohlc = await getOHLC('bitcoin', 7);
  console.log(`   Data points: ${Array.isArray(ohlc) ? ohlc.length : 'See response'}`);

  // 3. Exchanges
  console.log('\n🏦 3. Top Exchanges');
  const exchanges = await getExchanges(5);
  const exchangeList = Array.isArray(exchanges) ? exchanges : exchanges.exchanges || [];
  exchangeList.slice(0, 5).forEach(ex => {
    console.log(`   ${ex.name}: Vol $${ex.trade_volume_24h_btc || 'N/A'}`);
  });

  // 4. Fear & Greed
  console.log('\n😱 4. Fear & Greed Index');
  const fg = await getFearGreed();
  console.log(`   Value: ${fg.value || fg}`);
  console.log(`   Classification: ${fg.classification || 'N/A'}`);

  // 5. Compare Coins
  console.log('\n⚖️ 5. Compare BTC vs ETH vs SOL');
  const comparison = await compareCoins(['bitcoin', 'ethereum', 'solana']);
  console.log(`   Comparison: ${JSON.stringify(comparison).substring(0, 150)}...`);

  // 6. DeFi Market
  console.log('\n🔗 6. DeFi Market Data');
  const defi = await getDefiMarket();
  console.log(`   DeFi TVL: ${JSON.stringify(defi).substring(0, 100)}`);

  // 7. Derivatives
  console.log('\n📈 7. Derivatives Markets');
  const derivs = await getDerivatives();
  console.log(`   Open Interest: ${JSON.stringify(derivs).substring(0, 100)}`);

  // 8. Search
  console.log('\n🔍 8. Search for "Layer 2"');
  const results = await searchMarkets('layer 2');
  console.log(`   Results: ${JSON.stringify(results).substring(0, 100)}`);

  console.log('\n' + '='.repeat(60));
  console.log('All market data examples completed!');
  console.log('='.repeat(60));
}

if (require.main === module) {
  runExamples().catch(console.error);
}
