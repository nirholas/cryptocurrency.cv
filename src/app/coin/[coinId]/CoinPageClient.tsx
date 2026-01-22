/**
 * CoinPageClient - Client component for interactive coin page features
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CoinHeader,
  PriceBox,
  MarketStats,
  PriceStatistics,
  CoinConverter,
  CoinTabs,
  CoinInfo,
  DeveloperStats,
  MarketsTable,
  HistoricalTable,
  CoinNews,
  type CoinTab,
} from './components';
import { PriceChart } from '@/components/coin-charts';
import type { Ticker, OHLCData, DeveloperData, CommunityData } from '@/lib/market-data';

interface Article {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  excerpt?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  categories?: string[];
}

interface CoinPageClientProps {
  coinData: {
    id: string;
    name: string;
    symbol: string;
    image: {
      large?: string;
      small?: string;
      thumb?: string;
    };
    market_cap_rank: number | null;
    categories?: string[];
    description?: { en?: string };
    links?: {
      homepage?: string[];
      blockchain_site?: string[];
      official_forum_url?: string[];
      chat_url?: string[];
      announcement_url?: string[];
      twitter_screen_name?: string;
      facebook_username?: string;
      telegram_channel_identifier?: string;
      subreddit_url?: string;
      repos_url?: {
        github?: string[];
        bitbucket?: string[];
      };
    };
    genesis_date?: string;
    hashing_algorithm?: string;
    block_time_in_minutes?: number;
  };
  priceData: {
    price: number;
    priceInBtc?: number;
    priceInEth?: number;
    change1h?: number;
    change24h: number;
    change7d?: number;
    change14d?: number;
    change30d?: number;
    change1y?: number;
    high24h: number;
    low24h: number;
    lastUpdated?: string;
  };
  marketData: {
    marketCap: number;
    marketCapRank: number | null;
    volume24h: number;
    circulatingSupply: number;
    totalSupply: number | null;
    maxSupply: number | null;
    fdv?: number | null;
  };
  athAtlData: {
    ath: number;
    athDate: string;
    athChange: number;
    atl: number;
    atlDate: string;
    atlChange: number;
  };
  tickers: Ticker[];
  ohlcData: OHLCData[];
  developerData: DeveloperData | null;
  communityData: CommunityData | null;
  articles: Article[];
  initialTab?: CoinTab;
}

export default function CoinPageClient({
  coinData,
  priceData,
  marketData,
  athAtlData,
  tickers,
  ohlcData,
  developerData,
  communityData,
  articles,
  initialTab = 'overview',
}: CoinPageClientProps) {
  const [activeTab, setActiveTab] = useState<CoinTab>(initialTab);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Convert OHLC to chart format
  const chartData = ohlcData.map((d) => ({
    timestamp: d.timestamp,
    price: d.close,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));

  const handleWatchlistToggle = useCallback(() => {
    setIsWatchlisted((prev) => !prev);
    // TODO: Integrate with watchlist feature
  }, []);

  const handleAlertClick = useCallback(() => {
    setShowAlertModal(true);
    // TODO: Integrate with price alerts feature
  }, []);

  return (
    <main className="px-4 py-6 sm:py-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coin Header - 2 columns on desktop */}
        <div className="lg:col-span-2">
          <CoinHeader
            coin={coinData}
            onWatchlistToggle={handleWatchlistToggle}
            onAlertClick={handleAlertClick}
            isWatchlisted={isWatchlisted}
          />
        </div>

        {/* Price Box - 1 column on desktop */}
        <div className="lg:col-span-1">
          <PriceBox
            price={priceData.price}
            change24h={priceData.change24h}
            high24h={priceData.high24h}
            low24h={priceData.low24h}
            priceInBtc={priceData.priceInBtc}
            priceInEth={priceData.priceInEth}
            lastUpdated={priceData.lastUpdated}
            symbol={coinData.symbol}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <CoinTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasMarkets={tickers.length > 0}
          hasHistorical={ohlcData.length > 0}
          marketsCount={tickers.length}
        />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Interactive Chart */}
              {chartData.length > 0 && (
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {coinData.symbol.toUpperCase()} Price Chart
                  </h3>
                  <PriceChart
                    data={chartData}
                    type="area"
                    height={350}
                    showGrid={true}
                  />
                </div>
              )}

              {/* Market Stats */}
              <MarketStats
                marketCap={marketData.marketCap}
                marketCapRank={marketData.marketCapRank}
                volume24h={marketData.volume24h}
                circulatingSupply={marketData.circulatingSupply}
                totalSupply={marketData.totalSupply}
                maxSupply={marketData.maxSupply}
                fullyDilutedValuation={marketData.fdv || null}
                symbol={coinData.symbol}
              />

              {/* Price Statistics */}
              <PriceStatistics
                currentPrice={priceData.price}
                ath={athAtlData.ath}
                athDate={athAtlData.athDate}
                athChangePercentage={athAtlData.athChange}
                atl={athAtlData.atl}
                atlDate={athAtlData.atlDate}
                atlChangePercentage={athAtlData.atlChange}
                high24h={priceData.high24h}
                low24h={priceData.low24h}
                priceChange1h={priceData.change1h}
                priceChange24h={priceData.change24h}
                priceChange7d={priceData.change7d}
                priceChange14d={priceData.change14d}
                priceChange30d={priceData.change30d}
                priceChange1y={priceData.change1y}
              />

              {/* Two Column Layout: Info & Converter */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CoinInfo coin={coinData} />
                <CoinConverter
                  coinId={coinData.id}
                  symbol={coinData.symbol}
                  name={coinData.name}
                  price={priceData.price}
                  image={coinData.image?.large}
                />
              </div>

              {/* Developer & Community Stats */}
              <DeveloperStats
                developerData={developerData}
                communityData={communityData}
                coinName={coinData.name}
              />

              {/* Related News Preview */}
              {articles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      📰 Latest {coinData.name} News
                    </h3>
                    <button
                      onClick={() => setActiveTab('news')}
                      className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                  <CoinNews
                    articles={articles.slice(0, 6)}
                    coinName={coinData.name}
                    coinSymbol={coinData.symbol}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'markets' && (
            <MarketsTable
              tickers={tickers}
              coinSymbol={coinData.symbol}
            />
          )}

          {activeTab === 'historical' && (
            <HistoricalTable
              ohlcData={ohlcData}
              coinId={coinData.id}
              coinSymbol={coinData.symbol}
              coinName={coinData.name}
            />
          )}

          {activeTab === 'news' && (
            <CoinNews
              articles={articles}
              coinName={coinData.name}
              coinSymbol={coinData.symbol}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Price Alert Modal (placeholder) */}
      <AnimatePresence>
        {showAlertModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowAlertModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Set Price Alert for {coinData.symbol.toUpperCase()}
              </h3>
              <p className="text-gray-400 mb-4">
                Get notified when {coinData.name} reaches your target price.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Alert when price goes
                  </label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 font-medium">
                      Above
                    </button>
                    <button className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 font-medium">
                      Below
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Target Price (USD)
                  </label>
                  <input
                    type="number"
                    placeholder={priceData.price.toString()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement alert creation
                    setShowAlertModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg font-medium hover:bg-amber-400 transition-colors"
                >
                  Create Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
