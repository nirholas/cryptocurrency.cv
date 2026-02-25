/**
 * Data Source Registry — Comprehensive catalog of 50+ crypto data APIs
 *
 * Every external data source the platform can integrate with, including:
 * - Connection details (base URL, auth method, rate limits)
 * - Data categories each source provides
 * - Signup URLs for APIs requiring accounts
 * - Tier/pricing information
 * - Health check endpoints
 *
 * This registry is the single source of truth for what data is available.
 * Provider adapters reference this to configure their connections.
 *
 * @module lib/data-sources
 */

// =============================================================================
// TYPES
// =============================================================================

export type AuthMethod = 'none' | 'api-key-header' | 'api-key-query' | 'bearer' | 'basic' | 'hmac' | 'oauth2';

export type DataSourceTier = 'free' | 'freemium' | 'paid' | 'enterprise';

export type DataSourceCategory =
  | 'market-data'
  | 'derivatives'
  | 'defi'
  | 'on-chain'
  | 'social'
  | 'news'
  | 'nft'
  | 'stablecoin'
  | 'dex'
  | 'lending'
  | 'staking'
  | 'oracle'
  | 'layer2'
  | 'wallet-analytics'
  | 'mining'
  | 'regulatory';

export interface DataSourceConfig {
  /** Unique slug */
  id: string;

  /** Display name */
  name: string;

  /** One-line description */
  description: string;

  /** Base API URL */
  baseUrl: string;

  /** How to authenticate */
  auth: AuthMethod;

  /** Env var name for the API key / secret */
  envKey?: string;

  /** Link to sign up for an API key */
  signupUrl?: string;

  /** Rate limits (requests per window) */
  rateLimit: { requests: number; windowMs: number };

  /** Pricing tier */
  tier: DataSourceTier;

  /** Monthly cost for basic paid tier (USD) */
  monthlyCost?: number;

  /** Data categories this source provides */
  categories: DataSourceCategory[];

  /** Health check / ping endpoint (relative to baseUrl) */
  healthEndpoint?: string;

  /** Does the source support WebSocket streaming? */
  hasWebSocket?: boolean;

  /** WebSocket URL if different from REST base */
  wsUrl?: string;

  /** Which provider chain categories this maps to (from providers/types.ts) */
  providerCategories?: string[];

  /** Whether we currently have an adapter implemented */
  implemented: boolean;

  /** Priority in multi-source resolution (lower = preferred) */
  priority: number;

  /** Weight for data fusion (0-1, higher = more trusted) */
  weight: number;

  /** Notes for developers */
  notes?: string;
}

// =============================================================================
// REGISTRY
// =============================================================================

