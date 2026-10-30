# 📊 Data API Integrations

Comprehensive guide to all external data API integrations available in Free Crypto News.

## Overview

The platform integrates with 10+ professional data APIs organized into namespaced modules for clean imports:

```typescript
import { 
  coinmarketcap, 
  defillama, 
  glassnode, 
  cryptoquant,
  l2beat,
  lunarcrush,
  messari,
  nftMarkets,
  newsFeeds,
  thegraph
} from '@/lib/apis';
```

---

## Quick Reference

| API | Cost | Rate Limit | Best For |
|-----|------|------------|----------|
| [DefiLlama](#defillama) | **Free** | Generous | DeFi TVL, yields, protocols |
| [L2Beat](#l2beat) | **Free** | Moderate | Layer 2 analytics, risk |
| [growthepie](#growthepie) | **Free** | Moderate | Median transaction fee per chain |
| [Messari](#messari) | Free tier | 20/min | Research-grade data |
| [NFT Markets](#nft-markets) | Free tier | 120/min | NFT collections, sales |
| [News Feeds](#news-feeds) | Free tier | 100/day | Crypto news, regulatory |
| [CoinMarketCap](#coinmarketcap) | $29-299/mo | 30/min | Market rankings |
| [LunarCrush](#lunarcrush) | $99/mo | 100/min | Social sentiment |
| [Glassnode](#glassnode) | $29-799/mo | Varies | On-chain metrics |
| [CryptoQuant](#cryptoquant) | $49/mo | Varies | Exchange flows |
| [The Graph](#the-graph) | Pay/query | Unlimited | DeFi subgraphs |

---

## Environment Variables

Add these to your `.env.local`:

```bash
# FREE (no key needed)
# DefiLlama, L2Beat work without authentication

# FREEMIUM (optional, for higher limits)
MESSARI_API_KEY=your_messari_key
OPENSEA_API_KEY=your_opensea_key
RESERVOIR_API_KEY=your_reservoir_key
CRYPTOPANIC_API_KEY=your_cryptopanic_key
NEWSAPI_API_KEY=your_newsapi_key

# PAID (required for full functionality)
COINMARKETCAP_API_KEY=your_cmc_key
LUNARCRUSH_API_KEY=your_lunarcrush_key
GLASSNODE_API_KEY=your_glassnode_key
CRYPTOQUANT_API_KEY=your_cryptoquant_key
THEGRAPH_API_KEY=your_thegraph_key
```

---

## DefiLlama

**Free** | No API key required | [docs](https://defillama.com/docs/api)

Comprehensive DeFi data including TVL, yields, stablecoins, and DEX volumes.

### Functions

```typescript
import { defillama } from '@/lib/apis';

// Get all protocols with TVL
const protocols = await defillama.getProtocols();

// Get TVL by chain
const chains = await defillama.getChainTVL();

// Get yield pools (with filters)
const yields = await defillama.getYieldPools({
  chain: 'ethereum',
  stablecoinsOnly: true,
  minTvl: 1000000,
  minApy: 5,
});

// Get top yields (risk-adjusted)
const topYields = await defillama.getTopYields(20);

// Get stablecoin data
const stables = await defillama.getStablecoins();

// Get DEX volumes
const dexVolumes = await defillama.getDexVolumes();

// Get bridge data
const bridges = await defillama.getBridges();

// Get comprehensive summary
const summary = await defillama.getDefiSummary();
```

### Types

```typescript
interface Protocol {
  id: string;
  name: string;
  tvl: number;
  tvlChange24h: number;
  category: string;
  chains: string[];
}

interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  stablecoin: boolean;
}

interface DefiSummary {
  totalTvl: number;
  totalTvlChange24h: number;
  chainDistribution: Record<string, number>;
  topProtocols: Protocol[];
  topYields: YieldPool[];
  stablecoinSupply: number;
  dexVolume24h: number;
}
```

---

## L2Beat

**Free** | No API key required | [l2beat.com](https://l2beat.com)

Layer 2 analytics including TVL, risk assessments, and activity metrics.

### Functions

```typescript
import { l2beat } from '@/lib/apis';

// Get all L2 projects
const projects = await l2beat.getL2Projects();

// Get risk assessment for specific L2
const risk = await l2beat.getL2RiskAssessment('arbitrum');

// Get L2 activity metrics
const activity = await l2beat.getL2Activity();

// Get comprehensive L2 summary
const summary = await l2beat.getL2Summary();
```

### Types

```typescript
interface L2Project {
  id: string;
  name: string;
  type: 'rollup' | 'validium' | 'optimium' | 'plasma';
  category: 'Optimistic Rollup' | 'ZK Rollup' | 'Validium';
  tvl: number; // total value secured (canonical + external + native), USD
  tvlChange7d: number; // percent
  stage: 'Stage 0' | 'Stage 1' | 'Stage 2' | 'Not applicable';
  riskLevel: 'low' | 'medium' | 'high';
}

interface L2RiskAssessment {
  projectId: string;
  stateValidation: { value: string; sentiment: 'good' | 'warning' | 'bad' };
  dataAvailability: { value: string; sentiment: 'good' | 'warning' | 'bad' };
  upgradeability: { value: string; sentiment: 'good' | 'warning' | 'bad' };
  overallRiskScore: number; // 0-100
}

interface L2Summary {
  totalTvl: number;
  totalProjects: number;
  dominance: Record<string, number>;
  topProjects: L2Project[];
  riskDistribution: { low: number; medium: number; high: number };
}
```

---

## growthepie

**Free** | No API key required | [growthepie.com](https://www.growthepie.com/fees)

Hourly median transaction cost for Ethereum L1 and its L2s, from
`https://api.growthepie.com/v1/fees/table.json`. Powers the fee chart and the
"Avg Fee" column on `/l2`.

```typescript
import { growthepie } from '@/lib/apis';

// Latest hourly median per chain, most expensive first ([] if unreachable)
const fees = await growthepie.getChainFees();
// [{ chain: 'ethereum', name: 'Ethereum L1', usd: 0.038, eth: 0.000017, timestamp: 1793390400000 }, ...]

// Join onto L2Beat rows by slug ('op-mainnet', 'zksync-era', ...)
const feeUsd = growthepie.feesBySlug(fees).get('arbitrum');
```

growthepie rounds `value_usd` to four decimals, so sub-cent fees are priced from
`value_eth` at the ETH price implied by the other chains.

---

## Messari

**Freemium** | API key optional | [messari.io/api](https://messari.io/api)

Research-grade cryptocurrency data with asset profiles and market intelligence.

### Functions

```typescript
import { messari } from '@/lib/apis';

// Get asset by symbol
const btc = await messari.getAsset('BTC');

// Get detailed asset profile
const profile = await messari.getAssetProfile('ETH');

// Get asset metrics
const metrics = await messari.getAssetMetrics('SOL');

// Get all assets
const assets = await messari.getAllAssets({ limit: 50, sort: 'market_cap' });

// Get news and research
const news = await messari.getNews({ assetSymbol: 'BTC', limit: 10 });

// Get ROI data
const roi = await messari.getRoiData('ETH');

// Get developer activity
const devActivity = await messari.getDeveloperActivity('ETH');

// Get comprehensive market intelligence
const intel = await messari.getMarketIntelligence();

// Compare multiple assets
const comparison = await messari.compareAssets(['BTC', 'ETH', 'SOL']);
```

### Types

```typescript
interface MessariAsset {
  id: string;
  symbol: string;
  name: string;
  profile: AssetProfile;
  metrics: AssetMetrics;
  marketData: MarketData;
}

interface AssetMetrics {
  marketcap: { rank: number; currentMarketcapUsd: number };
  supply: { circulating: number; stockToFlow: number };
  allTimeHigh: { price: number; percentDown: number };
  developerActivity: { commits30d: number; stars: number };
  onChainData: { txnCount24h: number; activeAddresses: number; nvt: number };
}

interface MarketIntelligence {
  topAssets: MessariAsset[];
  marketTrends: { direction: 'bullish' | 'bearish' | 'neutral'; signals: string[] };
  sectorPerformance: Record<string, number>;
  latestResearch: MessariNews[];
}
```

---

## The Graph

**Pay per query** | API key required | [thegraph.com](https://thegraph.com/docs)

Decentralized indexing for DeFi protocol data via subgraphs.

### Functions

```typescript
import { thegraph } from '@/lib/apis';

// Get Uniswap V3 pools
const pools = await thegraph.getUniswapPools('ethereum', { first: 50 });

// Get recent swaps
const swaps = await thegraph.getUniswapSwaps('arbitrum', { first: 100 });

// Get Aave markets
const aaveMarkets = await thegraph.getAaveMarkets('ethereum');

// Get Aave lending rates
const rates = await thegraph.getAaveLendingRates('polygon');

// Get Curve pools
const curvePools = await thegraph.getCurvePools();

// Get protocol summary
const uniswap = await thegraph.getProtocolData('uniswapV3', 'ethereum');

// Get cross-protocol analysis
const analysis = await thegraph.getCrossProtocolAnalysis();

// Execute custom GraphQL query
const custom = await thegraph.executeCustomQuery(
  'subgraphId',
  `{ pools(first: 10) { id tvl } }`
);

// Get available subgraphs
const subgraphs = thegraph.getAvailableSubgraphs();
```

### Supported Subgraphs

| Protocol | Chains |
|----------|--------|
| Uniswap V3 | Ethereum, Arbitrum, Polygon, Optimism, Base |
| Aave V3 | Ethereum, Arbitrum, Polygon, Optimism |
| Curve Finance | Ethereum |
| Compound V3 | Ethereum |
| GMX | Arbitrum |
| Lido | Ethereum |
| Maker | Ethereum |

---

## NFT Markets

**Freemium** | API keys optional | OpenSea + Reservoir

Aggregated NFT market data from multiple sources.

### Functions

```typescript
import { nftMarkets } from '@/lib/apis';

// Get collection details
const collection = await nftMarkets.getCollection('boredapeyachtclub');

// Get collection stats
const stats = await nftMarkets.getCollectionStats('azuki');

// Get trending collections
const trending = await nftMarkets.getTrendingCollections('24h', 25);

// Get recent sales
const sales = await nftMarkets.getRecentSales(50);

// Get collection activity (sales, bids, listings, transfers)
const activity = await nftMarkets.getCollectionActivity('cryptopunks');

// Get market overview
const overview = await nftMarkets.getNFTMarketOverview();

// Search collections
const results = await nftMarkets.searchCollections('ape', 20);
```

### Types

```typescript
interface NFTCollection {
  slug: string;
  name: string;
  contractAddress: string;
  stats: CollectionStats;
  verified: boolean;
}

interface CollectionStats {
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  sales24h: number;
  numOwners: number;
  totalSupply: number;
  marketCap: number;
}

interface NFTMarketOverview {
  totalVolume24h: number;
  totalSales24h: number;
  topCollections: TrendingCollection[];
  recentSales: NFTSale[];
  volumeByMarketplace: Record<string, number>;
}
```

---

## News Feeds

**Freemium** | API keys optional | CryptoPanic + NewsAPI

Aggregated crypto news with sentiment analysis and regulatory tracking.

### Functions

```typescript
import { newsFeeds } from '@/lib/apis';

// Get crypto news
const news = await newsFeeds.getCryptoNews({
  currencies: ['BTC', 'ETH'],
  pageSize: 50,
});

// Get general crypto news (from NewsAPI)
const general = await newsFeeds.getGeneralCryptoNews({
  query: 'bitcoin regulation',
  sortBy: 'publishedAt',
});

// Get regulatory updates
const regulatory = await newsFeeds.getRegulatoryUpdates({
  country: 'US',
  type: 'enforcement',
  limit: 20,
});

// Get trending topics
const trending = await newsFeeds.getTrendingTopics(10);

// Get comprehensive news summary
const summary = await newsFeeds.getNewsSummary();
```

### Types

```typescript
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: { id: string; name: string };
  publishedAt: string;
  currencies?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories: string[];
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  agency: string;
  country: string;
  type: 'legislation' | 'guidance' | 'enforcement' | 'ruling';
  impactLevel: 'high' | 'medium' | 'low';
  impactedAssets: string[];
}

interface NewsSummary {
  topStories: NewsArticle[];
  regulatoryUpdates: RegulatoryUpdate[];
  trendingTopics: TrendingTopic[];
  sentimentOverview: {
    overall: number;
    bitcoin: number;
    ethereum: number;
    altcoins: number;
  };
}
```

---

## CoinMarketCap

**Paid** | $29-299/mo | [coinmarketcap.com/api](https://coinmarketcap.com/api)

Professional market data with CMC-specific rankings and metrics.

### Functions

```typescript
import { coinmarketcap } from '@/lib/apis';

// Get latest listings
const listings = await coinmarketcap.getLatestListings({
  limit: 100,
  sort: 'market_cap',
  tag: 'defi',
});

// Get global metrics
const global = await coinmarketcap.getGlobalMetrics();

// Get top exchanges
const exchanges = await coinmarketcap.getTopExchanges(25);

// Get gainers and losers
const { gainers, losers } = await coinmarketcap.getGainersLosers(10);

// Get trending
const trending = await coinmarketcap.getTrending();

// Get Fear & Greed Index
const fearGreed = await coinmarketcap.getFearGreedIndex();

// Get comprehensive market summary
const summary = await coinmarketcap.getMarketSummary();

// Get specific cryptocurrency
const btc = await coinmarketcap.getCryptocurrency('BTC');
```

---

## LunarCrush

**Paid** | $99/mo | [lunarcrush.com](https://lunarcrush.com/developers/api)

Social intelligence and sentiment analysis.

### Functions

```typescript
import { lunarcrush } from '@/lib/apis';

// Get social metrics for asset
const metrics = await lunarcrush.getSocialMetrics('bitcoin');

// Get top coins by social activity
const topSocial = await lunarcrush.getTopSocialCoins(25);

// Get top crypto influencers
const influencers = await lunarcrush.getTopInfluencers(50);

// Get trending topics
const trending = await lunarcrush.getTrendingTopics(20);

// Get social feed
const feed = await lunarcrush.getSocialFeed({ asset: 'ethereum', limit: 100 });

// Get market sentiment
const sentiment = await lunarcrush.getMarketSentiment();
```

---

## Glassnode

**Paid** | $29-799/mo | [glassnode.com](https://docs.glassnode.com)

Professional on-chain analytics.

### Functions

```typescript
import { glassnode } from '@/lib/apis';

// Get exchange flows
const flows = await glassnode.getExchangeFlows('BTC');

// Get on-chain metrics
const metrics = await glassnode.getOnChainMetrics('BTC');

// Get miner metrics
const miners = await glassnode.getMinerMetrics('BTC');

// Get long-term holder metrics
const lth = await glassnode.getLongTermHolderMetrics('BTC');

// Get whale metrics
const whales = await glassnode.getWhaleMetrics('BTC');

// Get funding metrics
const funding = await glassnode.getFundingMetrics('BTC');

// Get comprehensive health assessment
const health = await glassnode.getOnChainHealthAssessment('BTC');
```

### Key Metrics

| Metric | Description |
|--------|-------------|
| MVRV | Market Value to Realized Value ratio |
| SOPR | Spent Output Profit Ratio |
| NVT | Network Value to Transactions ratio |
| NUPL | Net Unrealized Profit/Loss |
| Puell Multiple | Miner revenue vs yearly average |

---

## CryptoQuant

**Paid** | $49/mo | [cryptoquant.com](https://cryptoquant.com/docs)

Exchange flow analytics and market indicators.

### Functions

```typescript
import { cryptoquant } from '@/lib/apis';

// Get exchange reserves
const reserves = await cryptoquant.getExchangeReserves('bitcoin');

// Get netflow data
const netflow = await cryptoquant.getExchangeNetflow('bitcoin', 'all');

// Get stablecoin flows
const stableFlows = await cryptoquant.getStablecoinFlows();

// Get miner flows
const minerFlows = await cryptoquant.getMinerFlows('bitcoin');

// Get fund flows
const fundFlows = await cryptoquant.getFundFlows('bitcoin');

// Get market indicators
const indicators = await cryptoquant.getMarketIndicators('bitcoin');

// Get comprehensive flow analysis
const analysis = await cryptoquant.getFlowAnalysis('bitcoin');
```

---

## Error Handling

All API functions return `null` on error and log to console:

```typescript
import { glassnode } from '@/lib/apis';

const data = await glassnode.getExchangeFlows('BTC');

if (!data) {
  // Handle error - API key missing, rate limited, or network error
  console.log('Failed to fetch exchange flows');
}
```

For production, wrap in try-catch:

```typescript
try {
  const data = await glassnode.getExchangeFlows('BTC');
  if (data) {
    // Process data
  }
} catch (error) {
  // Handle unexpected errors
}
```

---

## Caching

All APIs use Next.js `fetch` with `revalidate` for automatic caching:

| API | Cache Duration |
|-----|----------------|
| DefiLlama | 5 minutes |
| L2Beat | 10 minutes |
| Messari | 2 minutes |
| The Graph | 1 minute |
| NFT Markets | 1 minute |
| News Feeds | 1-5 minutes |
| CoinMarketCap | 1 minute |
| LunarCrush | 5 minutes |
| Glassnode | 5 minutes |
| CryptoQuant | 5 minutes |

---

## Legacy APIs

These APIs exist at `/src/lib/` level (not in `/src/lib/apis/`):

| File | Description |
|------|-------------|
| `binance.ts` | Binance exchange data |
| `coincap.ts` | CoinCap market data |
| `coinpaprika.ts` | CoinPaprika fallback |
| `groq.ts` | Groq AI inference |
| `external-apis.ts` | Utility functions |
| `market-data.ts` | Aggregated market data |

Import these directly:

```typescript
import { getBinanceTicker } from '@/lib/binance';
import { getMarketData } from '@/lib/market-data';
```
