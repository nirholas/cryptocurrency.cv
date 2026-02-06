/**
 * Centralized constants for Free Crypto News
 *
 * Single source of truth for base URLs, API endpoints, and cache durations.
 * Import from here instead of hardcoding values across the codebase.
 *
 * @module constants
 */

// =============================================================================
// SITE / APP URL
// =============================================================================

/**
 * The canonical site URL. Use this everywhere instead of checking
 * multiple NEXT_PUBLIC_* env vars or hardcoding 'https://cryptocurrency.cv'.
 *
 * Reads from NEXT_PUBLIC_APP_URL (the primary env var).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

// =============================================================================
// EXTERNAL API BASE URLS
// =============================================================================

/** CoinGecko REST API v3 */
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/** CryptoCompare REST API */
export const CRYPTOCOMPARE_BASE = 'https://min-api.cryptocompare.com/data';

/** DeFiLlama REST API */
export const DEFILLAMA_BASE = 'https://api.llama.fi';

/** Alternative.me (Fear & Greed Index) */
export const ALTERNATIVE_ME_BASE = 'https://api.alternative.me';

/** Binance spot REST API v3 */
export const BINANCE_BASE = 'https://api.binance.com/api/v3';

/** CoinPaprika REST API v1 */
export const COINPAPRIKA_BASE = 'https://api.coinpaprika.com/v1';

/** CoinCap REST API v2 */
export const COINCAP_BASE = 'https://api.coincap.io/v2';

/** CoinLore REST API */
export const COINLORE_BASE = 'https://api.coinlore.net/api';

/** Binance Futures REST API */
export const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';

/** Bybit REST API v5 */
export const BYBIT_BASE = 'https://api.bybit.com/v5';

/** dYdX REST API v3 */
export const DYDX_BASE = 'https://api.dydx.exchange/v3';

/** OKX REST API v5 */
export const OKX_BASE = 'https://www.okx.com/api/v5';

/** Mempool.space REST API */
export const MEMPOOL_BASE = 'https://mempool.space/api';

/** Blockchain.info REST API */
export const BLOCKCHAIN_INFO_BASE = 'https://blockchain.info';

/** DeFiLlama Yields API */
export const LLAMA_YIELDS_BASE = 'https://yields.llama.fi';
