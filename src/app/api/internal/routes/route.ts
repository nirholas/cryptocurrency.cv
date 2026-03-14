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
 * Internal Route Manifest for SperaxOS
 *
 * GET /api/internal/routes — Complete route catalog with methods,
 * descriptions, categories, and pricing. Authenticated via
 * x-speraxos-token (trusted origin / internal only).
 *
 * This endpoint provides sperax (chat.sperax.io) with everything it
 * needs to discover and call every route this API supplies.
 *
 * @module api/internal/routes
 */

import { type NextRequest, NextResponse } from 'next/server';
import { isSperaxOSRequest } from '@/middleware/trusted-origins';
import { API_PRICING, PREMIUM_PRICING } from '@/lib/x402/pricing';
import { SITE_URL } from '@/lib/constants';

export const runtime = 'edge';
export const revalidate = 3600; // ISR: refresh every hour

// ─── Route definitions ──────────────────────────────────────────────────────
// Each route sperax can call, grouped by category.
// Pricing is pulled from x402 pricing where available, "$0" for free/internal.

interface RouteEntry {
  path: string;
  method: string;
  description: string;
  category: string;
  params?: Record<string, string>;
}

const ROUTES: RouteEntry[] = [
  // ─── News & Content ─────────────────────────────────────────────────────
  {
    path: '/api/news',
    method: 'GET',
    description: 'Latest crypto news from 120+ sources',
    category: 'news',
  },
  {
    path: '/api/news/categories',
    method: 'GET',
    description: 'News by category (DeFi, NFT, regulation, etc.)',
    category: 'news',
  },
  {
    path: '/api/news/extract',
    method: 'GET',
    description: 'Extract full article text from URL',
    category: 'news',
  },
  {
    path: '/api/news/international',
    method: 'GET',
    description: 'International news in multiple languages',
    category: 'news',
  },
  {
    path: '/api/news/stream',
    method: 'GET',
    description: 'SSE stream of live news',
    category: 'news',
  },
  {
    path: '/api/article',
    method: 'GET',
    description: 'Single article by ID/URL',
    category: 'news',
  },
  { path: '/api/articles', method: 'GET', description: 'Paginated article list', category: 'news' },
  { path: '/api/search', method: 'GET', description: 'Full-text news search', category: 'news' },
  {
    path: '/api/search/v2',
    method: 'GET',
    description: 'Enhanced search with filters',
    category: 'news',
  },
  {
    path: '/api/search/semantic',
    method: 'GET',
    description: 'Semantic/vector search',
    category: 'news',
  },
  { path: '/api/trending', method: 'GET', description: 'Trending news topics', category: 'news' },
  { path: '/api/breaking', method: 'GET', description: 'Breaking news alerts', category: 'news' },
  {
    path: '/api/commentary',
    method: 'GET',
    description: 'Expert commentary and opinion',
    category: 'news',
  },
  { path: '/api/podcast', method: 'GET', description: 'Crypto podcast episodes', category: 'news' },
  { path: '/api/digest', method: 'GET', description: 'Daily news digest', category: 'news' },
  { path: '/api/newsletter', method: 'GET', description: 'Newsletter content', category: 'news' },
  {
    path: '/api/regulatory',
    method: 'GET',
    description: 'Regulatory news and updates',
    category: 'news',
  },
  { path: '/api/rss', method: 'GET', description: 'RSS feed', category: 'news' },
  { path: '/api/atom', method: 'GET', description: 'Atom feed', category: 'news' },
  { path: '/api/opml', method: 'GET', description: 'OPML source list', category: 'news' },
  { path: '/api/tags', method: 'GET', description: 'All tags', category: 'news' },
  {
    path: '/api/tags/:slug',
    method: 'GET',
    description: 'Articles by tag',
    category: 'news',
    params: { slug: 'Tag slug (e.g. bitcoin, defi)' },
  },

  // ─── Market Data ────────────────────────────────────────────────────────
  {
    path: '/api/market/coins',
    method: 'GET',
    description: 'All coins with prices and metadata',
    category: 'market',
  },
  {
    path: '/api/market/coins/:coinId/developer',
    method: 'GET',
    description: 'Developer activity for a coin',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/coins/:coinId/community',
    method: 'GET',
    description: 'Community metrics for a coin',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/ohlc/:coinId',
    method: 'GET',
    description: 'OHLC candle data',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/snapshot/:coinId',
    method: 'GET',
    description: 'Quick price snapshot',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/movers',
    method: 'GET',
    description: 'Top gainers and losers',
    category: 'market',
  },
  {
    path: '/api/market/compare',
    method: 'GET',
    description: 'Compare multiple coins',
    category: 'market',
  },
  {
    path: '/api/market/defi',
    method: 'GET',
    description: 'DeFi market overview',
    category: 'market',
  },
  {
    path: '/api/market/global-defi',
    method: 'GET',
    description: 'Global DeFi TVL and stats',
    category: 'market',
  },
  {
    path: '/api/market/heatmap',
    method: 'GET',
    description: 'Market heatmap data',
    category: 'market',
  },
  {
    path: '/api/market/search',
    method: 'GET',
    description: 'Search coins by name/symbol',
    category: 'market',
  },
  {
    path: '/api/market/derivatives',
    method: 'GET',
    description: 'Derivatives market data',
    category: 'market',
  },
  {
    path: '/api/market/exchanges',
    method: 'GET',
    description: 'Exchange list with volume',
    category: 'market',
  },
  {
    path: '/api/market/exchanges/:id',
    method: 'GET',
    description: 'Single exchange details',
    category: 'market',
    params: { id: 'Exchange ID' },
  },
  {
    path: '/api/market/categories',
    method: 'GET',
    description: 'Market categories',
    category: 'market',
  },
  {
    path: '/api/market/categories/:id',
    method: 'GET',
    description: 'Single category details',
    category: 'market',
    params: { id: 'Category ID' },
  },
  {
    path: '/api/market/tickers/:coinId',
    method: 'GET',
    description: 'Trading pairs/tickers for a coin',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/social/:coinId',
    method: 'GET',
    description: 'Social metrics for a coin',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/stream',
    method: 'GET',
    description: 'SSE stream of live prices',
    category: 'market',
  },
  {
    path: '/api/market/history/:coinId',
    method: 'GET',
    description: 'Historical price data',
    category: 'market',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/market/dominance',
    method: 'GET',
    description: 'BTC/ETH dominance chart',
    category: 'market',
  },
  { path: '/api/market/losers', method: 'GET', description: 'Top losers', category: 'market' },
  { path: '/api/market/gainers', method: 'GET', description: 'Top gainers', category: 'market' },
  {
    path: '/api/market/orderbook',
    method: 'GET',
    description: 'Aggregated orderbook',
    category: 'market',
  },
  {
    path: '/api/global',
    method: 'GET',
    description: 'Global market stats (market cap, volume, dominance)',
    category: 'market',
  },
  {
    path: '/api/prices',
    method: 'GET',
    description: 'Current prices for top coins',
    category: 'market',
  },
  {
    path: '/api/prices/stream',
    method: 'GET',
    description: 'SSE price stream',
    category: 'market',
  },
  { path: '/api/ohlc', method: 'GET', description: 'OHLC chart data', category: 'market' },
  { path: '/api/fear-greed', method: 'GET', description: 'Fear & Greed Index', category: 'market' },
  {
    path: '/api/compare',
    method: 'GET',
    description: 'Compare assets side by side',
    category: 'market',
  },
  { path: '/api/charts', method: 'GET', description: 'Chart data', category: 'market' },
  {
    path: '/api/exchange-rates',
    method: 'GET',
    description: 'Crypto ↔ fiat exchange rates',
    category: 'market',
  },
  {
    path: '/api/exchange-rates/convert',
    method: 'GET',
    description: 'Currency conversion',
    category: 'market',
  },
  { path: '/api/exchanges', method: 'GET', description: 'Exchange list', category: 'market' },
  { path: '/api/stats', method: 'GET', description: 'API usage statistics', category: 'market' },

  // ─── Bitcoin ────────────────────────────────────────────────────────────
  {
    path: '/api/bitcoin',
    method: 'GET',
    description: 'Bitcoin overview (price, metrics, news)',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/blocks',
    method: 'GET',
    description: 'Recent Bitcoin blocks',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/blocks/:hash',
    method: 'GET',
    description: 'Block details by hash',
    category: 'bitcoin',
    params: { hash: 'Block hash' },
  },
  {
    path: '/api/bitcoin/stats',
    method: 'GET',
    description: 'Bitcoin network statistics',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/block-height',
    method: 'GET',
    description: 'Current block height',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/address/:address',
    method: 'GET',
    description: 'Address balance and transactions',
    category: 'bitcoin',
    params: { address: 'Bitcoin address' },
  },
  {
    path: '/api/bitcoin/difficulty',
    method: 'GET',
    description: 'Mining difficulty data',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/mempool/info',
    method: 'GET',
    description: 'Mempool overview',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/mempool/blocks',
    method: 'GET',
    description: 'Mempool projected blocks',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/mempool/fees',
    method: 'GET',
    description: 'Recommended fee rates',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/network-stats',
    method: 'GET',
    description: 'Hash rate, node count, etc.',
    category: 'bitcoin',
  },
  {
    path: '/api/bitcoin/tx/:txid',
    method: 'GET',
    description: 'Transaction details',
    category: 'bitcoin',
    params: { txid: 'Transaction ID' },
  },

  // ─── Solana ─────────────────────────────────────────────────────────────
  {
    path: '/api/solana',
    method: 'GET',
    description: 'Solana ecosystem overview',
    category: 'solana',
  },
  {
    path: '/api/solana/priority-fees',
    method: 'GET',
    description: 'Current priority fee estimates',
    category: 'solana',
  },
  {
    path: '/api/solana/wallet',
    method: 'GET',
    description: 'Wallet portfolio on Solana',
    category: 'solana',
  },
  {
    path: '/api/solana/defi',
    method: 'GET',
    description: 'Solana DeFi protocols',
    category: 'solana',
  },
  {
    path: '/api/solana/nfts',
    method: 'GET',
    description: 'Solana NFT collections',
    category: 'solana',
  },
  {
    path: '/api/solana/search',
    method: 'GET',
    description: 'Search Solana tokens/programs',
    category: 'solana',
  },
  {
    path: '/api/solana/transactions',
    method: 'GET',
    description: 'Recent Solana transactions',
    category: 'solana',
  },
  {
    path: '/api/solana/tokens',
    method: 'GET',
    description: 'Solana token list',
    category: 'solana',
  },
  {
    path: '/api/solana/balances',
    method: 'GET',
    description: 'Token balances for an address',
    category: 'solana',
  },
  {
    path: '/api/solana/collections',
    method: 'GET',
    description: 'NFT collection stats',
    category: 'solana',
  },
  {
    path: '/api/solana/assets',
    method: 'GET',
    description: 'Solana digital assets (DAS)',
    category: 'solana',
  },

  // ─── DeFi & On-Chain ───────────────────────────────────────────────────
  {
    path: '/api/defi',
    method: 'GET',
    description: 'DeFi overview (TVL, protocols)',
    category: 'defi',
  },
  {
    path: '/api/defi/stablecoins',
    method: 'GET',
    description: 'Stablecoin data',
    category: 'defi',
  },
  {
    path: '/api/defi/yields',
    method: 'GET',
    description: 'Yield farming opportunities',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/chains',
    method: 'GET',
    description: 'Yields by chain',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/stablecoins',
    method: 'GET',
    description: 'Stablecoin yields',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/projects',
    method: 'GET',
    description: 'Yields by project',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/stats',
    method: 'GET',
    description: 'Yield statistics',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/median',
    method: 'GET',
    description: 'Median yields',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/search',
    method: 'GET',
    description: 'Search yield pools',
    category: 'defi',
  },
  {
    path: '/api/defi/yields/:poolId/chart',
    method: 'GET',
    description: 'Yield history chart',
    category: 'defi',
    params: { poolId: 'Pool ID' },
  },
  {
    path: '/api/defi/bridges',
    method: 'GET',
    description: 'Cross-chain bridge data',
    category: 'defi',
  },
  {
    path: '/api/defi/dex-volumes',
    method: 'GET',
    description: 'DEX trading volumes',
    category: 'defi',
  },
  {
    path: '/api/defi/summary',
    method: 'GET',
    description: 'DeFi market summary',
    category: 'defi',
  },
  {
    path: '/api/defi/protocol-health',
    method: 'GET',
    description: 'Protocol health scores',
    category: 'defi',
  },
  { path: '/api/stablecoins', method: 'GET', description: 'All stablecoins', category: 'defi' },
  {
    path: '/api/stablecoins/chains',
    method: 'GET',
    description: 'Stablecoins by chain',
    category: 'defi',
  },
  {
    path: '/api/stablecoins/flows',
    method: 'GET',
    description: 'Stablecoin flows',
    category: 'defi',
  },
  {
    path: '/api/stablecoins/:symbol',
    method: 'GET',
    description: 'Single stablecoin data',
    category: 'defi',
    params: { symbol: 'Stablecoin symbol (e.g. USDT)' },
  },
  {
    path: '/api/stablecoins/depeg',
    method: 'GET',
    description: 'Depeg monitoring',
    category: 'defi',
  },
  {
    path: '/api/stablecoins/dominance',
    method: 'GET',
    description: 'Stablecoin dominance chart',
    category: 'defi',
  },
  { path: '/api/yields', method: 'GET', description: 'Yield farming data', category: 'defi' },
  { path: '/api/gas', method: 'GET', description: 'Gas prices (ETH, L2s)', category: 'defi' },
  { path: '/api/gas/estimate', method: 'GET', description: 'Gas cost estimator', category: 'defi' },
  {
    path: '/api/gas/history',
    method: 'GET',
    description: 'Historical gas prices',
    category: 'defi',
  },
  {
    path: '/api/dex-volumes',
    method: 'GET',
    description: 'DEX volume aggregation',
    category: 'defi',
  },

  // ─── On-Chain Metrics ──────────────────────────────────────────────────
  {
    path: '/api/on-chain',
    method: 'GET',
    description: 'On-chain analytics overview',
    category: 'onchain',
  },
  {
    path: '/api/onchain/metrics',
    method: 'GET',
    description: 'Key on-chain metrics',
    category: 'onchain',
  },
  {
    path: '/api/onchain/lth-metrics',
    method: 'GET',
    description: 'Long-term holder metrics',
    category: 'onchain',
  },
  {
    path: '/api/onchain/miner-metrics',
    method: 'GET',
    description: 'Miner revenue and hash rate',
    category: 'onchain',
  },
  {
    path: '/api/onchain/whale-metrics',
    method: 'GET',
    description: 'Whale accumulation/distribution',
    category: 'onchain',
  },
  {
    path: '/api/onchain/funding-metrics',
    method: 'GET',
    description: 'Funding rate metrics',
    category: 'onchain',
  },
  {
    path: '/api/onchain/exchange-flows',
    method: 'GET',
    description: 'Exchange inflow/outflow',
    category: 'onchain',
  },
  {
    path: '/api/onchain/events',
    method: 'GET',
    description: 'On-chain events feed',
    category: 'onchain',
  },
  {
    path: '/api/onchain/multichain',
    method: 'GET',
    description: 'Multi-chain metrics',
    category: 'onchain',
  },
  {
    path: '/api/onchain/correlate',
    method: 'GET',
    description: 'On-chain/price correlation',
    category: 'onchain',
  },
  {
    path: '/api/onchain/cross-protocol',
    method: 'GET',
    description: 'Cross-protocol analytics',
    category: 'onchain',
  },
  {
    path: '/api/onchain/health',
    method: 'GET',
    description: 'Network health scores',
    category: 'onchain',
  },
  {
    path: '/api/onchain/protocol/:protocol',
    method: 'GET',
    description: 'Protocol-specific metrics',
    category: 'onchain',
    params: { protocol: 'Protocol name (e.g. uniswap, aave)' },
  },
  {
    path: '/api/onchain/gmx/stats',
    method: 'GET',
    description: 'GMX protocol stats',
    category: 'onchain',
  },
  {
    path: '/api/onchain/uniswap/swaps',
    method: 'GET',
    description: 'Recent Uniswap swaps',
    category: 'onchain',
  },
  {
    path: '/api/onchain/uniswap/pools',
    method: 'GET',
    description: 'Uniswap pool data',
    category: 'onchain',
  },
  {
    path: '/api/onchain/aave/rates',
    method: 'GET',
    description: 'Aave lending/borrow rates',
    category: 'onchain',
  },
  {
    path: '/api/onchain/aave/markets',
    method: 'GET',
    description: 'Aave market data',
    category: 'onchain',
  },
  {
    path: '/api/onchain/compound/markets',
    method: 'GET',
    description: 'Compound market data',
    category: 'onchain',
  },
  {
    path: '/api/onchain/curve/pools',
    method: 'GET',
    description: 'Curve pool data',
    category: 'onchain',
  },
  {
    path: '/api/onchain/lido/stats',
    method: 'GET',
    description: 'Lido staking stats',
    category: 'onchain',
  },
  {
    path: '/api/onchain/maker/stats',
    method: 'GET',
    description: 'MakerDAO stats',
    category: 'onchain',
  },

  // ─── Social & Sentiment ────────────────────────────────────────────────
  {
    path: '/api/social',
    method: 'GET',
    description: 'Social activity overview',
    category: 'social',
  },
  {
    path: '/api/social/coins',
    method: 'GET',
    description: 'Social metrics per coin',
    category: 'social',
  },
  {
    path: '/api/social/coins/:symbol',
    method: 'GET',
    description: 'Social data for a specific coin',
    category: 'social',
    params: { symbol: 'Coin symbol (e.g. BTC)' },
  },
  {
    path: '/api/social/coins/:symbol/feed',
    method: 'GET',
    description: 'Social feed for a coin',
    category: 'social',
    params: { symbol: 'Coin symbol' },
  },
  {
    path: '/api/social/trending-narratives',
    method: 'GET',
    description: 'Trending crypto narratives',
    category: 'social',
  },
  {
    path: '/api/social/influencer-score',
    method: 'GET',
    description: 'Influencer credibility scores',
    category: 'social',
  },
  {
    path: '/api/social/influencers',
    method: 'GET',
    description: 'Top crypto influencers',
    category: 'social',
  },
  {
    path: '/api/social/discord',
    method: 'GET',
    description: 'Discord activity metrics',
    category: 'social',
  },
  {
    path: '/api/social/sentiment',
    method: 'GET',
    description: 'Social sentiment analysis',
    category: 'social',
  },
  {
    path: '/api/social/sentiment/market',
    method: 'GET',
    description: 'Market-wide sentiment',
    category: 'social',
  },
  {
    path: '/api/social/topics/trending',
    method: 'GET',
    description: 'Trending topics',
    category: 'social',
  },
  {
    path: '/api/social/x/sentiment',
    method: 'GET',
    description: 'X/Twitter sentiment',
    category: 'social',
  },
  {
    path: '/api/social/x/lists',
    method: 'GET',
    description: 'Curated X/Twitter lists',
    category: 'social',
  },
  {
    path: '/api/social/monitor',
    method: 'GET',
    description: 'Social monitoring dashboard',
    category: 'social',
  },
  {
    path: '/api/sentiment',
    method: 'GET',
    description: 'Market sentiment index',
    category: 'social',
  },

  // ─── Analytics ─────────────────────────────────────────────────────────
  {
    path: '/api/analytics/anomalies',
    method: 'GET',
    description: 'Market anomaly detection',
    category: 'analytics',
  },
  {
    path: '/api/analytics/forensics',
    method: 'GET',
    description: 'Blockchain forensics',
    category: 'analytics',
  },
  {
    path: '/api/analytics/events',
    method: 'GET',
    description: 'Market-moving events',
    category: 'analytics',
  },
  {
    path: '/api/analytics/news-onchain',
    method: 'GET',
    description: 'News ↔ on-chain correlation',
    category: 'analytics',
  },
  {
    path: '/api/analytics/causality',
    method: 'GET',
    description: 'Causal analysis',
    category: 'analytics',
  },
  {
    path: '/api/analytics/credibility',
    method: 'GET',
    description: 'Source credibility scores',
    category: 'analytics',
  },
  {
    path: '/api/analytics/gaps',
    method: 'GET',
    description: 'Coverage gap analysis',
    category: 'analytics',
  },
  {
    path: '/api/analytics/influencers',
    method: 'GET',
    description: 'Influencer impact analysis',
    category: 'analytics',
  },
  {
    path: '/api/analytics/headlines',
    method: 'GET',
    description: 'Headline analytics',
    category: 'analytics',
  },
  {
    path: '/api/analytics/usage',
    method: 'GET',
    description: 'API usage analytics',
    category: 'analytics',
  },
  {
    path: '/api/anomalies',
    method: 'GET',
    description: 'Price/volume anomalies',
    category: 'analytics',
  },
  {
    path: '/api/predictions',
    method: 'GET',
    description: 'Price predictions',
    category: 'analytics',
  },
  {
    path: '/api/predictions/history',
    method: 'GET',
    description: 'Past prediction accuracy',
    category: 'analytics',
  },
  {
    path: '/api/predictions/markets',
    method: 'GET',
    description: 'Prediction markets',
    category: 'analytics',
  },
  { path: '/api/signals', method: 'GET', description: 'Trading signals', category: 'analytics' },
  {
    path: '/api/signals/narrative',
    method: 'GET',
    description: 'Narrative-based signals',
    category: 'analytics',
  },
  {
    path: '/api/classify',
    method: 'GET',
    description: 'News classification',
    category: 'analytics',
  },
  { path: '/api/claims', method: 'GET', description: 'Claim verification', category: 'analytics' },
  {
    path: '/api/factcheck',
    method: 'GET',
    description: 'Fact-check crypto claims',
    category: 'analytics',
  },
  {
    path: '/api/detect/ai-content',
    method: 'GET',
    description: 'AI-generated content detection',
    category: 'analytics',
  },
  {
    path: '/api/coverage-gap',
    method: 'GET',
    description: 'News coverage gaps',
    category: 'analytics',
  },

  // ─── Trading & Derivatives ─────────────────────────────────────────────
  {
    path: '/api/derivatives',
    method: 'GET',
    description: 'Derivatives overview',
    category: 'trading',
  },
  {
    path: '/api/derivatives/bybit/tickers',
    method: 'GET',
    description: 'Bybit futures tickers',
    category: 'trading',
  },
  {
    path: '/api/derivatives/bybit/funding/:symbol',
    method: 'GET',
    description: 'Bybit funding rates',
    category: 'trading',
    params: { symbol: 'Trading pair' },
  },
  {
    path: '/api/derivatives/bybit/open-interest/:symbol',
    method: 'GET',
    description: 'Bybit open interest',
    category: 'trading',
    params: { symbol: 'Trading pair' },
  },
  {
    path: '/api/derivatives/okx/tickers',
    method: 'GET',
    description: 'OKX futures tickers',
    category: 'trading',
  },
  {
    path: '/api/derivatives/okx/funding',
    method: 'GET',
    description: 'OKX funding rates',
    category: 'trading',
  },
  {
    path: '/api/derivatives/okx/open-interest',
    method: 'GET',
    description: 'OKX open interest',
    category: 'trading',
  },
  {
    path: '/api/derivatives/dydx/markets',
    method: 'GET',
    description: 'dYdX perpetual markets',
    category: 'trading',
  },
  {
    path: '/api/derivatives/aggregated/funding',
    method: 'GET',
    description: 'Cross-exchange funding rates',
    category: 'trading',
  },
  {
    path: '/api/derivatives/aggregated/open-interest',
    method: 'GET',
    description: 'Cross-exchange open interest',
    category: 'trading',
  },
  {
    path: '/api/derivatives/opportunities',
    method: 'GET',
    description: 'Derivatives trading opportunities',
    category: 'trading',
  },
  {
    path: '/api/trading/options',
    method: 'GET',
    description: 'Options market data',
    category: 'trading',
  },
  {
    path: '/api/trading/arbitrage',
    method: 'GET',
    description: 'Arbitrage opportunities',
    category: 'trading',
  },
  {
    path: '/api/trading/orderbook',
    method: 'GET',
    description: 'Orderbook depth data',
    category: 'trading',
  },
  {
    path: '/api/orderbook',
    method: 'GET',
    description: 'Aggregated orderbook',
    category: 'trading',
  },
  {
    path: '/api/orderbook/stream',
    method: 'GET',
    description: 'SSE orderbook stream',
    category: 'trading',
  },
  {
    path: '/api/liquidations',
    method: 'GET',
    description: 'Liquidation events',
    category: 'trading',
  },
  { path: '/api/options', method: 'GET', description: 'Options data', category: 'trading' },
  {
    path: '/api/hyperliquid',
    method: 'GET',
    description: 'Hyperliquid perps data',
    category: 'trading',
  },
  { path: '/api/funding-rates', method: 'GET', description: 'Funding rates', category: 'trading' },
  {
    path: '/api/funding/history/:symbol',
    method: 'GET',
    description: 'Funding rate history',
    category: 'trading',
    params: { symbol: 'Trading pair' },
  },
  {
    path: '/api/funding/dashboard',
    method: 'GET',
    description: 'Funding rate dashboard',
    category: 'trading',
  },
  {
    path: '/api/arbitrage',
    method: 'GET',
    description: 'Cross-exchange arbitrage',
    category: 'trading',
  },
  {
    path: '/api/backtest',
    method: 'GET',
    description: 'Strategy backtesting',
    category: 'trading',
  },
  {
    path: '/api/research/backtest',
    method: 'GET',
    description: 'Research backtester',
    category: 'trading',
  },

  // ─── AI & Analysis ─────────────────────────────────────────────────────
  { path: '/api/ai', method: 'GET', description: 'AI capabilities overview', category: 'ai' },
  { path: '/api/ai/oracle', method: 'GET', description: 'AI market oracle', category: 'ai' },
  {
    path: '/api/ai/portfolio-news',
    method: 'GET',
    description: 'AI-curated portfolio news',
    category: 'ai',
  },
  {
    path: '/api/ai/relationships',
    method: 'GET',
    description: 'Entity relationship mapping',
    category: 'ai',
  },
  {
    path: '/api/ai/source-quality',
    method: 'GET',
    description: 'Source quality analysis',
    category: 'ai',
  },
  {
    path: '/api/ai/flash-briefing',
    method: 'GET',
    description: 'AI flash briefing',
    category: 'ai',
  },
  { path: '/api/ai/brief', method: 'GET', description: 'AI market brief', category: 'ai' },
  {
    path: '/api/ai/cross-lingual',
    method: 'GET',
    description: 'Cross-lingual analysis',
    category: 'ai',
  },
  {
    path: '/api/ai/synthesize',
    method: 'GET',
    description: 'Multi-source synthesis',
    category: 'ai',
  },
  {
    path: '/api/ai/explain',
    method: 'GET',
    description: 'Explain crypto concepts',
    category: 'ai',
  },
  {
    path: '/api/ai/debate',
    method: 'GET',
    description: 'AI debate on market thesis',
    category: 'ai',
  },
  { path: '/api/ai/summarize', method: 'GET', description: 'Article summarizer', category: 'ai' },
  {
    path: '/api/ai/summarize/stream',
    method: 'GET',
    description: 'Streaming summarizer',
    category: 'ai',
  },
  { path: '/api/ai/social', method: 'GET', description: 'AI social analysis', category: 'ai' },
  { path: '/api/ai/research', method: 'GET', description: 'AI research assistant', category: 'ai' },
  {
    path: '/api/ai/counter',
    method: 'GET',
    description: 'Counter-argument generator',
    category: 'ai',
  },
  { path: '/api/ai/digest', method: 'GET', description: 'AI-generated digest', category: 'ai' },
  {
    path: '/api/ai/entities',
    method: 'GET',
    description: 'Named entity recognition',
    category: 'ai',
  },
  {
    path: '/api/ai/entities/extract',
    method: 'POST',
    description: 'Extract entities from text',
    category: 'ai',
  },
  { path: '/api/ai/narratives', method: 'GET', description: 'Narrative detection', category: 'ai' },
  {
    path: '/api/ai/blog-generator',
    method: 'POST',
    description: 'AI blog post generator',
    category: 'ai',
  },
  { path: '/api/ai/agent', method: 'POST', description: 'AI agent interaction', category: 'ai' },
  {
    path: '/api/ai/agent/orchestrator',
    method: 'POST',
    description: 'Multi-agent orchestrator',
    category: 'ai',
  },
  {
    path: '/api/ai/correlation',
    method: 'GET',
    description: 'AI correlation analysis',
    category: 'ai',
  },
  { path: '/api/ask', method: 'GET', description: 'Ask anything about crypto', category: 'ai' },
  { path: '/api/forecast', method: 'GET', description: 'Price forecasting', category: 'ai' },
  {
    path: '/api/chart-analysis',
    method: 'GET',
    description: 'AI chart pattern analysis',
    category: 'ai',
  },
  {
    path: '/api/translate',
    method: 'GET',
    description: 'Translate crypto content',
    category: 'ai',
  },

  // ─── RAG (Retrieval Augmented Generation) ──────────────────────────────
  { path: '/api/rag', method: 'GET', description: 'RAG capabilities overview', category: 'rag' },
  { path: '/api/rag/ask', method: 'POST', description: 'Ask with RAG context', category: 'rag' },
  { path: '/api/rag/batch', method: 'POST', description: 'Batch RAG queries', category: 'rag' },
  { path: '/api/rag/stats', method: 'GET', description: 'RAG index stats', category: 'rag' },
  {
    path: '/api/rag/personalization',
    method: 'GET',
    description: 'Personalized RAG',
    category: 'rag',
  },
  {
    path: '/api/rag/similar/:id',
    method: 'GET',
    description: 'Similar articles to ID',
    category: 'rag',
    params: { id: 'Article ID' },
  },
  { path: '/api/rag/search', method: 'GET', description: 'RAG-powered search', category: 'rag' },
  {
    path: '/api/rag/feedback',
    method: 'POST',
    description: 'Submit RAG feedback',
    category: 'rag',
  },
  { path: '/api/rag/eval', method: 'GET', description: 'RAG evaluation metrics', category: 'rag' },
  {
    path: '/api/rag/summary/:crypto',
    method: 'GET',
    description: 'RAG summary for a crypto',
    category: 'rag',
    params: { crypto: 'Crypto symbol or name' },
  },
  {
    path: '/api/rag/stream',
    method: 'GET',
    description: 'Streaming RAG response',
    category: 'rag',
  },
  { path: '/api/rag/timeline', method: 'GET', description: 'RAG timeline view', category: 'rag' },
  {
    path: '/api/rag/metrics',
    method: 'GET',
    description: 'RAG performance metrics',
    category: 'rag',
  },

  // ─── Portfolio ─────────────────────────────────────────────────────────
  {
    path: '/api/portfolio',
    method: 'GET',
    description: 'Portfolio overview',
    category: 'portfolio',
  },
  {
    path: '/api/portfolio/holding',
    method: 'GET',
    description: 'Individual holding details',
    category: 'portfolio',
  },
  {
    path: '/api/portfolio/performance',
    method: 'GET',
    description: 'Portfolio performance',
    category: 'portfolio',
  },
  {
    path: '/api/portfolio/tax',
    method: 'GET',
    description: 'Tax information',
    category: 'portfolio',
  },
  {
    path: '/api/portfolio/tax-report',
    method: 'GET',
    description: 'Tax report generator',
    category: 'portfolio',
  },
  {
    path: '/api/portfolio/benchmark',
    method: 'GET',
    description: 'Portfolio vs benchmarks',
    category: 'portfolio',
  },
  {
    path: '/api/portfolio/correlation',
    method: 'GET',
    description: 'Asset correlation matrix',
    category: 'portfolio',
  },
  {
    path: '/api/watchlist',
    method: 'GET',
    description: 'Watchlist management',
    category: 'portfolio',
  },

  // ─── Whales & Flows ────────────────────────────────────────────────────
  { path: '/api/whales', method: 'GET', description: 'Whale activity', category: 'whales' },
  {
    path: '/api/whale-alerts',
    method: 'GET',
    description: 'Whale transaction alerts',
    category: 'whales',
  },
  {
    path: '/api/whale-alerts/context',
    method: 'GET',
    description: 'Whale alerts with market context',
    category: 'whales',
  },
  { path: '/api/flows', method: 'GET', description: 'Capital flows', category: 'whales' },

  // ─── Layer 2 & Chains ──────────────────────────────────────────────────
  { path: '/api/l2', method: 'GET', description: 'Layer 2 overview', category: 'chains' },
  { path: '/api/l2/projects', method: 'GET', description: 'L2 project list', category: 'chains' },
  {
    path: '/api/l2/projects/:projectId',
    method: 'GET',
    description: 'L2 project details',
    category: 'chains',
    params: { projectId: 'Project ID' },
  },
  {
    path: '/api/l2/activity',
    method: 'GET',
    description: 'L2 activity metrics',
    category: 'chains',
  },
  { path: '/api/l2/risk', method: 'GET', description: 'L2 risk assessments', category: 'chains' },
  { path: '/api/aptos', method: 'GET', description: 'Aptos chain data', category: 'chains' },
  { path: '/api/aptos/events', method: 'GET', description: 'Aptos events', category: 'chains' },
  {
    path: '/api/aptos/transactions',
    method: 'GET',
    description: 'Aptos transactions',
    category: 'chains',
  },
  {
    path: '/api/aptos/resources',
    method: 'GET',
    description: 'Aptos account resources',
    category: 'chains',
  },
  { path: '/api/sui', method: 'GET', description: 'Sui chain data', category: 'chains' },
  {
    path: '/api/sui/transactions',
    method: 'GET',
    description: 'Sui transactions',
    category: 'chains',
  },
  { path: '/api/sui/objects', method: 'GET', description: 'Sui objects', category: 'chains' },
  { path: '/api/sui/balances', method: 'GET', description: 'Sui balances', category: 'chains' },

  // ─── Gaming & NFT ──────────────────────────────────────────────────────
  { path: '/api/gaming', method: 'GET', description: 'Crypto gaming overview', category: 'gaming' },
  { path: '/api/gaming/chains', method: 'GET', description: 'Gaming by chain', category: 'gaming' },
  { path: '/api/gaming/top', method: 'GET', description: 'Top crypto games', category: 'gaming' },
  { path: '/api/nft', method: 'GET', description: 'NFT market data', category: 'gaming' },
  {
    path: '/api/nft/collections',
    method: 'GET',
    description: 'NFT collection rankings',
    category: 'gaming',
  },
  { path: '/api/nft/trending', method: 'GET', description: 'Trending NFTs', category: 'gaming' },
  {
    path: '/api/airdrops',
    method: 'GET',
    description: 'Active and upcoming airdrops',
    category: 'gaming',
  },

  // ─── Macro & Economics ─────────────────────────────────────────────────
  { path: '/api/macro', method: 'GET', description: 'Macro economic overview', category: 'macro' },
  {
    path: '/api/macro/indicators',
    method: 'GET',
    description: 'Economic indicators',
    category: 'macro',
  },
  {
    path: '/api/macro/risk-appetite',
    method: 'GET',
    description: 'Risk appetite metrics',
    category: 'macro',
  },
  { path: '/api/macro/fed', method: 'GET', description: 'Fed policy and rates', category: 'macro' },
  { path: '/api/macro/dxy', method: 'GET', description: 'US Dollar Index', category: 'macro' },
  {
    path: '/api/macro/correlations',
    method: 'GET',
    description: 'Crypto-macro correlations',
    category: 'macro',
  },

  // ─── Data Aggregators ──────────────────────────────────────────────────
  {
    path: '/api/coincap',
    method: 'GET',
    description: 'CoinCap market data',
    category: 'aggregator',
  },
  {
    path: '/api/coincap/assets/:id',
    method: 'GET',
    description: 'CoinCap asset detail',
    category: 'aggregator',
    params: { id: 'Asset ID' },
  },
  {
    path: '/api/coinpaprika/coins',
    method: 'GET',
    description: 'CoinPaprika coins',
    category: 'aggregator',
  },
  {
    path: '/api/coinpaprika/search',
    method: 'GET',
    description: 'CoinPaprika search',
    category: 'aggregator',
  },
  {
    path: '/api/coinpaprika/exchanges',
    method: 'GET',
    description: 'CoinPaprika exchanges',
    category: 'aggregator',
  },
  {
    path: '/api/geckoterminal',
    method: 'GET',
    description: 'GeckoTerminal DEX data',
    category: 'aggregator',
  },
  {
    path: '/api/cryptocompare',
    method: 'GET',
    description: 'CryptoCompare data',
    category: 'aggregator',
  },
  {
    path: '/api/coinmarketcap',
    method: 'GET',
    description: 'CoinMarketCap data',
    category: 'aggregator',
  },
  {
    path: '/api/nansen',
    method: 'GET',
    description: 'Nansen on-chain labels',
    category: 'aggregator',
  },
  {
    path: '/api/dune',
    method: 'GET',
    description: 'Dune Analytics queries',
    category: 'aggregator',
  },
  {
    path: '/api/tokenterminal',
    method: 'GET',
    description: 'Token Terminal metrics',
    category: 'aggregator',
  },
  {
    path: '/api/cryptopanic',
    method: 'GET',
    description: 'CryptoPanic news feed',
    category: 'aggregator',
  },
  {
    path: '/api/rss-proxy',
    method: 'GET',
    description: 'RSS proxy for external feeds',
    category: 'aggregator',
  },

  // ─── Oracle & Validators ───────────────────────────────────────────────
  { path: '/api/oracle', method: 'GET', description: 'Price oracle data', category: 'oracle' },
  {
    path: '/api/oracle/chainlink',
    method: 'GET',
    description: 'Chainlink price feeds',
    category: 'oracle',
  },
  {
    path: '/api/oracle/prices',
    method: 'GET',
    description: 'Oracle price aggregation',
    category: 'oracle',
  },
  {
    path: '/api/validators',
    method: 'GET',
    description: 'Validator / staking data',
    category: 'oracle',
  },

  // ─── Data Sources & Integrations ───────────────────────────────────────
  {
    path: '/api/data-sources',
    method: 'GET',
    description: 'Available data sources',
    category: 'data',
  },
  {
    path: '/api/data-sources/onchain',
    method: 'GET',
    description: 'On-chain data sources',
    category: 'data',
  },
  {
    path: '/api/data-sources/derivatives',
    method: 'GET',
    description: 'Derivatives data sources',
    category: 'data',
  },
  {
    path: '/api/data-sources/social',
    method: 'GET',
    description: 'Social data sources',
    category: 'data',
  },
  {
    path: '/api/data-sources/defi/dashboard',
    method: 'GET',
    description: 'DeFi data dashboard',
    category: 'data',
  },
  {
    path: '/api/integrations/tradingview',
    method: 'GET',
    description: 'TradingView integration',
    category: 'data',
  },
  {
    path: '/api/tradingview',
    method: 'GET',
    description: 'TradingView widget data',
    category: 'data',
  },

  // ─── Export & Storage ──────────────────────────────────────────────────
  { path: '/api/export', method: 'GET', description: 'Data export (CSV/JSON)', category: 'export' },
  { path: '/api/export/jobs', method: 'GET', description: 'Export job list', category: 'export' },
  {
    path: '/api/export/jobs/:jobId',
    method: 'GET',
    description: 'Export job status',
    category: 'export',
    params: { jobId: 'Job ID' },
  },
  { path: '/api/batch', method: 'POST', description: 'Batch API requests', category: 'export' },
  {
    path: '/api/storage/cas',
    method: 'GET',
    description: 'Content-addressable storage',
    category: 'export',
  },

  // ─── Archive ───────────────────────────────────────────────────────────
  {
    path: '/api/archive',
    method: 'GET',
    description: 'Historical news archive',
    category: 'archive',
  },
  {
    path: '/api/archive/v2',
    method: 'GET',
    description: 'Archive v2 with enhanced metadata',
    category: 'archive',
  },
  {
    path: '/api/archive/ipfs',
    method: 'GET',
    description: 'IPFS-pinned archive',
    category: 'archive',
  },
  {
    path: '/api/archive/status',
    method: 'GET',
    description: 'Archive pipeline status',
    category: 'archive',
  },

  // ─── Billing & Accounts ────────────────────────────────────────────────
  { path: '/api/billing', method: 'GET', description: 'Billing overview', category: 'billing' },
  {
    path: '/api/billing/usage',
    method: 'GET',
    description: 'Usage and billing details',
    category: 'billing',
  },
  { path: '/api/upgrade', method: 'GET', description: 'Upgrade options', category: 'billing' },

  // ─── Premium ───────────────────────────────────────────────────────────
  {
    path: '/api/premium',
    method: 'GET',
    description: 'Premium API documentation and pricing',
    category: 'premium',
  },
  {
    path: '/api/premium/ai/sentiment',
    method: 'GET',
    description: 'AI sentiment analysis',
    category: 'premium',
  },
  {
    path: '/api/premium/ai/signals',
    method: 'GET',
    description: 'AI buy/sell signals',
    category: 'premium',
  },
  {
    path: '/api/premium/ai/summary',
    method: 'GET',
    description: 'AI crypto summary',
    category: 'premium',
  },
  {
    path: '/api/premium/ai/compare',
    method: 'GET',
    description: 'AI asset comparison',
    category: 'premium',
  },
  {
    path: '/api/premium/ai/analyze',
    method: 'GET',
    description: 'AI deep analysis',
    category: 'premium',
  },
  {
    path: '/api/premium/whales/transactions',
    method: 'GET',
    description: 'Whale transaction tracking',
    category: 'premium',
  },
  {
    path: '/api/premium/whales/alerts',
    method: 'GET',
    description: 'Whale alert subscriptions',
    category: 'premium',
  },
  {
    path: '/api/premium/smart-money',
    method: 'GET',
    description: 'Smart money tracking',
    category: 'premium',
  },
  {
    path: '/api/premium/screener/advanced',
    method: 'GET',
    description: 'Advanced screener',
    category: 'premium',
  },
  {
    path: '/api/premium/market/coins',
    method: 'GET',
    description: 'Extended coin data (500+)',
    category: 'premium',
  },
  {
    path: '/api/premium/market/history',
    method: 'GET',
    description: 'Extended historical data (5yr)',
    category: 'premium',
  },
  {
    path: '/api/premium/defi/protocols',
    method: 'GET',
    description: 'Full DeFi protocol data (500+)',
    category: 'premium',
  },
  {
    path: '/api/premium/export/portfolio',
    method: 'GET',
    description: 'Portfolio CSV/JSON export',
    category: 'premium',
  },
  {
    path: '/api/premium/analytics/screener',
    method: 'GET',
    description: 'Analytics screener',
    category: 'premium',
  },
  {
    path: '/api/premium/portfolio/analytics',
    method: 'GET',
    description: 'Portfolio analytics',
    category: 'premium',
  },
  {
    path: '/api/premium/alerts/custom',
    method: 'POST',
    description: 'Custom price alerts',
    category: 'premium',
  },
  {
    path: '/api/premium/alerts/whales',
    method: 'GET',
    description: 'Whale alerts',
    category: 'premium',
  },
  {
    path: '/api/premium/streams/prices',
    method: 'GET',
    description: 'Premium price streaming',
    category: 'premium',
  },

  // ─── V1 API (versioned) ────────────────────────────────────────────────
  { path: '/api/v1/news', method: 'GET', description: 'Versioned news endpoint', category: 'v1' },
  { path: '/api/v1/coins', method: 'GET', description: 'Versioned coin list', category: 'v1' },
  {
    path: '/api/v1/coin/:coinId',
    method: 'GET',
    description: 'Versioned coin detail',
    category: 'v1',
    params: { coinId: 'CoinGecko coin ID' },
  },
  {
    path: '/api/v1/market-data',
    method: 'GET',
    description: 'Versioned market data',
    category: 'v1',
  },
  { path: '/api/v1/trending', method: 'GET', description: 'Versioned trending', category: 'v1' },
  { path: '/api/v1/gas', method: 'GET', description: 'Versioned gas prices', category: 'v1' },
  { path: '/api/v1/exchanges', method: 'GET', description: 'Versioned exchanges', category: 'v1' },
  { path: '/api/v1/search', method: 'GET', description: 'Versioned search', category: 'v1' },
  { path: '/api/v1/ohlcv', method: 'GET', description: 'Versioned OHLCV', category: 'v1' },
  { path: '/api/v1/orderbook', method: 'GET', description: 'Versioned orderbook', category: 'v1' },
  {
    path: '/api/v1/fear-greed',
    method: 'GET',
    description: 'Versioned Fear & Greed',
    category: 'v1',
  },
  {
    path: '/api/v1/stablecoins',
    method: 'GET',
    description: 'Versioned stablecoins',
    category: 'v1',
  },
  { path: '/api/v1/bitcoin', method: 'GET', description: 'Versioned Bitcoin data', category: 'v1' },
  { path: '/api/v1/sentiment', method: 'GET', description: 'Versioned sentiment', category: 'v1' },
  {
    path: '/api/v1/narratives',
    method: 'GET',
    description: 'Versioned narratives',
    category: 'v1',
  },
  { path: '/api/v1/digest', method: 'GET', description: 'Versioned digest', category: 'v1' },
  { path: '/api/v1/summarize', method: 'GET', description: 'Versioned summarize', category: 'v1' },
  { path: '/api/v1/ask', method: 'GET', description: 'Versioned ask', category: 'v1' },
  { path: '/api/v1/forecast', method: 'GET', description: 'Versioned forecast', category: 'v1' },
  { path: '/api/v1/classify', method: 'GET', description: 'Versioned classify', category: 'v1' },
  {
    path: '/api/v1/ai/research',
    method: 'GET',
    description: 'Versioned AI research',
    category: 'v1',
  },
  {
    path: '/api/v1/ai/explain',
    method: 'GET',
    description: 'Versioned AI explain',
    category: 'v1',
  },
  {
    path: '/api/v1/derivatives',
    method: 'GET',
    description: 'Versioned derivatives',
    category: 'v1',
  },
  { path: '/api/v1/signals', method: 'GET', description: 'Versioned signals', category: 'v1' },
  {
    path: '/api/v1/liquidations',
    method: 'GET',
    description: 'Versioned liquidations',
    category: 'v1',
  },
  { path: '/api/v1/defi', method: 'GET', description: 'Versioned DeFi', category: 'v1' },
  { path: '/api/v1/dex', method: 'GET', description: 'Versioned DEX data', category: 'v1' },
  { path: '/api/v1/onchain', method: 'GET', description: 'Versioned on-chain', category: 'v1' },
  {
    path: '/api/v1/whale-alerts',
    method: 'GET',
    description: 'Versioned whale alerts',
    category: 'v1',
  },
  { path: '/api/v1/solana', method: 'GET', description: 'Versioned Solana', category: 'v1' },
  { path: '/api/v1/l2', method: 'GET', description: 'Versioned L2 data', category: 'v1' },
  { path: '/api/v1/social', method: 'GET', description: 'Versioned social', category: 'v1' },
  {
    path: '/api/v1/predictions',
    method: 'GET',
    description: 'Versioned predictions',
    category: 'v1',
  },
  { path: '/api/v1/alerts', method: 'GET', description: 'Versioned alerts', category: 'v1' },
  { path: '/api/v1/export', method: 'GET', description: 'Versioned export', category: 'v1' },
  {
    path: '/api/v1/historical/:coinId',
    method: 'GET',
    description: 'Versioned historical data',
    category: 'v1',
    params: { coinId: 'Coin ID' },
  },
  {
    path: '/api/v1/categories',
    method: 'GET',
    description: 'Versioned categories',
    category: 'v1',
  },
  { path: '/api/v1/sources', method: 'GET', description: 'Versioned sources', category: 'v1' },
  { path: '/api/v1/tags', method: 'GET', description: 'Versioned tags', category: 'v1' },
  {
    path: '/api/v1/fundamentals',
    method: 'GET',
    description: 'Versioned fundamentals',
    category: 'v1',
  },
  {
    path: '/api/v1/knowledge-graph',
    method: 'GET',
    description: 'Crypto knowledge graph',
    category: 'v1',
  },
  { path: '/api/v1/assets', method: 'GET', description: 'Versioned asset list', category: 'v1' },
  {
    path: '/api/v1/assets/:assetId/history',
    method: 'GET',
    description: 'Asset price history',
    category: 'v1',
    params: { assetId: 'Asset ID' },
  },
  { path: '/api/v1/rss', method: 'GET', description: 'Versioned RSS feed', category: 'v1' },
  { path: '/api/v1/sse', method: 'GET', description: 'Versioned SSE stream', category: 'v1' },
];

