/**
 * CoinPageClient - Client component for interactive coin page features
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  TechnicalAnalysis,
  DerivativesTab,
  type CoinTab,
} from './components';
import { PriceChart } from '@/components/coin-charts';
import type { Ticker, OHLCData, DeveloperData, CommunityData } from '@/lib/market-data';
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '@/lib/watchlist';

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
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');
  const [alertPrice, setAlertPrice] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

  // Check watchlist status on mount
  useEffect(() => {
    setIsWatchlisted(isInWatchlist(coinData.id));
  }, [coinData.id]);

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
    if (isWatchlisted) {
      removeFromWatchlist(coinData.id);
      setIsWatchlisted(false);
    } else {
      const result = addToWatchlist(coinData.id);
      if (result.success) {
        setIsWatchlisted(true);
      } else {
        console.error('Failed to add to watchlist:', result.error);
      }
    }
  }, [isWatchlisted, coinData.id]);

  const handleAlertClick = useCallback(() => {
    setAlertPrice(priceData.price.toFixed(2));
    setAlertDirection('above');
    setAlertMessage(null);
    setShowAlertModal(true);
  }, [priceData.price]);

  const handleCreateAlert = useCallback(async () => {
    const targetPrice = parseFloat(alertPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      setAlertMessage({ type: 'error', text: 'Please enter a valid price' });
      return;
    }

    setIsCreatingAlert(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'price',
          coinId: coinData.id,
          symbol: coinData.symbol.toUpperCase(),
          coinName: coinData.name,
          targetPrice,
          direction: alertDirection,
          currentPrice: priceData.price,
        }),
      });

      if (response.ok) {
        setAlertMessage({ type: 'success', text: 'Alert created successfully!' });
        setTimeout(() => {
          setShowAlertModal(false);
          setAlertMessage(null);
        }, 1500);
      } else {
        const data = await response.json();
        setAlertMessage({ type: 'error', text: data.error || 'Failed to create alert' });
      }
    } catch (error) {
      setAlertMessage({ type: 'error', text: 'Failed to create alert. Please try again.' });
      console.error('Alert creation error:', error);
    } finally {
      setIsCreatingAlert(false);
    }
  }, [alertPrice, alertDirection, coinData, priceData.price]);

  const t = useTranslations('common');
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

      {/* Price Chart - Prominent display */}
      {chartData.length > 0 && (
        <div className="mb-6 bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {coinData.symbol.toUpperCase()}/USD Chart
            </h3>
            <span className="text-sm text-text-muted">30 Day</span>
          </div>
          <PriceChart
            data={chartData}
            type="area"
            height={400}
            showGrid={true}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <CoinTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasMarkets={tickers.length > 0}
          hasHistorical={ohlcData.length > 0}
          hasOhlc={ohlcData.length >= 15}
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

              {/* Technical Analysis Summary */}
              {ohlcData.length >= 15 && (
                <TechnicalAnalysis
                  ohlcData={ohlcData}
                  symbol={coinData.symbol}
                  currentPrice={priceData.price}
                />
              )}

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
                      className="text-sm text-gray-300 hover:text-white transition-colors"
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

          {activeTab === 'technical' && (
            <TechnicalAnalysis
              ohlcData={ohlcData}
              symbol={coinData.symbol}
              currentPrice={priceData.price}
            />
          )}

          {activeTab === 'derivatives' && (
            <DerivativesTab
              coinSymbol={coinData.symbol}
              coinName={coinData.name}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Price Alert Modal */}
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
                <span className="block mt-1 text-sm">
                  Current price: <span className="text-white font-medium">${priceData.price.toLocaleString()}</span>
                </span>
              </p>
              
              {alertMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  alertMessage.type === 'success' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {alertMessage.text}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <p className="block text-sm text-gray-400 mb-2">
                    Alert when price goes
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAlertDirection('above')}
                      className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                        alertDirection === 'above'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      ↑ Above
                    </button>
                    <button
                      onClick={() => setAlertDirection('below')}
                      className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${
                        alertDirection === 'below'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      ↓ Below
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="alert-price" className="block text-sm text-gray-400 mb-2">
                    Target Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      id="alert-price"
                      type="number"
                      step="any"
                      min="0"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      placeholder={priceData.price.toFixed(2)}
                      className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                  {alertPrice && !isNaN(parseFloat(alertPrice)) && (
                    <p className="mt-2 text-sm text-gray-400">
                      {alertDirection === 'above' 
                        ? `Alert when price rises ${((parseFloat(alertPrice) - priceData.price) / priceData.price * 100).toFixed(2)}% above current`
                        : `Alert when price drops ${((priceData.price - parseFloat(alertPrice)) / priceData.price * 100).toFixed(2)}% below current`
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAlertModal(false)}
                  disabled={isCreatingAlert}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={isCreatingAlert || !alertPrice}
                  className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingAlert ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>🔔 Create Alert</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
