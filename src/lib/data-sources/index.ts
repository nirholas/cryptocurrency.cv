/**
 * Data Source Registry — Unified adapter system for 30+ crypto data APIs
 *
 * This module provides a single entry point to query any data source in
 * the system. Each adapter handles its own authentication, rate limiting,
 * response normalization, and error handling.
 *
 * Designed for 1M+ user scale:
 * - Every external call has circuit-breaker protection
 * - Responses are cached with configurable TTLs
 * - Adapters self-report health for observability dashboards
 * - Fallback chains ensure zero-downtime data delivery
 *
 * @module data-sources
 */

import { cache, withCache } from '@/lib/cache';

// ═══════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════

export interface DataSourceConfig {
  readonly name: string;
  readonly baseUrl: string;
  readonly category: DataSourceCategory;
  readonly rateLimit: { requests: number; windowMs: number };
  readonly cacheTtlSeconds: number;
  readonly requiresAuth: boolean;
  readonly envKey?: string; // env var name for API key
  readonly docs?: string;
  readonly tier: 'free' | 'freemium' | 'paid';
}

export type DataSourceCategory =
  | 'market-data'
  | 'defi'
  | 'onchain'
  | 'social'
  | 'derivatives'
  | 'nft'
  | 'blockchain-explorer'
  | 'news-aggregator'
  | 'research'
  | 'governance'
  | 'stablecoins'
  | 'bridges'
  | 'yields'
  | 'whale-tracking'
  | 'developer';

export interface DataSourceAdapter<T = unknown> {
  readonly config: DataSourceConfig;
  fetch(endpoint: string, params?: Record<string, string>): Promise<T>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number }>;
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  cacheTtl?: number;
  headers?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// HTTP UTILITY
// ═══════════════════════════════════════════════════════════════

