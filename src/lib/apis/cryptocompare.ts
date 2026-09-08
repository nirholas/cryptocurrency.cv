/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * CryptoCompare API Integration
 *
 * Comprehensive crypto market data including real-time prices, OHLCV,
 * news, social stats, trading signals, exchange volume, and on-chain metrics.
 *
 * Free tier: 100K calls/month. No card required.
 *
 * @see https://min-api.cryptocompare.com/documentation
 * @module lib/apis/cryptocompare
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://min-api.cryptocompare.com/data';
const API_KEY = process.env.CRYPTOCOMPARE_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface CCPrice {
  fsym: string;
  tsym: string;
  price: number;
  lastUpdate: number;
  open24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePct24h: number;
  volume24h: number;
  volume24hTo: number;
  marketCap: number;
  supply: number;
  totalVolume24h: number;
}

export interface CCOHLCV {
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volumefrom: number;
  volumeto: number;
  conversionType: string;
  conversionSymbol: string;
}

export interface CCNewsArticle {
  id: string;
  guid: string;
  publishedOn: number;
  imageurl: string;
  title: string;
  url: string;
  body: string;
  tags: string;
  categories: string;
  lang: string;
  upvotes: string;
  downvotes: string;
  source: string;
  sourceInfo: {
    name: string;
    img: string;
    lang: string;
  };
}

export interface CCSocialStats {
  coinId: number;
  symbol: string;
  name: string;
  twitter: {
    followers: number;
    following: number;
    lists: number;
    favourites: number;
    statuses: number;
    accountCreation: string;
    link: string;
  } | null;
  reddit: {
    subscribers: number;
    activeUsers: number;
    postsPerHour: number;
    commentsPerHour: number;
    postsPerDay: number;
    commentsPerDay: number;
    link: string;
  } | null;
  codeRepository: {
    stars: number;
    forks: number;
    subscribers: number;
    openIssues: number;
    closedIssues: number;
    contributors: number;
    link: string;
  } | null;
}

export interface CCTradingSignal {
  id: number;
  time: number;
  symbol: string;
  inOutVar: {
    sentiment: string;
    score: number;
  };
  largetxsVar: {
    sentiment: string;
    score: number;
  };
  addressesNetGrowth: {
    sentiment: string;
    score: number;
  };
  concentrationVar: {
    sentiment: string;
    score: number;
  };
}

export interface CCExchangeVolume {
  exchange: string;
  fromSymbol: string;
  toSymbol: string;
  volume24h: number;
  volume24hTo: number;
  lastUpdate: number;
}

export interface CCTopCoin {
  id: number;
  name: string;
  symbol: string;
  fullName: string;
  imageUrl: string;
  price: number;
  marketCap: number;
  totalVolume24h: number;
  changePct24h: number;
  supply: number;
  maxSupply: number | null;
}

export interface CCBlockchainData {
  id: number;
  symbol: string;
  time: number;
  blockNumber: number;
  blockTime: number;
  hashrate: number;
  difficulty: number;
  transactionCount: number;
  averageTransactionValue: number;
  activeAddresses: number;
  newAddresses: number;
  largeTransactionCount: number;
  averageFee: number;
}

export interface CCOrderBookEntry {
  price: number;
  quantity: number;
}

export interface CCOrderBook {
  exchange: string;
  pair: string;
  bids: CCOrderBookEntry[];
  asks: CCOrderBookEntry[];
  timestamp: number;
}

// =============================================================================
// Core Fetch Helper
// =============================================================================

