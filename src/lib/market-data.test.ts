/**
 * @fileoverview Unit tests for market-data.ts
 * Tests the Market Data API layer functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original fetch
const originalFetch = global.fetch;

// Import types first (these don't depend on mocks)
import type { 
  HistoricalData,
  OHLCData,
  TickerData,
  Exchange,
  ExchangeDetails,
  Category,
  TokenPrice,
  SearchResult,
  CompareData,
  CoinListItem,
  DeveloperData,
  CommunityData,
  GlobalDeFi,
  DerivativeTicker,
} from './market-data';

describe('market-data', () => {
  // ==========================================================================
  // CACHE TTL CONFIGURATION TESTS (no fetch needed)
  // ==========================================================================
  
  describe('CACHE_TTL configuration', () => {
    it('should have appropriate TTL values', async () => {
      const { CACHE_TTL } = await import('./market-data');
      expect(CACHE_TTL.prices).toBe(30);
      expect(CACHE_TTL.historical_1d).toBe(60);
      expect(CACHE_TTL.historical_7d).toBe(300);
      expect(CACHE_TTL.historical_30d).toBe(900);
      expect(CACHE_TTL.tickers).toBe(120);
      expect(CACHE_TTL.static).toBe(3600);
      expect(CACHE_TTL.search).toBe(300);
      expect(CACHE_TTL.social).toBe(1800);
      expect(CACHE_TTL.global).toBe(300);
    });

    it('should have increasing TTLs for longer historical periods', async () => {
      const { CACHE_TTL } = await import('./market-data');
      expect(CACHE_TTL.historical_1d).toBeLessThan(CACHE_TTL.historical_7d);
      expect(CACHE_TTL.historical_7d).toBeLessThan(CACHE_TTL.historical_30d);
      expect(CACHE_TTL.historical_30d).toBeLessThan(CACHE_TTL.historical_90d);
    });
  });

  // ==========================================================================
  // UTILITY FUNCTION TESTS (no fetch needed)
  // ==========================================================================

  describe('formatPrice', () => {
    it('should format large prices without decimals', async () => {
      const { formatPrice } = await import('./market-data');
      expect(formatPrice(50000)).toBe('$50,000');
      expect(formatPrice(1000000)).toBe('$1,000,000');
    });

    it('should format medium prices with 2 decimals', async () => {
      const { formatPrice } = await import('./market-data');
      expect(formatPrice(100.5)).toBe('$100.50');
      expect(formatPrice(1.99)).toBe('$1.99');
    });

    it('should format small prices with more decimals', async () => {
      const { formatPrice } = await import('./market-data');
      expect(formatPrice(0.00001234)).toMatch(/\$0\.0000\d+/);
    });

    it('should handle null/undefined', async () => {
      const { formatPrice } = await import('./market-data');
      expect(formatPrice(null)).toBe('$0.00');
      expect(formatPrice(undefined)).toBe('$0.00');
    });
  });

  describe('formatNumber', () => {
    it('should format trillions', async () => {
      const { formatNumber } = await import('./market-data');
      expect(formatNumber(1500000000000)).toBe('1.50T');
    });

    it('should format billions', async () => {
      const { formatNumber } = await import('./market-data');
      expect(formatNumber(1500000000)).toBe('1.50B');
    });

    it('should format millions', async () => {
      const { formatNumber } = await import('./market-data');
      expect(formatNumber(1500000)).toBe('1.50M');
    });

    it('should format thousands', async () => {
      const { formatNumber } = await import('./market-data');
      expect(formatNumber(1500)).toBe('1.50K');
    });

    it('should format small numbers', async () => {
      const { formatNumber } = await import('./market-data');
      expect(formatNumber(123)).toBe('123.00');
    });

    it('should handle null/undefined', async () => {
      const { formatNumber } = await import('./market-data');
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
    });
  });

  describe('formatPercent', () => {
    it('should format positive percentages with + sign', async () => {
      const { formatPercent } = await import('./market-data');
      expect(formatPercent(5.5)).toBe('+5.50%');
    });

    it('should format negative percentages', async () => {
      const { formatPercent } = await import('./market-data');
      expect(formatPercent(-3.2)).toBe('-3.20%');
    });

    it('should format zero', async () => {
      const { formatPercent } = await import('./market-data');
      expect(formatPercent(0)).toBe('+0.00%');
    });

    it('should handle null/undefined', async () => {
      const { formatPercent } = await import('./market-data');
      expect(formatPercent(null)).toBe('0.00%');
      expect(formatPercent(undefined)).toBe('0.00%');
    });
  });

  describe('getFearGreedColor', () => {
    it('should return red for extreme fear', async () => {
      const { getFearGreedColor } = await import('./market-data');
      expect(getFearGreedColor(10)).toBe('text-red-500');
      expect(getFearGreedColor(25)).toBe('text-red-500');
    });

    it('should return orange for fear', async () => {
      const { getFearGreedColor } = await import('./market-data');
      expect(getFearGreedColor(30)).toBe('text-orange-500');
      expect(getFearGreedColor(45)).toBe('text-orange-500');
    });

    it('should return yellow for neutral', async () => {
      const { getFearGreedColor } = await import('./market-data');
      expect(getFearGreedColor(50)).toBe('text-yellow-500');
      expect(getFearGreedColor(55)).toBe('text-yellow-500');
    });

    it('should return lime for greed', async () => {
      const { getFearGreedColor } = await import('./market-data');
      expect(getFearGreedColor(60)).toBe('text-lime-500');
      expect(getFearGreedColor(75)).toBe('text-lime-500');
    });

    it('should return green for extreme greed', async () => {
      const { getFearGreedColor } = await import('./market-data');
      expect(getFearGreedColor(80)).toBe('text-green-500');
      expect(getFearGreedColor(100)).toBe('text-green-500');
    });
  });

  // ==========================================================================
  // ERROR CLASS TESTS
  // ==========================================================================

  describe('MarketDataError', () => {
    it('should create error with status code', async () => {
      const { MarketDataError } = await import('./market-data');
      const error = new MarketDataError('Rate limited', 429, true);
      
      expect(error.message).toBe('Rate limited');
      expect(error.statusCode).toBe(429);
      expect(error.isRateLimited).toBe(true);
      expect(error.name).toBe('MarketDataError');
    });

    it('should create error without rate limit flag', async () => {
      const { MarketDataError } = await import('./market-data');
      const error = new MarketDataError('Not found', 404);
      
      expect(error.statusCode).toBe(404);
      expect(error.isRateLimited).toBe(false);
    });
  });

  // ==========================================================================
  // TYPE STRUCTURE TESTS
  // ==========================================================================

  describe('Type structures', () => {
    it('should validate HistoricalData structure', () => {
      const data: HistoricalData = {
        prices: [[1700000000000, 50000]],
        market_caps: [[1700000000000, 1000000000000]],
        total_volumes: [[1700000000000, 50000000000]],
      };
      
      expect(data.prices).toHaveLength(1);
      expect(data.market_caps).toHaveLength(1);
      expect(data.total_volumes).toHaveLength(1);
      expect(data.prices[0]).toHaveLength(2);
    });

    it('should validate OHLCData structure', () => {
      const ohlc: OHLCData = {
        timestamp: 1700000000000,
        open: 50000,
        high: 51000,
        low: 49500,
        close: 50500,
      };
      
      expect(ohlc).toHaveProperty('timestamp');
      expect(ohlc).toHaveProperty('open');
      expect(ohlc).toHaveProperty('high');
      expect(ohlc).toHaveProperty('low');
      expect(ohlc).toHaveProperty('close');
    });

    it('should validate Exchange structure', () => {
      const exchange: Exchange = {
        id: 'binance',
        name: 'Binance',
        year_established: 2017,
        country: 'Cayman Islands',
        description: 'Largest crypto exchange',
        url: 'https://binance.com',
        image: 'https://binance.com/logo.png',
        has_trading_incentive: false,
        trust_score: 10,
        trust_score_rank: 1,
        trade_volume_24h_btc: 500000,
        trade_volume_24h_btc_normalized: 450000,
      };
      
      expect(exchange.id).toBe('binance');
      expect(exchange.trust_score).toBe(10);
    });

    it('should validate Category structure', () => {
      const category: Category = {
        category_id: 'decentralized-finance-defi',
        name: 'DeFi',
        market_cap: 100000000000,
        market_cap_change_24h: 2.5,
        content: 'Decentralized Finance protocols',
        top_3_coins: ['uniswap.png', 'aave.png', 'maker.png'],
        volume_24h: 5000000000,
        updated_at: '2024-01-15T10:00:00Z',
      };
      
      expect(category.category_id).toBe('decentralized-finance-defi');
      expect(category.top_3_coins).toHaveLength(3);
    });

    it('should validate DeveloperData structure', () => {
      const devData: DeveloperData = {
        forks: 1000,
        stars: 5000,
        subscribers: 2000,
        total_issues: 500,
        closed_issues: 450,
        pull_requests_merged: 300,
        pull_request_contributors: 50,
        commit_count_4_weeks: 100,
        last_4_weeks_commit_activity_series: [10, 15, 20, 25],
        code_additions_deletions_4_weeks: { additions: 5000, deletions: 1000 },
      };
      
      expect(devData.forks).toBe(1000);
      expect(devData.last_4_weeks_commit_activity_series).toHaveLength(4);
    });

    it('should validate CommunityData structure', () => {
      const communityData: CommunityData = {
        twitter_followers: 5000000,
        reddit_subscribers: 1000000,
        reddit_average_posts_48h: 50,
        reddit_average_comments_48h: 500,
        reddit_accounts_active_48h: 10000,
        telegram_channel_user_count: 100000,
        facebook_likes: null,
      };
      
      expect(communityData.twitter_followers).toBe(5000000);
      expect(communityData.facebook_likes).toBeNull();
    });

    it('should validate SearchResult structure', () => {
      const result: SearchResult = {
        coins: [{ id: 'bitcoin', name: 'Bitcoin', api_symbol: 'btc', symbol: 'btc', market_cap_rank: 1, thumb: '', large: '' }],
        exchanges: [{ id: 'binance', name: 'Binance', market_type: 'spot', thumb: '', large: '' }],
        categories: [{ id: 1, name: 'DeFi' }],
        nfts: [],
      };
      
      expect(result.coins).toHaveLength(1);
      expect(result.exchanges).toHaveLength(1);
    });

    it('should validate GlobalDeFi structure', () => {
      const defi: GlobalDeFi = {
        defi_market_cap: '100000000000',
        eth_market_cap: '300000000000',
        defi_to_eth_ratio: '33.33',
        trading_volume_24h: '5000000000',
        defi_dominance: '5.5',
        top_coin_name: 'Uniswap',
        top_coin_defi_dominance: 15.5,
      };
      
      expect(defi.top_coin_name).toBe('Uniswap');
    });

    it('should validate DerivativeTicker structure', () => {
      const ticker: DerivativeTicker = {
        market: 'Binance',
        symbol: 'BTCUSDT',
        index_id: 'BTC',
        price: '50000',
        price_percentage_change_24h: 2.5,
        contract_type: 'perpetual',
        index: 50000,
        basis: 0.01,
        spread: 0.001,
        funding_rate: 0.0001,
        open_interest: 1000000000,
        volume_24h: 5000000000,
        last_traded_at: 1700000000,
        expired_at: null,
      };
      
      expect(ticker.contract_type).toBe('perpetual');
    });
  });

  // ==========================================================================
  // SEARCH INPUT VALIDATION
  // ==========================================================================

  describe('searchCoins input validation', () => {
    it('should return empty results for short queries', async () => {
      const { searchCoins } = await import('./market-data');
      const result = await searchCoins('a');

      expect(result.coins).toEqual([]);
      expect(result.exchanges).toEqual([]);
      expect(result.categories).toEqual([]);
      expect(result.nfts).toEqual([]);
    });

    it('should return empty results for empty query', async () => {
      const { searchCoins } = await import('./market-data');
      const result = await searchCoins('');

      expect(result.coins).toEqual([]);
    });
  });

  describe('compareCoins input validation', () => {
    it('should return empty array for empty input', async () => {
      const { compareCoins } = await import('./market-data');
      const result = await compareCoins([]);

      expect(result.coins).toEqual([]);
      expect(result.comparison_date).toBeDefined();
    });
  });
});