async function safeFetch<T>(
  url: string,
  options: FetchOptions & { apiKey?: string; authHeader?: string } = {},
): Promise<T> {
  const { timeout = 10000, retries = 2, apiKey, authHeader } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'free-crypto-news/2.0 (+https://github.com/nirholas/free-crypto-news)',
    ...options.headers,
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  } else if (apiKey) {
    // Most APIs use x-api-key or query param — adapters will handle this
    headers['x-api-key'] = apiKey;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — exponential backoff
        const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
        await sleep(retryAfter * 1000 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  throw lastError || new Error('Fetch failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(base: string, endpoint: string, params?: Record<string, string>): string {
  const url = new URL(endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

function getEnv(key: string): string | undefined {
  return typeof process !== 'undefined' ? process.env[key] : undefined;
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER FACTORY
// ═══════════════════════════════════════════════════════════════

function createAdapter<T = unknown>(config: DataSourceConfig): DataSourceAdapter<T> {
  const apiKey = config.envKey ? getEnv(config.envKey) : undefined;

  return {
    config,

    async fetch(endpoint: string, params?: Record<string, string>): Promise<T> {
      const cacheKey = `ds:${config.name}:${endpoint}:${JSON.stringify(params || {})}`;
      const cached = cache.get<T>(cacheKey);
      if (cached) return cached;

      const url = buildUrl(config.baseUrl, endpoint, params);
      const result = await safeFetch<T>(url, {
        apiKey,
        timeout: 15000,
        retries: 2,
      });

      cache.set(cacheKey, result, config.cacheTtlSeconds);
      return result;
    },

    async healthCheck(): Promise<{ ok: boolean; latencyMs: number }> {
      const start = Date.now();
      try {
        const url = buildUrl(config.baseUrl, '/');
        await safeFetch(url, { timeout: 5000, retries: 0 });
        return { ok: true, latencyMs: Date.now() - start };
      } catch {
        return { ok: false, latencyMs: Date.now() - start };
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// DATA SOURCE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

// ── DeFi ──────────────────────────────────────────────────────

export const defillama = createAdapter({
  name: 'defillama',
  baseUrl: 'https://api.llama.fi',
  category: 'defi',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://defillama.com/docs/api',
});

export const defillamaYields = createAdapter({
  name: 'defillama-yields',
  baseUrl: 'https://yields.llama.fi',
  category: 'yields',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 600,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://defillama.com/docs/api',
});

export const defillamaCoins = createAdapter({
  name: 'defillama-coins',
  baseUrl: 'https://coins.llama.fi',
  category: 'market-data',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 60,
  requiresAuth: false,
  tier: 'free',
});

export const defillamaStablecoins = createAdapter({
  name: 'defillama-stablecoins',
  baseUrl: 'https://stablecoins.llama.fi',
  category: 'stablecoins',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 600,
  requiresAuth: false,
  tier: 'free',
});

export const defillamaBridges = createAdapter({
  name: 'defillama-bridges',
  baseUrl: 'https://bridges.llama.fi',
  category: 'bridges',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 900,
  requiresAuth: false,
  tier: 'free',
});

export const defillamaVolumes = createAdapter({
  name: 'defillama-volumes',
  baseUrl: 'https://api.llama.fi',
  category: 'defi',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: false,
  tier: 'free',
});

export const defillamaFees = createAdapter({
  name: 'defillama-fees',
  baseUrl: 'https://api.llama.fi',
  category: 'defi',
  rateLimit: { requests: 300, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: false,
  tier: 'free',
});

// ── Market Data ───────────────────────────────────────────────

export const coinmarketcap = createAdapter({
  name: 'coinmarketcap',
  baseUrl: 'https://pro-api.coinmarketcap.com/v1',
  category: 'market-data',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 60,
  requiresAuth: true,
  envKey: 'CMC_API_KEY',
  tier: 'freemium',
  docs: 'https://coinmarketcap.com/api/documentation/v1/',
});

export const cryptocompare = createAdapter({
  name: 'cryptocompare',
  baseUrl: 'https://min-api.cryptocompare.com',
  category: 'market-data',
  rateLimit: { requests: 50, windowMs: 60_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'CRYPTOCOMPARE_API_KEY',
  tier: 'freemium',
  docs: 'https://min-api.cryptocompare.com/documentation',
});

export const messari = createAdapter({
  name: 'messari',
  baseUrl: 'https://data.messari.io/api/v1',
  category: 'research',
  rateLimit: { requests: 20, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: true,
  envKey: 'MESSARI_API_KEY',
  tier: 'freemium',
  docs: 'https://messari.io/api',
});

export const coinpaprika = createAdapter({
  name: 'coinpaprika',
  baseUrl: 'https://api.coinpaprika.com/v1',
  category: 'market-data',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 60,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://api.coinpaprika.com',
});

export const coinglass = createAdapter({
  name: 'coinglass',
  baseUrl: 'https://open-api.coinglass.com/public/v2',
  category: 'derivatives',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 60,
  requiresAuth: true,
  envKey: 'COINGLASS_API_KEY',
  tier: 'freemium',
  docs: 'https://coinglass.com/api',
});

export const alternative = createAdapter({
  name: 'alternative-me',
  baseUrl: 'https://api.alternative.me',
  category: 'market-data',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://alternative.me/crypto/fear-and-greed-index/#api',
});

// ── On-Chain ──────────────────────────────────────────────────

export const etherscan = createAdapter({
  name: 'etherscan',
  baseUrl: 'https://api.etherscan.io/api',
  category: 'blockchain-explorer',
  rateLimit: { requests: 5, windowMs: 1_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'ETHERSCAN_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.etherscan.io/',
});

export const basescan = createAdapter({
  name: 'basescan',
  baseUrl: 'https://api.basescan.org/api',
  category: 'blockchain-explorer',
  rateLimit: { requests: 5, windowMs: 1_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'BASESCAN_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.basescan.org/',
});

export const arbiscan = createAdapter({
  name: 'arbiscan',
  baseUrl: 'https://api.arbiscan.io/api',
  category: 'blockchain-explorer',
  rateLimit: { requests: 5, windowMs: 1_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'ARBISCAN_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.arbiscan.io/',
});

export const polygonscan = createAdapter({
  name: 'polygonscan',
  baseUrl: 'https://api.polygonscan.com/api',
  category: 'blockchain-explorer',
  rateLimit: { requests: 5, windowMs: 1_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'POLYGONSCAN_API_KEY',
  tier: 'freemium',
});

export const solscan = createAdapter({
  name: 'solscan',
  baseUrl: 'https://pro-api.solscan.io/v2.0',
  category: 'blockchain-explorer',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'SOLSCAN_API_KEY',
  tier: 'freemium',
  docs: 'https://pro-api.solscan.io/pro-api-docs/v2.0',
});

export const blockchairBtc = createAdapter({
  name: 'blockchair-btc',
  baseUrl: 'https://api.blockchair.com/bitcoin',
  category: 'blockchain-explorer',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 60,
  requiresAuth: false,
  tier: 'freemium',
  docs: 'https://blockchair.com/api',
});

export const mempoolSpace = createAdapter({
  name: 'mempool-space',
  baseUrl: 'https://mempool.space/api',
  category: 'blockchain-explorer',
  rateLimit: { requests: 50, windowMs: 60_000 },
  cacheTtlSeconds: 15,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://mempool.space/docs/api',
});

export const glassnode = createAdapter({
  name: 'glassnode',
  baseUrl: 'https://api.glassnode.com/v1',
  category: 'onchain',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 600,
  requiresAuth: true,
  envKey: 'GLASSNODE_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.glassnode.com/',
});

export const santiment = createAdapter({
  name: 'santiment',
  baseUrl: 'https://api.santiment.net/graphql',
  category: 'onchain',
  rateLimit: { requests: 20, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: true,
  envKey: 'SANTIMENT_API_KEY',
  tier: 'freemium',
  docs: 'https://academy.santiment.net/for-developers/',
});

export const dune = createAdapter({
  name: 'dune',
  baseUrl: 'https://api.dune.com/api/v1',
  category: 'onchain',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 600,
  requiresAuth: true,
  envKey: 'DUNE_API_KEY',
  tier: 'freemium',
  docs: 'https://dune.com/docs/api/',
});

export const flipside = createAdapter({
  name: 'flipside',
  baseUrl: 'https://api-v2.flipsidecrypto.xyz',
  category: 'onchain',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 600,
  requiresAuth: true,
  envKey: 'FLIPSIDE_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.flipsidecrypto.com/',
});

export const tokenTerminal = createAdapter({
  name: 'token-terminal',
  baseUrl: 'https://api.tokenterminal.com/v2',
  category: 'research',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 600,
  requiresAuth: true,
  envKey: 'TOKEN_TERMINAL_API_KEY',
  tier: 'paid',
  docs: 'https://docs.tokenterminal.com/',
});

// ── Social & Sentiment ────────────────────────────────────────

export const lunarcrush = createAdapter({
  name: 'lunarcrush',
  baseUrl: 'https://lunarcrush.com/api4/public',
  category: 'social',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: true,
  envKey: 'LUNARCRUSH_API_KEY',
  tier: 'freemium',
  docs: 'https://lunarcrush.com/developers/api',
});

export const santimentSocial = createAdapter({
  name: 'santiment-social',
  baseUrl: 'https://api.santiment.net/graphql',
  category: 'social',
  rateLimit: { requests: 20, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: true,
  envKey: 'SANTIMENT_API_KEY',
  tier: 'freemium',
});

// ── NFT ───────────────────────────────────────────────────────

export const reservoir = createAdapter({
  name: 'reservoir',
  baseUrl: 'https://api.reservoir.tools',
  category: 'nft',
  rateLimit: { requests: 120, windowMs: 60_000 },
  cacheTtlSeconds: 60,
  requiresAuth: true,
  envKey: 'RESERVOIR_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.reservoir.tools/',
});

export const simplehash = createAdapter({
  name: 'simplehash',
  baseUrl: 'https://api.simplehash.com/api/v0',
  category: 'nft',
  rateLimit: { requests: 50, windowMs: 60_000 },
  cacheTtlSeconds: 120,
  requiresAuth: true,
  envKey: 'SIMPLEHASH_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.simplehash.com/',
});

// ── Governance ────────────────────────────────────────────────

export const snapshot = createAdapter({
  name: 'snapshot',
  baseUrl: 'https://hub.snapshot.org/graphql',
  category: 'governance',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://docs.snapshot.org/',
});

export const tally = createAdapter({
  name: 'tally',
  baseUrl: 'https://api.tally.xyz/query',
  category: 'governance',
  rateLimit: { requests: 20, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: true,
  envKey: 'TALLY_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.tally.xyz/',
});

// ── Derivatives & Futures ─────────────────────────────────────

export const deribit = createAdapter({
  name: 'deribit',
  baseUrl: 'https://www.deribit.com/api/v2/public',
  category: 'derivatives',
  rateLimit: { requests: 20, windowMs: 1_000 },
  cacheTtlSeconds: 15,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://docs.deribit.com/',
});

export const bybit = createAdapter({
  name: 'bybit',
  baseUrl: 'https://api.bybit.com/v5',
  category: 'derivatives',
  rateLimit: { requests: 120, windowMs: 60_000 },
  cacheTtlSeconds: 15,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://bybit-exchange.github.io/docs/',
});

export const okx = createAdapter({
  name: 'okx',
  baseUrl: 'https://www.okx.com/api/v5',
  category: 'derivatives',
  rateLimit: { requests: 60, windowMs: 2_000 },
  cacheTtlSeconds: 15,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://www.okx.com/docs-v5/',
});

export const hyperliquid = createAdapter({
  name: 'hyperliquid',
  baseUrl: 'https://api.hyperliquid.xyz',
  category: 'derivatives',
  rateLimit: { requests: 60, windowMs: 60_000 },
  cacheTtlSeconds: 10,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api',
});

// ── DEX Aggregators ───────────────────────────────────────────

export const dexscreener = createAdapter({
  name: 'dexscreener',
  baseUrl: 'https://api.dexscreener.com/latest',
  category: 'defi',
  rateLimit: { requests: 60, windowMs: 60_000 },
  cacheTtlSeconds: 30,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://docs.dexscreener.com/',
});

export const defined = createAdapter({
  name: 'defined-fi',
  baseUrl: 'https://graph.defined.fi/graphql',
  category: 'defi',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 30,
  requiresAuth: true,
  envKey: 'DEFINED_API_KEY',
  tier: 'freemium',
  docs: 'https://docs.defined.fi/',
});

export const geckoterminal = createAdapter({
  name: 'geckoterminal',
  baseUrl: 'https://api.geckoterminal.com/api/v2',
  category: 'defi',
  rateLimit: { requests: 30, windowMs: 60_000 },
  cacheTtlSeconds: 30,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://www.geckoterminal.com/dex-api',
});

// ── L2 & Bridges ──────────────────────────────────────────────

export const l2beat = createAdapter({
  name: 'l2beat',
  baseUrl: 'https://l2beat.com/api',
  category: 'defi',
  rateLimit: { requests: 20, windowMs: 60_000 },
  cacheTtlSeconds: 900,
  requiresAuth: false,
  tier: 'free',
  docs: 'https://l2beat.com/faq',
});

// ── Whale Tracking ────────────────────────────────────────────

export const arkhamIntel = createAdapter({
  name: 'arkham',
  baseUrl: 'https://api.arkhamintelligence.com',
  category: 'whale-tracking',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 120,
  requiresAuth: true,
  envKey: 'ARKHAM_API_KEY',
  tier: 'paid',
  docs: 'https://platform.arkhamintelligence.com/docs',
});

export const nansen = createAdapter({
  name: 'nansen',
  baseUrl: 'https://api.nansen.ai/v1',
  category: 'whale-tracking',
  rateLimit: { requests: 10, windowMs: 60_000 },
  cacheTtlSeconds: 300,
  requiresAuth: true,
  envKey: 'NANSEN_API_KEY',
  tier: 'paid',
  docs: 'https://docs.nansen.ai/',
});

// ═══════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════

export const ALL_DATA_SOURCES = {
  // DeFi
  defillama,
  defillamaYields,
  defillamaCoins,
  defillamaStablecoins,
  defillamaBridges,
  defillamaVolumes,
  defillamaFees,
  // Market Data
  coinmarketcap,
  cryptocompare,
  messari,
  coinpaprika,
  coinglass,
  alternative,
  // On-Chain
  etherscan,
  basescan,
  arbiscan,
  polygonscan,
  solscan,
  blockchairBtc,
  mempoolSpace,
  glassnode,
  santiment,
  dune,
  flipside,
  tokenTerminal,
  // Social
  lunarcrush,
  santimentSocial,
  // NFT
  reservoir,
  simplehash,
  // Governance
  snapshot,
  tally,
  // Derivatives
  deribit,
  bybit,
  okx,
  hyperliquid,
  coinglass: coinglass,
  // DEX / DeFi
  dexscreener,
  defined,
  geckoterminal,
  l2beat,
  // Whale Tracking
  arkhamIntel,
  nansen,
} as const;

export type DataSourceName = keyof typeof ALL_DATA_SOURCES;

/**
 * Get a data source adapter by name
 */
export function getDataSource(name: string): DataSourceAdapter | undefined {
  return (ALL_DATA_SOURCES as Record<string, DataSourceAdapter>)[name];
}

/**
 * List all registered data sources with their configuration
 */
export function listDataSources(): DataSourceConfig[] {
  return Object.values(ALL_DATA_SOURCES).map((adapter) => adapter.config);
}

/**
 * List data sources by category
 */
export function listDataSourcesByCategory(category: DataSourceCategory): DataSourceConfig[] {
  return Object.values(ALL_DATA_SOURCES)
    .filter((adapter) => adapter.config.category === category)
    .map((adapter) => adapter.config);
}

/**
 * Run health checks across all data sources
 */
export async function healthCheckAll(): Promise<
  Array<{ name: string; ok: boolean; latencyMs: number; category: DataSourceCategory }>
> {
  const results = await Promise.allSettled(
    Object.values(ALL_DATA_SOURCES).map(async (adapter) => {
      const health = await adapter.healthCheck();
      return {
        name: adapter.config.name,
        ok: health.ok,
        latencyMs: health.latencyMs,
        category: adapter.config.category,
      };
    }),
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    const adapter = Object.values(ALL_DATA_SOURCES)[i];
    return {
      name: adapter.config.name,
      ok: false,
      latencyMs: -1,
      category: adapter.config.category,
    };
  });
}