async function ccFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T | null> {
  try {
    const url = new URL(`${BASE_URL}${path}`);
    if (API_KEY) {
      url.searchParams.set('api_key', API_KEY);
    }
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await resilientFetchResponse(url.toString(), {
      service: 'cryptocompare', timeoutMs: 8000, retries: 1,
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error(`CryptoCompare API error ${res.status}: ${path}`);
      return null;
    }

    const json = await res.json();
    if (json.Response === 'Error') {
      console.error(`CryptoCompare error: ${json.Message}`);
      return null;
    }

    return json as T;
  } catch (err) {
    console.error('CryptoCompare request failed:', err);
    return null;
  }
}

// =============================================================================
// Price Data
// =============================================================================

/**
 * Get real-time price for one or more symbols.
 */
export async function getPrice(
  fsyms: string[],
  tsyms: string[] = ['USD'],
): Promise<Record<string, Record<string, number>> | null> {
  return ccFetch<Record<string, Record<string, number>>>('/pricemulti', {
    fsyms: fsyms.join(','),
    tsyms: tsyms.join(','),
  });
}

/**
 * Get full price data including 24h change, volume, market cap.
 */
export async function getPriceMultiFull(
  fsyms: string[],
  tsyms: string[] = ['USD'],
): Promise<Record<string, CCPrice> | null> {
  const data = await ccFetch<{
    RAW: Record<string, Record<string, {
      PRICE: number; LASTUPDATE: number; OPEN24HOUR: number;
      HIGH24HOUR: number; LOW24HOUR: number; CHANGE24HOUR: number;
      CHANGEPCT24HOUR: number; VOLUME24HOUR: number; VOLUME24HOURTO: number;
      MKTCAP: number; SUPPLY: number; TOTALVOLUME24H: number;
    }>>;
  }>('/pricemultifull', {
    fsyms: fsyms.join(','),
    tsyms: tsyms.join(','),
  });

  if (!data?.RAW) return null;

  const result: Record<string, CCPrice> = {};
  for (const [sym, tsymData] of Object.entries(data.RAW)) {
    const usd = tsymData.USD || tsymData[tsyms[0]];
    if (usd) {
      result[sym] = {
        fsym: sym,
        tsym: tsyms[0],
        price: usd.PRICE,
        lastUpdate: usd.LASTUPDATE,
        open24h: usd.OPEN24HOUR,
        high24h: usd.HIGH24HOUR,
        low24h: usd.LOW24HOUR,
        change24h: usd.CHANGE24HOUR,
        changePct24h: usd.CHANGEPCT24HOUR,
        volume24h: usd.VOLUME24HOUR,
        volume24hTo: usd.VOLUME24HOURTO,
        marketCap: usd.MKTCAP,
        supply: usd.SUPPLY,
        totalVolume24h: usd.TOTALVOLUME24H,
      };
    }
  }
  return result;
}

// =============================================================================
// OHLCV Historical Data
// =============================================================================

/**
 * Get historical OHLCV data by interval.
 */
export async function getOHLCV(
  fsym: string,
  tsym: string = 'USD',
  options?: {
    interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
    limit?: number;
    toTs?: number;
    exchange?: string;
  },
): Promise<CCOHLCV[]> {
  const interval = options?.interval || '1d';

  let endpoint: string;
  const params: Record<string, string> = {
    fsym,
    tsym,
    limit: String(options?.limit || 100),
  };

  if (options?.toTs) params.toTs = String(options.toTs);
  if (options?.exchange) params.e = options.exchange;

  switch (interval) {
    case '1m':
      endpoint = '/v2/histominute';
      break;
    case '5m':
      endpoint = '/v2/histominute';
      params.aggregate = '5';
      break;
    case '15m':
      endpoint = '/v2/histominute';
      params.aggregate = '15';
      break;
    case '30m':
      endpoint = '/v2/histominute';
      params.aggregate = '30';
      break;
    case '1h':
      endpoint = '/v2/histohour';
      break;
    case '4h':
      endpoint = '/v2/histohour';
      params.aggregate = '4';
      break;
    case '1d':
      endpoint = '/v2/histoday';
      break;
    case '1w':
      endpoint = '/v2/histoday';
      params.aggregate = '7';
      break;
    default:
      endpoint = '/v2/histoday';
  }

  const data = await ccFetch<{
    Data: { Data: CCOHLCV[] };
  }>(endpoint, params);

  return data?.Data?.Data || [];
}

// =============================================================================
// News Feed
// =============================================================================

/**
 * Get latest crypto news from CryptoCompare.
 */
export async function getNews(options?: {
  categories?: string[];
  feeds?: string[];
  lang?: string;
  sortOrder?: 'latest' | 'popular';
}): Promise<CCNewsArticle[]> {
  const params: Record<string, string> = {
    lang: options?.lang || 'EN',
    sortOrder: options?.sortOrder || 'latest',
  };

  if (options?.categories?.length) {
    params.categories = options.categories.join(',');
  }
  if (options?.feeds?.length) {
    params.feeds = options.feeds.join(',');
  }

  const data = await ccFetch<{ Data: CCNewsArticle[] }>('/v2/news/', params);
  return data?.Data || [];
}

/**
 * Get available news categories and feeds.
 */
export async function getNewsCategories(): Promise<{
  categories: string[];
  feeds: string[];
} | null> {
  const [cats, feeds] = await Promise.all([
    ccFetch<string[]>('/news/categories'),
    ccFetch<{ key: string; name: string }[]>('/news/feeds'),
  ]);
  return {
    categories: Array.isArray(cats) ? cats : [],
    feeds: Array.isArray(feeds) ? feeds.map(f => f.key) : [],
  };
}

// =============================================================================
// Social Stats
// =============================================================================

/**
 * Get social media stats for a coin (Twitter, Reddit, GitHub).
 */
export async function getSocialStats(coinId: number): Promise<CCSocialStats | null> {
  const data = await ccFetch<{
    Data: {
      General: { Name: string; CoinName: string; Id: number };
      Twitter?: {
        followers: number; following: number; lists: number;
        favourites: number; statuses: number; account_creation: string; link: string;
      };
      Reddit?: {
        subscribers: number; active_users: number; posts_per_hour: number;
        comments_per_hour: number; posts_per_day: number; comments_per_day: number; link: string;
      };
      CodeRepository?: {
        List: Array<{
          stars: number; forks: number; subscribers: number;
          open_total_issues: number; closed_total_issues: number;
          contributors: number; url: string;
        }>;
      };
    };
  }>('/social/coin/latest', { coinId: String(coinId) });

  if (!data?.Data) return null;
  const d = data.Data;

  const repo = d.CodeRepository?.List?.[0];

  return {
    coinId: d.General.Id,
    symbol: d.General.Name,
    name: d.General.CoinName,
    twitter: d.Twitter ? {
      followers: d.Twitter.followers,
      following: d.Twitter.following,
      lists: d.Twitter.lists,
      favourites: d.Twitter.favourites,
      statuses: d.Twitter.statuses,
      accountCreation: d.Twitter.account_creation,
      link: d.Twitter.link,
    } : null,
    reddit: d.Reddit ? {
      subscribers: d.Reddit.subscribers,
      activeUsers: d.Reddit.active_users,
      postsPerHour: d.Reddit.posts_per_hour,
      commentsPerHour: d.Reddit.comments_per_hour,
      postsPerDay: d.Reddit.posts_per_day,
      commentsPerDay: d.Reddit.comments_per_day,
      link: d.Reddit.link,
    } : null,
    codeRepository: repo ? {
      stars: repo.stars,
      forks: repo.forks,
      subscribers: repo.subscribers,
      openIssues: repo.open_total_issues,
      closedIssues: repo.closed_total_issues,
      contributors: repo.contributors,
      link: repo.url,
    } : null,
  };
}

// =============================================================================
// Trading Signals
// =============================================================================

/**
 * Get on-chain trading signals (IntoTheBlock data via CryptoCompare).
 */
export async function getTradingSignals(fsym: string): Promise<CCTradingSignal | null> {
  const data = await ccFetch<{ Data: CCTradingSignal }>('/tradingsignals/intotheblock/latest', {
    fsym,
  });
  return data?.Data || null;
}

// =============================================================================
// Exchange Data
// =============================================================================

/**
 * Get top exchanges by volume for a trading pair.
 */
export async function getTopExchangesByPair(
  fsym: string,
  tsym: string = 'USD',
  limit: number = 20,
): Promise<CCExchangeVolume[]> {
  const data = await ccFetch<{
    Data: {
      Exchanges: Array<{
        exchange: string;
        fromSymbol: string;
        toSymbol: string;
        volume24h: number;
        volume24hTo: number;
        lastUpdate: number;
      }>;
    };
  }>('/top/exchanges/full', {
    fsym,
    tsym,
    limit: String(limit),
  });

  return (data?.Data?.Exchanges || []).map(e => ({
    exchange: e.exchange,
    fromSymbol: e.fromSymbol,
    toSymbol: e.toSymbol,
    volume24h: e.volume24h,
    volume24hTo: e.volume24hTo,
    lastUpdate: e.lastUpdate,
  }));
}

// =============================================================================
// Top Coins
// =============================================================================

/**
 * Get top coins by market cap.
 */
export async function getTopByMarketCap(
  tsym: string = 'USD',
  limit: number = 50,
): Promise<CCTopCoin[]> {
  const data = await ccFetch<{
    Data: Array<{
      CoinInfo: {
        Id: string; Name: string; FullName: string; ImageUrl: string;
        MaxSupply: number;
      };
      RAW?: {
        USD?: {
          PRICE: number; MKTCAP: number; TOTALVOLUME24H: number;
          CHANGEPCT24HOUR: number; SUPPLY: number;
        };
      };
    }>;
  }>('/top/mktcapfull', { tsym, limit: String(limit) });

  if (!data?.Data) return [];

  return data.Data.map(d => {
    const usd = d.RAW?.USD;
    return {
      id: parseInt(d.CoinInfo.Id, 10),
      name: d.CoinInfo.FullName,
      symbol: d.CoinInfo.Name,
      fullName: d.CoinInfo.FullName,
      imageUrl: `https://www.cryptocompare.com${d.CoinInfo.ImageUrl}`,
      price: usd?.PRICE || 0,
      marketCap: usd?.MKTCAP || 0,
      totalVolume24h: usd?.TOTALVOLUME24H || 0,
      changePct24h: usd?.CHANGEPCT24HOUR || 0,
      supply: usd?.SUPPLY || 0,
      maxSupply: d.CoinInfo.MaxSupply || null,
    };
  });
}

/**
 * Get top coins by 24h trading volume.
 */
export async function getTopByVolume(
  tsym: string = 'USD',
  limit: number = 50,
): Promise<CCTopCoin[]> {
  const data = await ccFetch<{
    Data: Array<{
      CoinInfo: {
        Id: string; Name: string; FullName: string; ImageUrl: string;
        MaxSupply: number;
      };
      RAW?: {
        USD?: {
          PRICE: number; MKTCAP: number; TOTALVOLUME24H: number;
          CHANGEPCT24HOUR: number; SUPPLY: number;
        };
      };
    }>;
  }>('/top/totalvolfull', { tsym, limit: String(limit) });

  if (!data?.Data) return [];

  return data.Data.map(d => {
    const usd = d.RAW?.USD;
    return {
      id: parseInt(d.CoinInfo.Id, 10),
      name: d.CoinInfo.FullName,
      symbol: d.CoinInfo.Name,
      fullName: d.CoinInfo.FullName,
      imageUrl: `https://www.cryptocompare.com${d.CoinInfo.ImageUrl}`,
      price: usd?.PRICE || 0,
      marketCap: usd?.MKTCAP || 0,
      totalVolume24h: usd?.TOTALVOLUME24H || 0,
      changePct24h: usd?.CHANGEPCT24HOUR || 0,
      supply: usd?.SUPPLY || 0,
      maxSupply: d.CoinInfo.MaxSupply || null,
    };
  });
}

// =============================================================================
// Blockchain / On-Chain Data
// =============================================================================

/**
 * Get blockchain daily metrics (tx count, active addresses, hashrate, etc.)
 */
export async function getBlockchainHistory(
  fsym: string,
  limit: number = 30,
): Promise<CCBlockchainData[]> {
  const data = await ccFetch<{
    Data: {
      Data: Array<{
        id: number; symbol: string; time: number;
        block_number: number; block_time: number;
        hashrate: number; difficulty: number;
        transaction_count: number; average_transaction_value: number;
        active_addresses: number; new_addresses: number;
        large_transaction_count: number; average_fee_per_transaction: number;
      }>;
    };
  }>('/blockchain/histo/day', {
    fsym,
    limit: String(limit),
  });

  return (data?.Data?.Data || []).map(d => ({
    id: d.id,
    symbol: d.symbol,
    time: d.time,
    blockNumber: d.block_number,
    blockTime: d.block_time,
    hashrate: d.hashrate,
    difficulty: d.difficulty,
    transactionCount: d.transaction_count,
    averageTransactionValue: d.average_transaction_value,
    activeAddresses: d.active_addresses,
    newAddresses: d.new_addresses,
    largeTransactionCount: d.large_transaction_count,
    averageFee: d.average_fee_per_transaction,
  }));
}

// =============================================================================
// Order Book
// =============================================================================

/**
 * Get L2 order book snapshot for a pair on an exchange.
 */
export async function getOrderBook(
  fsym: string,
  tsym: string = 'USD',
  exchange: string = 'coinbase',
): Promise<CCOrderBook | null> {
  const data = await ccFetch<{
    Data: {
      BID: Array<{ P: number; Q: number }>;
      ASK: Array<{ P: number; Q: number }>;
    };
  }>('/ob/l2/snapshot', {
    fsym,
    tsym,
    e: exchange,
  });

  if (!data?.Data) return null;

  return {
    exchange,
    pair: `${fsym}/${tsym}`,
    bids: (data.Data.BID || []).map(b => ({ price: b.P, quantity: b.Q })),
    asks: (data.Data.ASK || []).map(a => ({ price: a.P, quantity: a.Q })),
    timestamp: Date.now(),
  };
}

// =============================================================================
// Comprehensive Summary
// =============================================================================

/**
 * Get a comprehensive CryptoCompare market overview.
 */
export async function getMarketOverview(): Promise<{
  topByMarketCap: CCTopCoin[];
  topByVolume: CCTopCoin[];
  latestNews: CCNewsArticle[];
  btcSignals: CCTradingSignal | null;
  timestamp: string;
}> {
  const [topMcap, topVol, news, btcSignals] = await Promise.allSettled([
    getTopByMarketCap('USD', 20),
    getTopByVolume('USD', 20),
    getNews({ sortOrder: 'latest' }),
    getTradingSignals('BTC'),
  ]);

  return {
    topByMarketCap: topMcap.status === 'fulfilled' ? topMcap.value : [],
    topByVolume: topVol.status === 'fulfilled' ? topVol.value : [],
    latestNews: (news.status === 'fulfilled' ? news.value : []).slice(0, 20),
    btcSignals: btcSignals.status === 'fulfilled' ? btcSignals.value : null,
    timestamp: new Date().toISOString(),
  };
}
