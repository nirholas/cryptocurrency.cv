/**
 * Free Crypto News JavaScript SDK
 * 
 * 100% FREE - no API keys required!
 * Works in Node.js and browsers.
 * 
 * Usage:
 *   import { CryptoNews } from './crypto-news.js';
 *   const news = new CryptoNews();
 *   const articles = await news.getLatest(10);
 */

const DEFAULT_BASE_URL = 'https://cryptocurrency.cv';

/**
 * Default 19 trading pairs: exchange symbol → search keyword.
 * Inspired by CyberPunkMetalHead/cryptocurrency-news-analysis.
 */
export const COIN_PAIRS = {
  BTCUSD:   'Bitcoin',
  ETHUSD:   'Ethereum',
  LTCUSD:   'Litecoin',
  XRPUSD:   'Ripple',
  SOLUSD:   'Solana',
  BNBUSD:   'Binance',
  ADAUSD:   'Cardano',
  AVAXUSD:  'Avalanche',
  DOTUSD:   'Polkadot',
  MATICUSD: 'Polygon',
  DOGEUSD:  'Dogecoin',
  TRXUSD:   'Tron',
  XLMUSD:   'Stellar Lumens',
  XMRUSD:   'Monero',
  ZECUSD:   'Zcash',
  BATUSD:   'Basic Attention Token',
  EOSUSD:   'EOS',
  NEOUSD:   'NEO',
  ETCUSD:   'Ethereum Classic',
};

// Score map and signal tiers shared within the class.
const _SCORE_MAP = {
  very_bullish: +1.0,
  bullish:      +0.5,
  neutral:       0.0,
  bearish:      -0.5,
  very_bearish: -1.0,
};
const _SIGNAL_TIERS = [
  [0.5,   'very_bullish'],
  [0.15,  'bullish'],
  [-0.15, 'neutral'],
  [-0.5,  'bearish'],
  [-999,  'very_bearish'],
];

