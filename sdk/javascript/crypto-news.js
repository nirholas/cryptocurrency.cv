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
}

// Convenience functions
export async function getCryptoNews(limit = 10) {
  return new CryptoNews().getLatest(limit);
}

export async function searchCryptoNews(keywords, limit = 10) {
  return new CryptoNews().search(keywords, limit);
}

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CryptoNews, getCryptoNews, searchCryptoNews };
}
