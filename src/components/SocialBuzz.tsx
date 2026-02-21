'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  ArrowPathIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  small: string;
  large: string;
  market_cap_rank: number | null;
  price_btc: number;
  score: number;
  data?: {
    price: number;
    price_change_percentage_24h: {
      usd: number;
    };
    market_cap: string;
    total_volume: string;
    sparkline: string;
  };
}

interface TrendingNFT {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  floor_price_24h_percentage_change: number;
}

interface TrendingCategory {
  id: number;
  name: string;
  market_cap_change_24h: number;
  coins_count: number;
}

interface TrendingData {
  coins: Array<{ item: TrendingCoin }>;
  nfts: TrendingNFT[];
  categories: TrendingCategory[];
}

interface CoinSocialData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  twitter_followers: number;
  reddit_subscribers: number;
  telegram_channel_user_count: number | null;
  developer_score: number;
  community_score: number;
  public_interest_score: number;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
}

// Fetch trending data from CoinGecko
async function fetchTrendingData(): Promise<TrendingData | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      { 
        next: { revalidate: 300 }, // Cache for 5 minutes
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch trending:', response.status);
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching trending:', error);
    return null;
  }
}

// Fetch detailed coin data with social stats
async function fetchCoinSocialData(coinId: string): Promise<CoinSocialData | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true&sparkline=false`,
      { 
        next: { revalidate: 600 }, // Cache for 10 minutes
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      image: data.image?.small || data.image?.thumb || '',
      twitter_followers: data.community_data?.twitter_followers || 0,
      reddit_subscribers: data.community_data?.reddit_subscribers || 0,
      telegram_channel_user_count: data.community_data?.telegram_channel_user_count || null,
      developer_score: data.developer_score || 0,
      community_score: data.community_score || 0,
      public_interest_score: data.public_interest_score || 0,
      sentiment_votes_up_percentage: data.sentiment_votes_up_percentage || 50,
      sentiment_votes_down_percentage: data.sentiment_votes_down_percentage || 50,
    };
  } catch (error) {
    console.error(`Error fetching social data for ${coinId}:`, error);
    return null;
  }
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatPercent(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function SocialBuzz() {
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [trendingNFTs, setTrendingNFTs] = useState<TrendingNFT[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<TrendingCategory[]>([]);
  const [socialData, setSocialData] = useState<Map<string, CoinSocialData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'trending' | 'social' | 'nfts' | 'categories'>('trending');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchTrendingData();
      
      if (data) {
        const coins = data.coins.map((c) => c.item);
        setTrending(coins);
        setTrendingNFTs(data.nfts || []);
        setTrendingCategories(data.categories || []);
        setLastUpdate(new Date());
        setError(null);
        
        // Fetch social data for top 5 coins with delay
        setLoadingSocial(true);
        const socialMap = new Map<string, CoinSocialData>();
        
        for (let i = 0; i < Math.min(5, coins.length); i++) {
          const coinData = await fetchCoinSocialData(coins[i].id);
          if (coinData) {
            socialMap.set(coins[i].id, coinData);
          }
          // Rate limit delay
          if (i < coins.length - 1) {
            await new Promise(r => setTimeout(r, 250));
          }
        }
        
        setSocialData(socialMap);
        setLoadingSocial(false);
      } else {
        setError('Unable to fetch trending data. CoinGecko may be rate limiting.');
      }
    } catch (e) {
      console.error('Failed to fetch trending:', e);
      setError('Failed to load social data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getSentimentColor = (upPct: number): string => {
    if (upPct >= 70) return 'bg-slate-900 dark:bg-white text-white dark:text-slate-900';
    if (upPct >= 50) return 'bg-slate-500 text-white';
    return 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200';
  };

  const getSentimentLabel = (upPct: number): string => {
    if (upPct >= 70) return 'Bullish';
    if (upPct >= 50) return 'Neutral';
    return 'Bearish';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && trending.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  const t = useTranslations('common');
  return (
    <div className="space-y-6">
      {/* Last Update */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {lastUpdate && `Updated ${lastUpdate.toLocaleTimeString()}`}
        </span>
        <button
          onClick={fetchData}
          className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setTab('trending')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'trending'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          <FireIcon className="w-4 h-4" />
          Trending
        </button>
        <button
          onClick={() => setTab('social')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'social'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4" />
          Social Stats
        </button>
        <button
          onClick={() => setTab('nfts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'nfts'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          <GlobeAltIcon className="w-4 h-4" />
          NFTs
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'categories'
              ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
              : 'border-transparent text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
          }`}
        >
          <UserGroupIcon className="w-4 h-4" />
          Categories
        </button>
      </div>

      {/* Trending Tab */}
      {tab === 'trending' && (
        <div className="space-y-3">
          {trending.map((coin, index) => (
            <a
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
              <Image 
                src={coin.small || coin.thumb} 
                alt={coin.name} 
                width={40}
                height={40}
                className="rounded-full bg-gray-100 dark:bg-slate-700" 
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 dark:text-white truncate">
                  {coin.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                  {coin.symbol}
                </div>
              </div>
              <div className="text-right">
                {coin.data?.price && (
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    ${coin.data.price < 1 
                      ? coin.data.price.toFixed(6) 
                      : coin.data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    }
                  </div>
                )}
                {coin.data?.price_change_percentage_24h && (
                  <div className={`text-sm ${
                    coin.data.price_change_percentage_24h.usd >= 0 
                      ? 'text-slate-900 dark:text-white' 
                      : 'text-gray-500'
                  }`}>
                    {formatPercent(coin.data.price_change_percentage_24h.usd)}
                  </div>
                )}
              </div>
              {coin.market_cap_rank && (
                <div className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
                  #{coin.market_cap_rank}
                </div>
              )}
              <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
            </a>
          ))}
        </div>
      )}

      {/* Social Stats Tab */}
      {tab === 'social' && (
        <div className="space-y-4">
          {loadingSocial && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Loading social data...
            </div>
          )}
          
          {trending.slice(0, 5).map((coin) => {
            const social = socialData.get(coin.id);
            
            return (
              <div
                key={coin.id}
                className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Image 
                    src={coin.small || coin.thumb} 
                    alt={coin.name} 
                    width={32}
                    height={32}
                    className="rounded-full bg-gray-100 dark:bg-slate-700" 
                  />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{coin.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">{coin.symbol}</div>
                  </div>
                  {social && (
                    <span className={`ml-auto text-xs font-medium px-2 py-1 rounded ${getSentimentColor(social.sentiment_votes_up_percentage)}`}>
                      {getSentimentLabel(social.sentiment_votes_up_percentage)}
                    </span>
                  )}
                </div>
                
                {social ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Twitter</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatNumber(social.twitter_followers)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reddit</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatNumber(social.reddit_subscribers)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Community</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {social.community_score.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sentiment</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-900 dark:bg-white"
                            style={{ width: `${social.sentiment_votes_up_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {Math.round(social.sentiment_votes_up_percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    {loadingSocial ? 'Loading...' : 'Social data unavailable'}
                  </div>
                )}
              </div>
            );
          })}
          
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Social data from CoinGecko community metrics. Sentiment based on community votes.
          </p>
        </div>
      )}

      {/* NFTs Tab */}
      {tab === 'nfts' && (
        <div className="space-y-3">
          {trendingNFTs.length > 0 ? (
            trendingNFTs.map((nft, index) => (
              <div
                key={nft.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
              >
                <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                <Image 
                  src={nft.thumb} 
                  alt={nft.name} 
                  width={40}
                  height={40}
                  className="rounded-lg bg-gray-100 dark:bg-slate-700" 
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white truncate">
                    {nft.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                    {nft.symbol}
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  nft.floor_price_24h_percentage_change >= 0 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-gray-500'
                }`}>
                  Floor {formatPercent(nft.floor_price_24h_percentage_change)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No trending NFT data available
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-3">
          {trendingCategories.length > 0 ? (
            trendingCategories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
              >
                <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white truncate">
                    {category.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {category.coins_count} coins
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  category.market_cap_change_24h >= 0 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-gray-500'
                }`}>
                  {formatPercent(category.market_cap_change_24h)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No trending category data available
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Trending data from CoinGecko search API. Based on search volume and community activity.
      </p>
    </div>
  );
}

// Compact widget version for sidebars
export function SocialBuzzWidget() {
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchTrendingData();
      if (data) {
        setTrending(data.coins.map(c => c.item).slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white mb-3">
        <FireIcon className="w-4 h-4" />
        Trending Now
      </div>
      {trending.map((coin, i) => (
        <a
          key={coin.id}
          href={`/coin/${coin.id}`}
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="text-xs text-gray-400 w-4">{i + 1}</span>
          <Image src={coin.thumb} alt={coin.name} width={20} height={20} className="rounded-full" />
          <span className="text-sm text-slate-900 dark:text-white truncate flex-1">{coin.name}</span>
          <span className="text-xs text-gray-500 uppercase">{coin.symbol}</span>
        </a>
      ))}
    </div>
  );
}