export class CryptoNews {
  constructor(baseUrl = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async _fetch(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /**
   * Get latest crypto news
   * @param {number} limit - Max articles (1-50)
   * @param {string} source - Filter by source
   * @returns {Promise<Array>} Articles
   */
  async getLatest(limit = 10, source = null) {
    let endpoint = `/api/news?limit=${limit}`;
    if (source) endpoint += `&source=${source}`;
    const data = await this._fetch(endpoint);
    return data.articles;
  }

  /**
   * Search news by keywords
   * @param {string} keywords - Comma-separated terms
   * @param {number} limit - Max results (1-30)
   */
  async search(keywords, limit = 10) {
    const encoded = encodeURIComponent(keywords);
    const data = await this._fetch(`/api/search?q=${encoded}&limit=${limit}`);
    return data.articles;
  }

  /** Get DeFi-specific news */
  async getDefi(limit = 10) {
    const data = await this._fetch(`/api/defi?limit=${limit}`);
    return data.articles;
  }

  /** Get Bitcoin-specific news */
  async getBitcoin(limit = 10) {
    const data = await this._fetch(`/api/bitcoin?limit=${limit}`);
    return data.articles;
  }

  /** Get breaking news (last 2 hours) */
  async getBreaking(limit = 5) {
    const data = await this._fetch(`/api/breaking?limit=${limit}`);
    return data.articles;
  }

  /** Get list of all sources */
  async getSources() {
    const data = await this._fetch('/api/sources');
    return data.sources;
  }

  /** Get trending topics */
  async getTrending(limit = 10, hours = 24) {
    return this._fetch(`/api/trending?limit=${limit}&hours=${hours}`);
  }

  /** Get API statistics */
  async getStats() {
    return this._fetch('/api/stats');
  }

  /** Check API health */
  async getHealth() {
    return this._fetch('/api/health');
  }

  /** Get news with topic classification and sentiment */
  async analyze(limit = 20, topic = null, sentiment = null) {
    let endpoint = `/api/analyze?limit=${limit}`;
    if (topic) endpoint += `&topic=${encodeURIComponent(topic)}`;
    if (sentiment) endpoint += `&sentiment=${sentiment}`;
    return this._fetch(endpoint);
  }

  /** Get archived news */
  async getArchive(date = null, query = null, limit = 50) {
    let endpoint = '/api/archive?';
    const params = [];
    if (date) params.push(`date=${date}`);
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    params.push(`limit=${limit}`);
    return this._fetch(endpoint + params.join('&'));
  }

  /** Find original sources of news */
  async getOrigins(query = null, category = null, limit = 20) {
    let endpoint = '/api/origins?';
    const params = [`limit=${limit}`];
    if (query) params.push(`q=${encodeURIComponent(query)}`);
    if (category) params.push(`category=${category}`);
    return this._fetch(endpoint + params.join('&'));
  }

  /** Get portfolio news with optional prices */
  async getPortfolio(coins, limit = 10, includePrices = true) {
    const coinsParam = Array.isArray(coins) ? coins.join(',') : coins;
    return this._fetch(`/api/portfolio?coins=${encodeURIComponent(coinsParam)}&limit=${limit}&prices=${includePrices}`);
  }

  /**
   * Calculate per-coin sentiment with confidence weighting and trade filtering.
   *
   * All coins are fetched concurrently with Promise.allSettled(), so 19 coins
   * take ~1 network round-trip rather than 19 serial requests.
   *
   * Confidence formula:
   *   confidence = volumeWeight × marginWeight × 100
   *   - volumeWeight: 0→1 as article count reaches minArticles. A single
   *     article can never exceed 1/minArticles on this axis alone.
   *   - marginWeight: normalised %-gap between dominant and second bucket.
   *
   * Signal is 5-tier (very_bullish → very_bearish) derived from graded score.
   *
   * @param {Object}  coins          Map of pair → keyword (default: COIN_PAIRS)
   * @param {number}  limit          Max articles per coin (default 30)
   * @param {number}  minArticles    Min articles for tradeable=true (default 5)
   * @param {number}  minConfidence  Min confidence for tradeable=true (default 20)
   * @returns {Promise<Object>} Map of pair → { keyword, articles, pos, mid, neg,
   *                            score, signal, confidence, tradeable, reason }
   *
   * @example
   * const report = await news.getCoinSentiment({ BTCUSD: 'Bitcoin' });
   * for (const [pair, data] of Object.entries(report)) {
   *   if (data.tradeable) console.log(`TRADE ${pair}: ${data.signal} conf=${data.confidence}`);
   *   else console.log(`SKIP ${pair}: ${data.reason}`);
   * }
   */
  async getCoinSentiment(coins = COIN_PAIRS, limit = 30, minArticles = 5, minConfidence = 20) {
    const BULLISH = new Set(['very_bullish', 'bullish']);
    const BEARISH = new Set(['very_bearish', 'bearish']);
    const entries = Object.entries(coins);

    const settled = await Promise.allSettled(
      entries.map(async ([pair, keyword]) => {
        const data = await this.analyze(limit, keyword);
        const articles = data.articles || [];
        const total = articles.length;

        if (total === 0) {
          return [pair, { keyword, articles: 0, pos: 0, mid: 0, neg: 0,
            score: 0, signal: 'neutral', confidence: 0, tradeable: false,
            reason: 'no articles found' }];
        }

        const pos = articles.filter(a => BULLISH.has(a.sentiment)).length;
        const neg = articles.filter(a => BEARISH.has(a.sentiment)).length;
        const mid = total - pos - neg;

        const posPct = (pos * 100) / total;
        const midPct = (mid * 100) / total;
        const negPct = (neg * 100) / total;

        const rawScore = articles.reduce((s, a) => s + (_SCORE_MAP[a.sentiment] ?? 0), 0);
        const score = Math.round((rawScore / total) * 10000) / 10000;

        const signal = (_SIGNAL_TIERS.find(([t]) => score >= t) ?? [null, 'neutral'])[1];

        const volumeWeight = Math.min(total / Math.max(minArticles, 1), 1.0);
        const pcts = [posPct, midPct, negPct].sort((a, b) => b - a);
        const marginWeight = Math.max(pcts[0] - pcts[1], 0) / 100;
        const confidence = Math.round(volumeWeight * marginWeight * 100 * 10) / 10;

        const reasons = [];
        if (total < minArticles)
          reasons.push(`only ${total} article${total === 1 ? '' : 's'} found (min ${minArticles})`);
        if (confidence < minConfidence)
          reasons.push(`confidence ${confidence.toFixed(1)} below threshold ${minConfidence}`);

        return [pair, {
          keyword,
          articles: total,
          pos:        Math.round(posPct * 10) / 10,
          mid:        Math.round(midPct * 10) / 10,
          neg:        Math.round(negPct * 10) / 10,
          score,
          signal,
          confidence,
          tradeable:  reasons.length === 0,
          reason:     reasons.join('; '),
        }];
      })
    );

    const result = {};
    for (let i = 0; i < entries.length; i++) {
      const [pair, keyword] = entries[i];
      const outcome = settled[i];
      if (outcome.status === 'fulfilled') {
        result[pair] = outcome.value[1];
      } else {
        result[pair] = { keyword, articles: 0, pos: 0, mid: 0, neg: 0,
          score: 0, signal: 'error', confidence: 0, tradeable: false,
          reason: String(outcome.reason) };
      }
    }
    return result;
  }
}

// Convenience functions
export async function getCryptoNews(limit = 10) {
  return new CryptoNews().getLatest(limit);
}

export async function searchCryptoNews(keywords, limit = 10) {
  return new CryptoNews().search(keywords, limit);
}

/**
 * Quick function to get per-coin sentiment with trade filtering.
 * @param {Object} coins Map of trading pair → keyword (default: COIN_PAIRS)
 * @param {number} limit Max articles per coin (default 30)
 * @param {number} minArticles Min articles for tradeable=true (default 5)
 * @param {number} minConfidence Min confidence for tradeable=true (default 20)
 */
export async function getCoinSentiment(coins = COIN_PAIRS, limit = 30, minArticles = 5, minConfidence = 20) {
  return new CryptoNews().getCoinSentiment(coins, limit, minArticles, minConfidence);
}

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CryptoNews, COIN_PAIRS, getCryptoNews, searchCryptoNews, getCoinSentiment };
}
