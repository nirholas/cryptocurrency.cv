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
 * NFT Market APIs Integration
 * 
 * Multi-source NFT market data from OpenSea and Reservoir Protocol.
 * Collection stats, floor prices, sales volume, and trending data.
 * 
 * @see https://docs.opensea.io/
 * @see https://docs.reservoir.tools/
 * @module lib/apis/nft-markets
 */

import { resilientFetchResponse } from '@/lib/resilient-fetch';

const OPENSEA_URL = 'https://api.opensea.io/api/v2';
const RESERVOIR_URL = 'https://api.reservoir.tools';
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || '';
const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface NFTCollection {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  bannerImageUrl?: string;
  externalUrl?: string;
  twitterUsername?: string;
  discordUrl?: string;
  contractAddress: string;
  chain: string;
  createdDate: string;
  stats: CollectionStats;
  verified: boolean;
}

export interface CollectionStats {
  floorPrice: number;
  floorPriceChange24h: number;
  floorPriceChange7d: number;
  volume24h: number;
  volumeChange24h: number;
  volume7d: number;
  volumeTotal: number;
  sales24h: number;
  salesChange24h: number;
  averagePrice24h: number;
  numOwners: number;
  totalSupply: number;
  listedCount: number;
  marketCap: number;
}

export interface NFTSale {
  id: string;
  tokenId: string;
  collectionSlug: string;
  collectionName: string;
  price: number;
  currency: string;
  priceUsd: number;
  marketplace: string;
  seller: string;
  buyer: string;
  timestamp: string;
  txHash: string;
}

export interface TrendingCollection {
  rank: number;
  collection: NFTCollection;
  volume24h: number;
  volumeChange: number;
  salesCount: number;
  trendScore: number;
}

export interface NFTMarketOverview {
  totalVolume24h: number;
  totalVolume7d: number;
  totalSales24h: number;
  averageFloorPrice: number;
  topCollections: TrendingCollection[];
  recentSales: NFTSale[];
  volumeByChain: Record<string, number>;
  volumeByMarketplace: Record<string, number>;
  timestamp: string;
}

export interface CollectionActivity {
  sales: NFTSale[];
  bids: Array<{
    tokenId: string;
    price: number;
    currency: string;
    bidder: string;
    timestamp: string;
    expiration: string;
  }>;
  listings: Array<{
    tokenId: string;
    price: number;
    currency: string;
    seller: string;
    timestamp: string;
    expiration?: string;
    marketplace: string;
  }>;
  transfers: Array<{
    tokenId: string;
    from: string;
    to: string;
    timestamp: string;
    txHash: string;
  }>;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from OpenSea API
 */
async function openseaFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  if (!OPENSEA_API_KEY) {
    console.warn('OpenSea API key not configured');
    return null;
  }