// ─── Build pricing lookup ────────────────────────────────────────────────────

function getRoutePrice(path: string): string | null {
  // Check v1 pricing
  const v1Price = (API_PRICING as Record<string, string>)[path];
  if (v1Price) return v1Price;

  // Check premium pricing
  const premiumConfig = (PREMIUM_PRICING as Record<string, { price: number }>)[path];
  if (premiumConfig) return `$${premiumConfig.price}`;

  return null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Only serve to SperaxOS (internal route — exempt from x402 via EXEMPT_PATTERNS)
  const isSperax = await isSperaxOSRequest(request);
  if (!isSperax) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        code: 'SPERAX_ONLY',
        message: 'This endpoint is restricted to SperaxOS.',
      },
      { status: 403 },
    );
  }

  const baseUrl = SITE_URL;

  // Build categorized manifest
  const categories = new Map<string, { routes: typeof enriched; count: number }>();
  const enriched = ROUTES.map((r) => ({
    ...r,
    url: `${baseUrl}${r.path}`,
    price: getRoutePrice(r.path) ?? '$0.001', // default x402 price for unlisted routes
  }));

  for (const route of enriched) {
    const cat = categories.get(route.category) ?? { routes: [] as typeof enriched, count: 0 };
    cat.routes.push(route);
    cat.count++;
    categories.set(route.category, cat);
  }

  const grouped: Record<string, { routes: typeof enriched; count: number }> = {};
  categories.forEach((val, key) => {
    grouped[key] = val;
  });

  return NextResponse.json({
    _meta: {
      generated: new Date().toISOString(),
      baseUrl,
      totalRoutes: ROUTES.length,
      totalCategories: categories.size,
      auth: {
        header: 'x-speraxos-token',
        description:
          'Include this header on every request. SperaxOS requests are unlimited and bypass all rate limits and payment gates.',
      },
      notes: [
        'All routes are accessible to SperaxOS with the x-speraxos-token header.',
        'No rate limits apply. No x402 payment required.',
        'Routes with :param segments require substitution (e.g. /api/bitcoin/blocks/:hash → /api/bitcoin/blocks/00000...).',
        'Most routes accept ?limit, ?offset, ?sort query parameters.',
        'POST routes expect JSON body. Check individual route docs for schema.',
      ],
    },
    categories: grouped,
    routes: enriched,
  });
}