export const DATA_SOURCES: DataSourceConfig[] = [

  // ---------------------------------------------------------------------------
  // MARKET DATA — Price, volume, market cap
  // ---------------------------------------------------------------------------

  {
    id: 'coingecko',
    name: 'CoinGecko',
    description: 'Most comprehensive free crypto API. 15,000+ coins, OHLC, exchanges, trending.',
    baseUrl: 'https://api.coingecko.com/api/v3',
    auth: 'api-key-header',
    envKey: 'COINGECKO_API_KEY',
    signupUrl: 'https://www.coingecko.com/en/api/pricing',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['market-data', 'defi', 'nft', 'derivatives'],
    healthEndpoint: '/ping',
    providerCategories: ['market-price', 'ohlcv'],
    implemented: true,
    priority: 1,
    weight: 0.40,
  },

  {
    id: 'coinmarketcap',
    name: 'CoinMarketCap',
    description: 'Industry-standard market data. 10,000+ coins. CMC rank is the de facto standard.',
    baseUrl: 'https://pro-api.coinmarketcap.com/v2',
    auth: 'api-key-header',
    envKey: 'CMC_API_KEY',
    signupUrl: 'https://coinmarketcap.com/api/',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['market-data'],
    healthEndpoint: '/cryptocurrency/map?limit=1',
    providerCategories: ['market-price'],
    implemented: false,
    priority: 2,
    weight: 0.35,
    notes: 'Free tier: 10,000 calls/month. Header: X-CMC_PRO_API_KEY',
  },

  {
    id: 'coincap',
    name: 'CoinCap',
    description: 'Real-time prices from ShapeShift. Good WebSocket support.',
    baseUrl: 'https://api.coincap.io/v2',
    auth: 'api-key-header',
    envKey: 'COINCAP_API_KEY',
    signupUrl: 'https://coincap.io/',
    rateLimit: { requests: 200, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['market-data'],
    hasWebSocket: true,
    wsUrl: 'wss://ws.coincap.io/prices?assets=bitcoin,ethereum',
    providerCategories: ['market-price'],
    implemented: true,
    priority: 3,
    weight: 0.25,
  },

  {
    id: 'coinpaprika',
    name: 'CoinPaprika',
    description: 'Market data with strong historical OHLC coverage.',
    baseUrl: 'https://api.coinpaprika.com/v1',
    auth: 'none',
    rateLimit: { requests: 10, windowMs: 1_000 },
    tier: 'free',
    categories: ['market-data'],
    healthEndpoint: '/global',
    providerCategories: ['market-price', 'ohlcv'],
    implemented: true,
    priority: 5,
    weight: 0.15,
  },

  {
    id: 'mobula',
    name: 'Mobula',
    description: 'Multi-chain token data API. Covers 40+ chains, real-time DEX prices.',
    baseUrl: 'https://api.mobula.io/api/1',
    auth: 'api-key-header',
    envKey: 'MOBULA_API_KEY',
    signupUrl: 'https://developer.mobula.fi/',
    rateLimit: { requests: 300, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['market-data', 'dex'],
    providerCategories: ['market-price'],
    implemented: false,
    priority: 6,
    weight: 0.20,
    notes: 'Free tier: 500 calls/day. Covers the long tail of tokens across many chains.',
  },

  {
    id: 'geckoterminal',
    name: 'GeckoTerminal',
    description: 'DEX-native market data from CoinGecko. Pool-level OHLCV across 100+ chains.',
    baseUrl: 'https://api.geckoterminal.com/api/v2',
    auth: 'none',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'free',
    categories: ['dex', 'market-data'],
    providerCategories: ['market-price', 'ohlcv'],
    implemented: false,
    priority: 4,
    weight: 0.25,
    notes: 'No API key needed. Best source for DEX token data.',
  },

  {
    id: 'cryptorank',
    name: 'CryptoRank',
    description: 'Market data + ICO/token sale tracker + fundraising data.',
    baseUrl: 'https://api.cryptorank.io/v1',
    auth: 'api-key-query',
    envKey: 'CRYPTORANK_API_KEY',
    signupUrl: 'https://cryptorank.io/api',
    rateLimit: { requests: 10, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['market-data'],
    implemented: false,
    priority: 7,
    weight: 0.15,
    notes: 'Unique: fundraising rounds data, ICO tracker.',
  },

  // ---------------------------------------------------------------------------
  // EXCHANGES — Spot + derivatives
  // ---------------------------------------------------------------------------

  {
    id: 'binance',
    name: 'Binance',
    description: 'Largest exchange by volume. Spot + futures + funding rates.',
    baseUrl: 'https://api.binance.com/api/v3',
    auth: 'none',
    rateLimit: { requests: 1200, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data', 'derivatives'],
    hasWebSocket: true,
    wsUrl: 'wss://stream.binance.com:9443/ws',
    providerCategories: ['market-price', 'funding-rate', 'open-interest', 'liquidations'],
    implemented: true,
    priority: 2,
    weight: 0.35,
  },

  {
    id: 'binance-futures',
    name: 'Binance Futures',
    description: 'USD-M and COIN-M perpetual futures.',
    baseUrl: 'https://fapi.binance.com',
    auth: 'none',
    rateLimit: { requests: 2400, windowMs: 60_000 },
    tier: 'free',
    categories: ['derivatives'],
    hasWebSocket: true,
    wsUrl: 'wss://fstream.binance.com/ws',
    providerCategories: ['funding-rate', 'open-interest', 'liquidations'],
    implemented: true,
    priority: 1,
    weight: 0.40,
  },

  {
    id: 'bybit',
    name: 'Bybit',
    description: '#2 derivatives exchange. Unified account, copy trading.',
    baseUrl: 'https://api.bybit.com/v5',
    auth: 'none',
    rateLimit: { requests: 120, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data', 'derivatives'],
    hasWebSocket: true,
    wsUrl: 'wss://stream.bybit.com/v5/public/linear',
    providerCategories: ['funding-rate', 'open-interest'],
    implemented: true,
    priority: 2,
    weight: 0.30,
  },

  {
    id: 'okx',
    name: 'OKX',
    description: '#3 derivatives exchange. Options, perps, copy trading.',
    baseUrl: 'https://www.okx.com/api/v5',
    auth: 'none',
    rateLimit: { requests: 60, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data', 'derivatives'],
    hasWebSocket: true,
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    providerCategories: ['funding-rate', 'open-interest'],
    implemented: true,
    priority: 3,
    weight: 0.25,
  },

  {
    id: 'dydx',
    name: 'dYdX',
    description: 'Decentralized perps exchange. Own appchain (Cosmos SDK).',
    baseUrl: 'https://indexer.dydx.trade/v4',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['derivatives', 'dex'],
    hasWebSocket: true,
    providerCategories: ['funding-rate', 'open-interest'],
    implemented: true,
    priority: 4,
    weight: 0.20,
  },

  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    description: 'Fastest-growing DEX. On-chain order book, 200k+ users. Own L1.',
    baseUrl: 'https://api.hyperliquid.xyz',
    auth: 'none',
    rateLimit: { requests: 120, windowMs: 60_000 },
    tier: 'free',
    categories: ['derivatives', 'dex'],
    hasWebSocket: true,
    wsUrl: 'wss://api.hyperliquid.xyz/ws',
    providerCategories: ['funding-rate', 'open-interest', 'liquidations'],
    implemented: false,
    priority: 3,
    weight: 0.30,
    notes: 'POST to /info with {"type": "metaAndAssetCtxs"} for all market data.',
  },

  {
    id: 'kraken',
    name: 'Kraken',
    description: 'US-friendly exchange. Strong OHLC/ticker APIs. Regulated.',
    baseUrl: 'https://api.kraken.com/0',
    auth: 'none',
    rateLimit: { requests: 15, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data'],
    hasWebSocket: true,
    wsUrl: 'wss://ws.kraken.com',
    providerCategories: ['market-price', 'ohlcv'],
    implemented: false,
    priority: 4,
    weight: 0.25,
    notes: 'Low rate limit but very reliable data.',
  },

  {
    id: 'bitfinex',
    name: 'Bitfinex',
    description: 'Deep order books. Great for whale watching and large-cap analysis.',
    baseUrl: 'https://api-pub.bitfinex.com/v2',
    auth: 'none',
    rateLimit: { requests: 90, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data', 'derivatives'],
    hasWebSocket: true,
    wsUrl: 'wss://api-pub.bitfinex.com/ws/2',
    providerCategories: ['market-price', 'order-book'],
    implemented: false,
    priority: 5,
    weight: 0.20,
  },

  {
    id: 'htx',
    name: 'HTX (Huobi)',
    description: 'Major Asia exchange. Good for APAC-centric tokens.',
    baseUrl: 'https://api.huobi.pro',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data'],
    hasWebSocket: true,
    wsUrl: 'wss://api.huobi.pro/ws',
    providerCategories: ['market-price'],
    implemented: false,
    priority: 6,
    weight: 0.15,
  },

  {
    id: 'gate-io',
    name: 'Gate.io',
    description: 'Wide altcoin coverage. 1,400+ coins. Good for new listings.',
    baseUrl: 'https://api.gateio.ws/api/v4',
    auth: 'none',
    rateLimit: { requests: 300, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data'],
    hasWebSocket: true,
    wsUrl: 'wss://api.gateio.ws/ws/v4/',
    providerCategories: ['market-price'],
    implemented: false,
    priority: 7,
    weight: 0.10,
    notes: 'Best coverage for micro-cap / newly listed tokens.',
  },

  {
    id: 'mexc',
    name: 'MEXC',
    description: 'Fast listing exchange. Often first to list new tokens.',
    baseUrl: 'https://api.mexc.com/api/v3',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['market-data'],
    providerCategories: ['market-price'],
    implemented: false,
    priority: 8,
    weight: 0.10,
  },

  {
    id: 'deribit',
    name: 'Deribit',
    description: 'Options market leader. BTC/ETH options and futures.',
    baseUrl: 'https://www.deribit.com/api/v2',
    auth: 'none',
    rateLimit: { requests: 20, windowMs: 1_000 },
    tier: 'free',
    categories: ['derivatives'],
    hasWebSocket: true,
    wsUrl: 'wss://www.deribit.com/ws/api/v2',
    providerCategories: ['open-interest'],
    implemented: true,
    priority: 1,
    weight: 0.40,
    notes: 'Dominant for crypto options. Must-have for options flow feature.',
  },

  // ---------------------------------------------------------------------------
  // DEFI — TVL, yields, protocols
  // ---------------------------------------------------------------------------

  {
    id: 'defillama',
    name: 'DefiLlama',
    description: 'DeFi TVL aggregator. 5,000+ protocols across 200+ chains.',
    baseUrl: 'https://api.llama.fi',
    auth: 'none',
    rateLimit: { requests: 500, windowMs: 60_000 },
    tier: 'free',
    categories: ['defi', 'stablecoin', 'dex', 'lending', 'staking'],
    healthEndpoint: '/protocols',
    providerCategories: ['tvl', 'defi-yields', 'stablecoin-flows'],
    implemented: true,
    priority: 1,
    weight: 0.50,
    notes: 'Our primary DeFi competitor. Must surpass their data depth.',
  },

  {
    id: 'defillama-yields',
    name: 'DefiLlama Yields',
    description: 'DeFi yield farming opportunities across all chains.',
    baseUrl: 'https://yields.llama.fi',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['defi', 'lending', 'staking'],
    providerCategories: ['defi-yields'],
    implemented: true,
    priority: 1,
    weight: 0.45,
  },

  {
    id: 'defillama-stablecoins',
    name: 'DefiLlama Stablecoins',
    description: 'Stablecoin supplies, dominance, and flow tracking.',
    baseUrl: 'https://stablecoins.llama.fi',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['stablecoin'],
    providerCategories: ['stablecoin-flows'],
    implemented: false,
    priority: 1,
    weight: 0.50,
  },

  {
    id: 'defillama-dexs',
    name: 'DefiLlama DEXs',
    description: 'DEX volume tracking across all chains and protocols.',
    baseUrl: 'https://api.llama.fi',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['dex'],
    providerCategories: ['tvl'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: '/overview/dexs — aggregated DEX volumes daily.',
  },

  {
    id: 'tokenterminal',
    name: 'Token Terminal',
    description: 'Protocol financials: revenue, P/S, P/E ratios for crypto protocols.',
    baseUrl: 'https://api.tokenterminal.com/v2',
    auth: 'bearer',
    envKey: 'TOKEN_TERMINAL_API_KEY',
    signupUrl: 'https://tokenterminal.com/api',
    rateLimit: { requests: 50, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['defi'],
    providerCategories: ['tvl'],
    implemented: false,
    priority: 2,
    weight: 0.30,
    notes: 'Free tier: 1,000 API calls/month. Unique data: protocol revenue.',
  },

  {
    id: '1inch',
    name: '1inch',
    description: 'DEX aggregator API. Best swap routes across DEXs.',
    baseUrl: 'https://api.1inch.dev/swap/v6.0',
    auth: 'bearer',
    envKey: 'ONEINCH_API_KEY',
    signupUrl: 'https://portal.1inch.dev/',
    rateLimit: { requests: 10, windowMs: 1_000 },
    tier: 'freemium',
    categories: ['dex'],
    implemented: false,
    priority: 2,
    weight: 0.25,
    notes: 'Swap routing data useful for liquidity depth analysis.',
  },

  {
    id: 'jupiter',
    name: 'Jupiter',
    description: 'Solana DEX aggregator. Best swap routing on Solana.',
    baseUrl: 'https://quote-api.jup.ag/v6',
    auth: 'none',
    rateLimit: { requests: 600, windowMs: 60_000 },
    tier: 'free',
    categories: ['dex'],
    implemented: false,
    priority: 2,
    weight: 0.30,
    notes: 'Dominant on Solana. Shows real liquidity depth.',
  },

  {
    id: 'aave',
    name: 'Aave',
    description: 'Largest lending protocol. Borrow/supply rates, liquidation data.',
    baseUrl: 'https://aave-api-v2.aave.com',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['lending', 'defi'],
    providerCategories: ['defi-yields'],
    implemented: false,
    priority: 1,
    weight: 0.40,
    notes: 'Also available via The Graph subgraph for more detailed data.',
  },

  {
    id: 'compound',
    name: 'Compound',
    description: 'Pioneer DeFi lending protocol. Supply/borrow rates.',
    baseUrl: 'https://api.compound.finance/api/v2',
    auth: 'none',
    rateLimit: { requests: 60, windowMs: 60_000 },
    tier: 'free',
    categories: ['lending', 'defi'],
    providerCategories: ['defi-yields'],
    implemented: false,
    priority: 2,
    weight: 0.30,
  },

  {
    id: 'lido',
    name: 'Lido',
    description: 'Largest liquid staking protocol. stETH stats, APR, validator data.',
    baseUrl: 'https://eth-api.lido.fi/v1',
    auth: 'none',
    rateLimit: { requests: 60, windowMs: 60_000 },
    tier: 'free',
    categories: ['staking', 'defi'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'Alternative: https://stake.lido.fi/api/sma-steth-apr',
  },

  // ---------------------------------------------------------------------------
  // ON-CHAIN ANALYTICS
  // ---------------------------------------------------------------------------

  {
    id: 'glassnode',
    name: 'Glassnode',
    description: 'Premier on-chain analytics. SOPR, MVRV, exchange flows, holder distribution.',
    baseUrl: 'https://api.glassnode.com/v1/metrics',
    auth: 'api-key-query',
    envKey: 'GLASSNODE_API_KEY',
    signupUrl: 'https://studio.glassnode.com/settings/api',
    rateLimit: { requests: 10, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['on-chain'],
    providerCategories: ['on-chain', 'whale-alerts'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'Free tier: limited metrics, 10 req/min. The gold standard of on-chain data.',
  },

  {
    id: 'santiment',
    name: 'Santiment',
    description: 'On-chain + social analytics. Developer activity, whale moves, social volume.',
    baseUrl: 'https://api.santiment.net/graphql',
    auth: 'bearer',
    envKey: 'SANTIMENT_API_KEY',
    signupUrl: 'https://app.santiment.net/',
    rateLimit: { requests: 100, windowMs: 300_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['on-chain', 'social'],
    providerCategories: ['on-chain', 'social-metrics'],
    implemented: false,
    priority: 2,
    weight: 0.35,
    notes: 'GraphQL API. Free tier: 500 API calls/day. Great social + dev activity data.',
  },

  {
    id: 'cryptoquant',
    name: 'CryptoQuant',
    description: 'On-chain quant data. Exchange inflows/outflows, miner flows, fund flows.',
    baseUrl: 'https://api.cryptoquant.com/v1',
    auth: 'bearer',
    envKey: 'CRYPTOQUANT_API_KEY',
    signupUrl: 'https://cryptoquant.com/docs',
    rateLimit: { requests: 10, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['on-chain'],
    providerCategories: ['on-chain', 'whale-alerts'],
    implemented: false,
    priority: 2,
    weight: 0.35,
    notes: 'Free tier: limited metrics. Strong exchange flow data.',
  },

  {
    id: 'nansen',
    name: 'Nansen',
    description: 'Wallet labeling + smart money tracking. Token god mode.',
    baseUrl: 'https://api.nansen.ai/v1',
    auth: 'api-key-header',
    envKey: 'NANSEN_API_KEY',
    signupUrl: 'https://www.nansen.ai/plans',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'paid',
    monthlyCost: 150,
    categories: ['wallet-analytics', 'on-chain'],
    providerCategories: ['whale-alerts'],
    implemented: false,
    priority: 1,
    weight: 0.50,
    notes: 'Premium but gold standard for smart money tracking.',
  },

  {
    id: 'arkham',
    name: 'Arkham Intelligence',
    description: 'On-chain entity labeling and intelligence. Whale tracking.',
    baseUrl: 'https://api.arkhamintelligence.com',
    auth: 'api-key-header',
    envKey: 'ARKHAM_API_KEY',
    signupUrl: 'https://platform.arkhamintelligence.com/',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['wallet-analytics', 'on-chain'],
    providerCategories: ['whale-alerts'],
    implemented: false,
    priority: 2,
    weight: 0.40,
    notes: 'Alternative to Nansen. Became free tier access in 2024.',
  },

  {
    id: 'dune',
    name: 'Dune Analytics',
    description: 'SQL-based on-chain queries. Community-built dashboards.',
    baseUrl: 'https://api.dune.com/api/v1',
    auth: 'api-key-header',
    envKey: 'DUNE_API_KEY',
    signupUrl: 'https://dune.com/settings/api',
    rateLimit: { requests: 40, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['on-chain', 'defi', 'dex'],
    providerCategories: ['on-chain'],
    implemented: false,
    priority: 3,
    weight: 0.30,
    notes: 'Free tier: 2500 credits/month. Execute pre-built queries (query_id) for any on-chain metric.',
  },

  {
    id: 'etherscan',
    name: 'Etherscan',
    description: 'Ethereum block explorer API. Transactions, balances, gas, tokens.',
    baseUrl: 'https://api.etherscan.io/api',
    auth: 'api-key-query',
    envKey: 'ETHERSCAN_API_KEY',
    signupUrl: 'https://etherscan.io/apis',
    rateLimit: { requests: 5, windowMs: 1_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['on-chain'],
    providerCategories: ['on-chain', 'gas-fees'],
    implemented: false,
    priority: 2,
    weight: 0.35,
    notes: 'Free: 5 calls/sec. Pro: 100 calls/sec. Essential for Ethereum data.',
  },

  {
    id: 'basescan',
    name: 'Basescan',
    description: 'Base L2 explorer API. Same as Etherscan interface.',
    baseUrl: 'https://api.basescan.org/api',
    auth: 'api-key-query',
    envKey: 'BASESCAN_API_KEY',
    signupUrl: 'https://basescan.org/apis',
    rateLimit: { requests: 5, windowMs: 1_000 },
    tier: 'freemium',
    categories: ['on-chain', 'layer2'],
    providerCategories: ['on-chain', 'gas-fees'],
    implemented: false,
    priority: 3,
    weight: 0.25,
  },

  {
    id: 'solscan',
    name: 'Solscan',
    description: 'Solana block explorer API. Tokens, DeFi, NFTs on Solana.',
    baseUrl: 'https://pro-api.solscan.io/v2.0',
    auth: 'api-key-header',
    envKey: 'SOLSCAN_API_KEY',
    signupUrl: 'https://pro-api.solscan.io/',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['on-chain'],
    providerCategories: ['on-chain'],
    implemented: false,
    priority: 3,
    weight: 0.25,
    notes: 'Free: 100 req/day.',
  },

  {
    id: 'mempool-space',
    name: 'Mempool.space',
    description: 'Bitcoin mempool explorer. Fee rates, block data, Lightning.',
    baseUrl: 'https://mempool.space/api',
    auth: 'none',
    rateLimit: { requests: 60, windowMs: 60_000 },
    tier: 'free',
    categories: ['on-chain'],
    providerCategories: ['mempool', 'gas-fees', 'on-chain'],
    implemented: true,
    priority: 1,
    weight: 0.45,
  },

  {
    id: 'blockchain-info',
    name: 'Blockchain.info',
    description: 'Bitcoin blockchain data. Blocks, transactions, address data.',
    baseUrl: 'https://blockchain.info',
    auth: 'none',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'free',
    categories: ['on-chain'],
    providerCategories: ['on-chain'],
    implemented: true,
    priority: 2,
    weight: 0.30,
  },

  // ---------------------------------------------------------------------------
  // SOCIAL & SENTIMENT
  // ---------------------------------------------------------------------------

  {
    id: 'lunarcrush',
    name: 'LunarCrush',
    description: 'Social intelligence for crypto. Galaxy Score, AltRank, social volume.',
    baseUrl: 'https://lunarcrush.com/api4/public',
    auth: 'bearer',
    envKey: 'LUNARCRUSH_API_KEY',
    signupUrl: 'https://lunarcrush.com/developers/api',
    rateLimit: { requests: 10, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['social'],
    providerCategories: ['social-metrics'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'Free w/ API key. Galaxy Score is a unique social signal. v4 API.',
  },

  {
    id: 'alternative-me',
    name: 'Alternative.me',
    description: 'Fear & Greed Index. Simple, reliable sentiment indicator.',
    baseUrl: 'https://api.alternative.me',
    auth: 'none',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'free',
    categories: ['social'],
    providerCategories: ['fear-greed'],
    implemented: true,
    priority: 1,
    weight: 0.50,
  },

  {
    id: 'coinglassapi',
    name: 'CoinGlass',
    description: 'Derivatives analytics. Liquidations, OI, funding, long/short ratios.',
    baseUrl: 'https://open-api-v3.coinglass.com/api',
    auth: 'api-key-header',
    envKey: 'COINGLASS_API_KEY',
    signupUrl: 'https://www.coinglass.com/pricing',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['derivatives'],
    providerCategories: ['liquidations', 'open-interest', 'funding-rate'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'Free: 30 calls/min. Essential for liquidation cascade tracking.',
  },

  // ---------------------------------------------------------------------------
  // ORACLES & INDICES
  // ---------------------------------------------------------------------------

  {
    id: 'chainlink',
    name: 'Chainlink',
    description: 'Decentralized oracle price feeds. On-chain truth.',
    baseUrl: 'https://reference-data-directory.vercel.app',
    auth: 'none',
    rateLimit: { requests: 60, windowMs: 60_000 },
    tier: 'free',
    categories: ['oracle'],
    providerCategories: ['market-price'],
    implemented: false,
    priority: 3,
    weight: 0.30,
    notes: 'Read on-chain via Etherscan or use the directory API for feed addresses.',
  },

  {
    id: 'pyth',
    name: 'Pyth Network',
    description: 'High-frequency oracle. Sub-second price updates. 450+ feeds.',
    baseUrl: 'https://hermes.pyth.network/v2',
    auth: 'none',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'free',
    categories: ['oracle'],
    hasWebSocket: true,
    wsUrl: 'wss://hermes.pyth.network/ws',
    providerCategories: ['market-price'],
    implemented: false,
    priority: 2,
    weight: 0.35,
    notes: 'REST + SSE + WebSocket. Fastest oracle data available. /v2/updates/price/latest',
  },

  // ---------------------------------------------------------------------------
  // BIRDEYE / SOLANA ECOSYSTEM
  // ---------------------------------------------------------------------------

  {
    id: 'birdeye',
    name: 'Birdeye',
    description: 'Solana-focused DeFi analytics. Token prices, OHLCV, wallet profiling.',
    baseUrl: 'https://public-api.birdeye.so',
    auth: 'api-key-header',
    envKey: 'BIRDEYE_API_KEY',
    signupUrl: 'https://docs.birdeye.so/',
    rateLimit: { requests: 100, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['dex', 'market-data'],
    providerCategories: ['market-price', 'ohlcv'],
    implemented: false,
    priority: 2,
    weight: 0.30,
    notes: 'Now multi-chain but strongest for Solana SPL tokens.',
  },

  // ---------------------------------------------------------------------------
  // NFT
  // ---------------------------------------------------------------------------

  {
    id: 'reservoir',
    name: 'Reservoir',
    description: 'NFT marketplace aggregator API. Floor prices, sales, collections.',
    baseUrl: 'https://api.reservoir.tools',
    auth: 'api-key-header',
    envKey: 'RESERVOIR_API_KEY',
    signupUrl: 'https://reservoir.tools/',
    rateLimit: { requests: 120, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['nft'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'Aggregates OpenSea, Blur, LooksRare etc. Best source for NFT market data.',
  },

  {
    id: 'simplehash',
    name: 'SimpleHash',
    description: 'Multi-chain NFT data. Collections, metadata, sales across 40+ chains.',
    baseUrl: 'https://api.simplehash.com/api/v0',
    auth: 'api-key-header',
    envKey: 'SIMPLEHASH_API_KEY',
    signupUrl: 'https://simplehash.com/',
    rateLimit: { requests: 50, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['nft'],
    implemented: false,
    priority: 2,
    weight: 0.30,
    notes: 'Free tier: 1,000 API calls/day.',
  },

  // ---------------------------------------------------------------------------
  // NEWS & RESEARCH
  // ---------------------------------------------------------------------------

  {
    id: 'messari',
    name: 'Messari',
    description: 'Crypto research API. Asset profiles, metrics, governance, events.',
    baseUrl: 'https://data.messari.io/api/v2',
    auth: 'api-key-header',
    envKey: 'MESSARI_API_KEY',
    signupUrl: 'https://messari.io/api',
    rateLimit: { requests: 20, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['market-data', 'news'],
    providerCategories: ['market-price'],
    implemented: false,
    priority: 4,
    weight: 0.20,
    notes: 'Free: 20 req/min. Unique: asset profiles, governance data, research.',
  },

  {
    id: 'cryptocompare',
    name: 'CryptoCompare',
    description: 'Market data + social stats + historical data going back to 2010.',
    baseUrl: 'https://min-api.cryptocompare.com/data',
    auth: 'api-key-header',
    envKey: 'CRYPTOCOMPARE_API_KEY',
    signupUrl: 'https://www.cryptocompare.com/cryptopian/api-keys',
    rateLimit: { requests: 50, windowMs: 60_000 },
    tier: 'freemium',
    monthlyCost: 0,
    categories: ['market-data', 'social'],
    providerCategories: ['market-price', 'social-metrics'],
    implemented: true,
    priority: 4,
    weight: 0.20,
    notes: 'Free tier: 100,000 calls/month. Longest historical data.',
  },

  // ---------------------------------------------------------------------------
  // STABLECOINS
  // ---------------------------------------------------------------------------

  {
    id: 'circle',
    name: 'Circle (USDC)',
    description: 'USDC attestation and reserve data directly from the issuer.',
    baseUrl: 'https://api.circle.com/v2',
    auth: 'bearer',
    envKey: 'CIRCLE_API_KEY',
    signupUrl: 'https://developers.circle.com/',
    rateLimit: { requests: 60, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['stablecoin'],
    providerCategories: ['stablecoin-flows'],
    implemented: false,
    priority: 1,
    weight: 0.45,
  },

  // ---------------------------------------------------------------------------
  // LAYER 2
  // ---------------------------------------------------------------------------

  {
    id: 'l2beat',
    name: 'L2BEAT',
    description: 'Layer 2 TVL, risk analysis, and activity metrics.',
    baseUrl: 'https://l2beat.com/api',
    auth: 'none',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'free',
    categories: ['layer2', 'defi'],
    providerCategories: ['tvl'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'Scrape /api/tvl or use their GitHub data repo for historical.',
  },

  // ---------------------------------------------------------------------------
  // MINING & HASHRATE
  // ---------------------------------------------------------------------------

  {
    id: 'hashrateindex',
    name: 'Hashrate Index (Luxor)',
    description: 'Bitcoin mining data. Hashrate, hashprice, difficulty, energy.',
    baseUrl: 'https://api.hashrateindex.com/graphql',
    auth: 'api-key-header',
    envKey: 'HASHRATE_INDEX_API_KEY',
    signupUrl: 'https://data.hashrateindex.com/',
    rateLimit: { requests: 30, windowMs: 60_000 },
    tier: 'freemium',
    categories: ['mining'],
    providerCategories: ['on-chain'],
    implemented: false,
    priority: 1,
    weight: 0.45,
    notes: 'GraphQL API. Free tier available. Unique mining economics data.',
  },

  // ---------------------------------------------------------------------------
  // REGULATORY
  // ---------------------------------------------------------------------------

  {
    id: 'openregulatory',
    name: 'Open Regulatory (SEC EDGAR)',
    description: 'SEC filings, enforcement actions related to crypto.',
    baseUrl: 'https://efts.sec.gov/LATEST/search-index',
    auth: 'none',
    rateLimit: { requests: 10, windowMs: 1_000 },
    tier: 'free',
    categories: ['regulatory'],
    implemented: false,
    priority: 1,
    weight: 0.40,
    notes: 'Use EDGAR full-text search API for crypto-related filings.',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get all configured data sources */
export function getAllDataSources(): DataSourceConfig[] {
  return DATA_SOURCES;
}

/** Get data sources by category */
export function getDataSourcesByCategory(category: DataSourceCategory): DataSourceConfig[] {
  return DATA_SOURCES.filter(ds => ds.categories.includes(category));
}

/** Get only implemented data sources */
export function getImplementedDataSources(): DataSourceConfig[] {
  return DATA_SOURCES.filter(ds => ds.implemented);
}

/** Get data sources needing API keys */
export function getDataSourcesNeedingKeys(): DataSourceConfig[] {
  return DATA_SOURCES.filter(ds => ds.envKey && !process.env[ds.envKey]);
}

/** Get data sources with API keys configured */
export function getConfiguredDataSources(): DataSourceConfig[] {
  return DATA_SOURCES.filter(ds =>
    ds.auth === 'none' || (ds.envKey && process.env[ds.envKey])
  );
}

/** Get free data sources (no key required) */
export function getFreeDataSources(): DataSourceConfig[] {
  return DATA_SOURCES.filter(ds => ds.auth === 'none');
}

/** Get data source by ID */
export function getDataSource(id: string): DataSourceConfig | undefined {
  return DATA_SOURCES.find(ds => ds.id === id);
}

/** Print a summary of all sources and their status */
export function dataSourceReport(): string {
  const lines = [
    'Data Source Registry',
    '═'.repeat(80),
    '',
  ];

  const categories = [...new Set(DATA_SOURCES.flatMap(ds => ds.categories))].sort();

  for (const cat of categories) {
    const sources = getDataSourcesByCategory(cat as DataSourceCategory);
    lines.push(`▸ ${cat.toUpperCase()} (${sources.length} sources)`);

    for (const s of sources) {
      const keyStatus = s.auth === 'none'
        ? '🟢 no key'
        : s.envKey && process.env[s.envKey]
          ? '🟢 configured'
          : '🔴 needs key';
      const implStatus = s.implemented ? '✅' : '⬜';
      lines.push(`    ${implStatus} ${s.name.padEnd(20)} ${keyStatus.padEnd(16)} P${s.priority} W${s.weight}`);
    }
    lines.push('');
  }

  const total = DATA_SOURCES.length;
  const implemented = DATA_SOURCES.filter(ds => ds.implemented).length;
  const configured = getConfiguredDataSources().length;
  const needsKeys = getDataSourcesNeedingKeys().length;

  lines.push('─'.repeat(80));
  lines.push(`Total: ${total} | Implemented: ${implemented} | Configured: ${configured} | Needs Keys: ${needsKeys}`);

  return lines.join('\n');
}