  try {
    const url = new URL(`${OPENSEA_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await resilientFetchResponse(url.toString(), {
      service: 'opensea', timeoutMs: 8000, retries: 1,
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`OpenSea API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('OpenSea API request failed:', error);
    return null;
  }
}

/**
 * Fetch from Reservoir API
 */
async function reservoirFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${RESERVOIR_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (RESERVOIR_API_KEY) {
      headers['x-api-key'] = RESERVOIR_API_KEY;
    }

    const response = await resilientFetchResponse(url.toString(), {
      service: 'reservoir', timeoutMs: 8000, retries: 1,
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Reservoir API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Reservoir API request failed:', error);
    return null;
  }
}

/**
 * Get collection details from OpenSea
 */
export async function getCollection(slug: string): Promise<NFTCollection | null> {
  const data = await openseaFetch<{
    collection: {
      collection: string;
      name: string;
      description: string;
      image_url: string;
      banner_image_url: string;
      external_url: string;
      twitter_username: string;
      discord_url: string;
      contracts: Array<{ address: string; chain: string }>;
      created_date: string;
      safelist_status: string;
    };
  }>(`/collections/${slug}`);

  if (!data?.collection) return null;

  const stats = await getCollectionStats(slug);

  const c = data.collection;
  return {
    slug: c.collection,
    name: c.name,
    description: c.description,
    imageUrl: c.image_url,
    bannerImageUrl: c.banner_image_url,
    externalUrl: c.external_url,
    twitterUsername: c.twitter_username,
    discordUrl: c.discord_url,
    contractAddress: c.contracts?.[0]?.address || '',
    chain: c.contracts?.[0]?.chain || 'ethereum',
    createdDate: c.created_date,
    stats: stats || getEmptyStats(),
    verified: c.safelist_status === 'verified',
  };
}

/**
 * Get collection stats from Reservoir (more reliable)
 */
export async function getCollectionStats(slugOrAddress: string): Promise<CollectionStats | null> {
  // Try Reservoir first
  const data = await reservoirFetch<{
    collections: Array<{
      id: string;
      slug: string;
      name: string;
      floorAsk: { price: { amount: { native: number } } };
      volume: {
        '1day': number;
        '7day': number;
        allTime: number;
      };
      volumeChange: { '1day': number; '7day': number };
      floorSaleChange: { '1day': number; '7day': number };
      salesCount: { '1day': number };
      ownerCount: number;
      tokenCount: string;
      onSaleCount: string;
    }>;
  }>('/collections/v6', { slug: slugOrAddress });

  if (!data?.collections?.[0]) {
    // Try by contract address
    const byContract = await reservoirFetch<typeof data>('/collections/v6', { 
      contract: slugOrAddress 
    });
    if (!byContract?.collections?.[0]) return null;
    
    const c = byContract.collections[0];
    return mapReservoirStats(c);
  }

  const c = data.collections[0];
  return mapReservoirStats(c);
}

function mapReservoirStats(c: {
  floorAsk?: { price?: { amount?: { native?: number } } };
  volume?: { '1day'?: number; '7day'?: number; allTime?: number };
  volumeChange?: { '1day'?: number; '7day'?: number };
  floorSaleChange?: { '1day'?: number; '7day'?: number };
  salesCount?: { '1day'?: number };
  ownerCount?: number;
  tokenCount?: string;
  onSaleCount?: string;
}): CollectionStats {
  const floorPrice = c.floorAsk?.price?.amount?.native || 0;
  const volume24h = c.volume?.['1day'] || 0;
  const totalSupply = parseInt(c.tokenCount || '0');

  return {
    floorPrice,
    floorPriceChange24h: c.floorSaleChange?.['1day'] || 0,
    floorPriceChange7d: c.floorSaleChange?.['7day'] || 0,
    volume24h,
    volumeChange24h: c.volumeChange?.['1day'] || 0,
    volume7d: c.volume?.['7day'] || 0,
    volumeTotal: c.volume?.allTime || 0,
    sales24h: c.salesCount?.['1day'] || 0,
    salesChange24h: 0,
    averagePrice24h: volume24h / Math.max(c.salesCount?.['1day'] || 1, 1),
    numOwners: c.ownerCount || 0,
    totalSupply,
    listedCount: parseInt(c.onSaleCount || '0'),
    marketCap: floorPrice * totalSupply,
  };
}

function getEmptyStats(): CollectionStats {
  return {
    floorPrice: 0,
    floorPriceChange24h: 0,
    floorPriceChange7d: 0,
    volume24h: 0,
    volumeChange24h: 0,
    volume7d: 0,
    volumeTotal: 0,
    sales24h: 0,
    salesChange24h: 0,
    averagePrice24h: 0,
    numOwners: 0,
    totalSupply: 0,
    listedCount: 0,
    marketCap: 0,
  };
}

/**
 * Get trending collections
 */
export async function getTrendingCollections(
  period: '1h' | '6h' | '24h' | '7d' = '24h',
  limit: number = 25
): Promise<TrendingCollection[]> {
  const data = await reservoirFetch<{
    collections: Array<{
      id: string;
      slug: string;
      name: string;
      image: string;
      primaryContract: string;
      floorAsk: { price: { amount: { native: number } } };
      volume: { [key: string]: number };
      volumeChange: { [key: string]: number };
      salesCount: { [key: string]: number };
      ownerCount: number;
      tokenCount: string;
      onSaleCount: string;
    }>;
  }>('/collections/trending/v1', {
    period,
    limit: String(limit),
  });

  if (!data?.collections) return [];

  return data.collections.map((c, index) => ({
    rank: index + 1,
    collection: {
      slug: c.slug,
      name: c.name,
      description: '',
      imageUrl: c.image,
      contractAddress: c.primaryContract,
      chain: 'ethereum',
      createdDate: '',
      stats: {
        floorPrice: c.floorAsk?.price?.amount?.native || 0,
        floorPriceChange24h: 0,
        floorPriceChange7d: 0,
        volume24h: c.volume?.['1day'] || 0,
        volumeChange24h: c.volumeChange?.['1day'] || 0,
        volume7d: c.volume?.['7day'] || 0,
        volumeTotal: 0,
        sales24h: c.salesCount?.['1day'] || 0,
        salesChange24h: 0,
        averagePrice24h: 0,
        numOwners: c.ownerCount || 0,
        totalSupply: parseInt(c.tokenCount || '0'),
        listedCount: parseInt(c.onSaleCount || '0'),
        marketCap: 0,
      },
      verified: true,
    },
    volume24h: c.volume?.[period === '24h' ? '1day' : period] || 0,
    volumeChange: c.volumeChange?.[period === '24h' ? '1day' : period] || 0,
    salesCount: c.salesCount?.[period === '24h' ? '1day' : period] || 0,
    trendScore: (c.volumeChange?.['1day'] || 0) * 0.5 + (c.salesCount?.['1day'] || 0) * 0.3,
  }));
}

/**
 * Get recent sales across all collections
 */
export async function getRecentSales(limit: number = 50): Promise<NFTSale[]> {
  const data = await reservoirFetch<{
    sales: Array<{
      id: string;
      token: {
        tokenId: string;
        collection: { id: string; name: string };
      };
      price: { amount: { native: number; usd: number }; currency: { symbol: string } };
      orderSource: string;
      from: string;
      to: string;
      timestamp: number;
      txHash: string;
    }>;
  }>('/sales/v4', {
    limit: String(limit),
    includeTokenMetadata: 'true',
  });

  if (!data?.sales) return [];

  return data.sales.map(sale => ({
    id: sale.id,
    tokenId: sale.token?.tokenId || '',
    collectionSlug: sale.token?.collection?.id || '',
    collectionName: sale.token?.collection?.name || '',
    price: sale.price?.amount?.native || 0,
    currency: sale.price?.currency?.symbol || 'ETH',
    priceUsd: sale.price?.amount?.usd || 0,
    marketplace: sale.orderSource || 'Unknown',
    seller: sale.from,
    buyer: sale.to,
    timestamp: new Date(sale.timestamp * 1000).toISOString(),
    txHash: sale.txHash,
  }));
}

/**
 * Get collection activity
 */
export async function getCollectionActivity(
  slugOrAddress: string,
  limit: number = 50
): Promise<CollectionActivity> {
  const [salesData, ordersData] = await Promise.all([
    reservoirFetch<{
      activities: Array<{
        type: string;
        token: { tokenId: string };
        price: { amount: { native: number }; currency: { symbol: string } };
        from: string;
        to: string;
        timestamp: number;
        txHash: string;
        order?: { source: string };
      }>;
    }>('/collections/activity/v6', {
      collection: slugOrAddress,
      limit: String(limit),
    }),
    reservoirFetch<{
      orders: Array<{
        id: string;
        kind: string;
        side: 'buy' | 'sell';
        tokenSetId: string;
        price: { amount: { native: number }; currency: { symbol: string } };
        maker: string;
        createdAt: string;
        expiration: number;
        source: { name: string };
      }>;
    }>('/orders/asks/v5', {
      collection: slugOrAddress,
      limit: String(Math.floor(limit / 2)),
    }),
  ]);

  const activities = salesData?.activities || [];
  const orders = ordersData?.orders || [];

  return {
    sales: activities
      .filter(a => a.type === 'sale')
      .map(a => ({
        id: a.txHash,
        tokenId: a.token?.tokenId || '',
        collectionSlug: slugOrAddress,
        collectionName: '',
        price: a.price?.amount?.native || 0,
        currency: a.price?.currency?.symbol || 'ETH',
        priceUsd: 0,
        marketplace: a.order?.source || 'Unknown',
        seller: a.from,
        buyer: a.to,
        timestamp: new Date(a.timestamp * 1000).toISOString(),
        txHash: a.txHash,
      })),
    bids: orders
      .filter(o => o.side === 'buy')
      .map(o => ({
        tokenId: o.tokenSetId,
        price: o.price?.amount?.native || 0,
        currency: o.price?.currency?.symbol || 'ETH',
        bidder: o.maker,
        timestamp: o.createdAt,
        expiration: new Date(o.expiration * 1000).toISOString(),
      })),
    listings: orders
      .filter(o => o.side === 'sell')
      .map(o => ({
        tokenId: o.tokenSetId,
        price: o.price?.amount?.native || 0,
        currency: o.price?.currency?.symbol || 'ETH',
        seller: o.maker,
        timestamp: o.createdAt,
        expiration: o.expiration ? new Date(o.expiration * 1000).toISOString() : undefined,
        marketplace: o.source?.name || 'Unknown',
      })),
    transfers: activities
      .filter(a => a.type === 'transfer')
      .map(a => ({
        tokenId: a.token?.tokenId || '',
        from: a.from,
        to: a.to,
        timestamp: new Date(a.timestamp * 1000).toISOString(),
        txHash: a.txHash,
      })),
  };
}

/**
 * Get NFT market overview
 */
export async function getNFTMarketOverview(): Promise<NFTMarketOverview> {
  const [trending, recentSales] = await Promise.all([
    getTrendingCollections('24h', 50),
    getRecentSales(100),
  ]);

  const totalVolume24h = trending.reduce((sum, t) => sum + t.volume24h, 0);
  const totalSales24h = trending.reduce((sum, t) => sum + t.salesCount, 0);
  const avgFloorPrice = trending.reduce((sum, t) => sum + t.collection.stats.floorPrice, 0) / Math.max(trending.length, 1);

  // Volume by marketplace
  const volumeByMarketplace: Record<string, number> = {};
  recentSales.forEach(sale => {
    volumeByMarketplace[sale.marketplace] = (volumeByMarketplace[sale.marketplace] || 0) + sale.priceUsd;
  });

  return {
    totalVolume24h,
    totalVolume7d: totalVolume24h * 7, // Estimate
    totalSales24h,
    averageFloorPrice: avgFloorPrice,
    topCollections: trending.slice(0, 20),
    recentSales: recentSales.slice(0, 20),
    volumeByChain: { ethereum: totalVolume24h },
    volumeByMarketplace,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Search collections
 */
export async function searchCollections(query: string, limit: number = 20): Promise<NFTCollection[]> {
  const data = await reservoirFetch<{
    collections: Array<{
      id: string;
      slug: string;
      name: string;
      image: string;
      primaryContract: string;
      floorAsk?: { price?: { amount?: { native?: number } } };
      volume?: { '1day'?: number; '7day'?: number; allTime?: number };
      ownerCount?: number;
      tokenCount?: string;
      onSaleCount?: string;
    }>;
  }>('/search/collections/v2', {
    name: query,
    limit: String(limit),
  });

  if (!data?.collections) return [];

  return data.collections.map(c => ({
    slug: c.slug,
    name: c.name,
    description: '',
    imageUrl: c.image,
    contractAddress: c.primaryContract,
    chain: 'ethereum',
    createdDate: '',
    stats: {
      floorPrice: c.floorAsk?.price?.amount?.native || 0,
      floorPriceChange24h: 0,
      floorPriceChange7d: 0,
      volume24h: c.volume?.['1day'] || 0,
      volumeChange24h: 0,
      volume7d: c.volume?.['7day'] || 0,
      volumeTotal: c.volume?.allTime || 0,
      sales24h: 0,
      salesChange24h: 0,
      averagePrice24h: 0,
      numOwners: c.ownerCount || 0,
      totalSupply: parseInt(c.tokenCount || '0'),
      listedCount: parseInt(c.onSaleCount || '0'),
      marketCap: 0,
    },
    verified: true,
  }));
}
