/**
 * Trading API Examples - JavaScript/Node.js
 * Free Crypto News API - https://github.com/nirholas/free-crypto-news
 * 
 * Examples for trading-related endpoints.
 */

const BASE_URL = 'https://cryptocurrency.cv';

// =============================================================================
// GET /api/arbitrage - Arbitrage Opportunities
// =============================================================================

async function getArbitrage({ minSpread = 0.5, limit = 20 } = {}) {
  const params = new URLSearchParams({ min_spread: minSpread, limit });
  const response = await fetch(`${BASE_URL}/api/arbitrage?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/signals - Trading Signals
// =============================================================================

async function getSignals({ asset, timeframe = '1h' } = {}) {
  const params = new URLSearchParams({ timeframe });
  if (asset) params.append('asset', asset);
  
  const response = await fetch(`${BASE_URL}/api/signals?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/funding - Funding Rates
// =============================================================================

async function getFundingRates(exchange) {
  const params = exchange ? `?exchange=${exchange}` : '';
  const response = await fetch(`${BASE_URL}/api/funding${params}`);
  return response.json();
}

// =============================================================================
// GET /api/options - Options Data
// =============================================================================

async function getOptions(asset = 'BTC') {
  const response = await fetch(`${BASE_URL}/api/options?asset=${asset}`);
  return response.json();
}

// =============================================================================
// GET /api/liquidations - Liquidation Data
// =============================================================================

async function getLiquidations({ timeframe = '24h', minValue = 100000 } = {}) {
  const params = new URLSearchParams({ timeframe, min_value: minValue });
  const response = await fetch(`${BASE_URL}/api/liquidations?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/whale-alerts - Whale Transactions
// =============================================================================

async function getWhaleAlerts({ minValue = 1000000, limit = 20 } = {}) {
  const params = new URLSearchParams({ min_value: minValue, limit });
  const response = await fetch(`${BASE_URL}/api/whale-alerts?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/orderbook - Order Book Data
// =============================================================================

async function getOrderbook({ symbol = 'BTCUSDT', exchange = 'binance', depth = 20 } = {}) {
  const params = new URLSearchParams({ symbol, exchange, depth });
  const response = await fetch(`${BASE_URL}/api/orderbook?${params}`);
  return response.json();
}

// =============================================================================
// GET /api/orderbook/stream - Real-time Order Book (SSE)
// =============================================================================

function streamOrderbook(symbol = 'BTCUSDT', callback) {
  const EventSource = require('eventsource');
  const es = new EventSource(`${BASE_URL}/api/orderbook/stream?symbol=${symbol}`);
  
  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    callback(data);
  };
  
  es.onerror = (error) => {
    console.error('SSE Error:', error);
  };
  
  return es;
}

// =============================================================================
// GET /api/trading/orderbook - Trading Order Book
// =============================================================================

async function getTradingOrderbook(symbol = 'BTCUSDT') {
  const response = await fetch(`${BASE_URL}/api/trading/orderbook?symbol=${symbol}`);
  return response.json();
}

// =============================================================================
// GET /api/trading/arbitrage - Advanced Arbitrage
// =============================================================================

async function getAdvancedArbitrage(includeFees = true) {
  const response = await fetch(
    `${BASE_URL}/api/trading/arbitrage?include_fees=${includeFees}`
  );
  return response.json();
}

// =============================================================================
// GET /api/trading/options - Trading Options Data
// =============================================================================

async function getTradingOptions({ asset = 'BTC', expiry } = {}) {
  const params = new URLSearchParams({ asset });
  if (expiry) params.append('expiry', expiry);
  
  const response = await fetch(`${BASE_URL}/api/trading/options?${params}`);
  return response.json();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getArbitrage,
  getSignals,
  getFundingRates,
  getOptions,
  getLiquidations,
  getWhaleAlerts,
  getOrderbook,
  streamOrderbook,
  getTradingOrderbook,
  getAdvancedArbitrage,
  getTradingOptions,
  BASE_URL
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('FREE CRYPTO NEWS API - TRADING EXAMPLES (JavaScript)');
  console.log('='.repeat(60));

  // 1. Arbitrage
  console.log('\n💹 1. Arbitrage Opportunities');
  const arb = await getArbitrage({ minSpread: 0.3, limit: 5 });
  console.log(`   Found: ${JSON.stringify(arb).substring(0, 150)}`);

  // 2. Signals
  console.log('\n📊 2. Trading Signals (BTC)');
  const signals = await getSignals({ asset: 'BTC', timeframe: '4h' });
  console.log(`   Signals: ${JSON.stringify(signals).substring(0, 150)}`);

  // 3. Funding Rates
  console.log('\n💰 3. Funding Rates');
  const funding = await getFundingRates();
  console.log(`   Rates: ${JSON.stringify(funding).substring(0, 150)}`);

  // 4. Options
  console.log('\n📈 4. BTC Options Data');
  const options = await getOptions('BTC');
  console.log(`   Options: ${JSON.stringify(options).substring(0, 150)}`);

  // 5. Liquidations
  console.log('\n🔥 5. Recent Liquidations (24h)');
  const liquidations = await getLiquidations({ timeframe: '24h', minValue: 500000 });
  console.log(`   Liquidations: ${JSON.stringify(liquidations).substring(0, 150)}`);

  // 6. Whale Alerts
  console.log('\n🐋 6. Whale Alerts');
  const whales = await getWhaleAlerts({ minValue: 5000000, limit: 5 });
  console.log(`   Whales: ${JSON.stringify(whales).substring(0, 150)}`);

  // 7. Order Book
  console.log('\n📖 7. BTC/USDT Order Book');
  const orderbook = await getOrderbook({ symbol: 'BTCUSDT', depth: 10 });
  if (orderbook.bids) {
    console.log(`   Top Bids: ${JSON.stringify(orderbook.bids.slice(0, 3))}`);
    console.log(`   Top Asks: ${JSON.stringify(orderbook.asks.slice(0, 3))}`);
  } else {
    console.log(`   Orderbook: ${JSON.stringify(orderbook).substring(0, 150)}`);
  }

  // 8. Advanced Arbitrage
  console.log('\n🔄 8. Advanced Arbitrage (with fees)');
  const advArb = await getAdvancedArbitrage(true);
  console.log(`   Opportunities: ${JSON.stringify(advArb).substring(0, 150)}`);

  console.log('\n' + '='.repeat(60));
  console.log('All trading examples completed!');
  console.log('='.repeat(60));
}

if (require.main === module) {
  runExamples().catch(console.error);
}
