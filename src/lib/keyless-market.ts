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
 * Keyless market data: the fallback behind CoinGecko.
 *
 * CoinCap v2 used to fill this role, but it is permanently shut down (the
 * `api.coincap.io` hostname no longer resolves and v3 needs a paid key). Two
 * free, keyless upstreams replace it:
 *
 * - **DefiLlama coins API** (`coins.llama.fi`) accepts CoinGecko ids directly
 *   (`coingecko:bitcoin`), so it serves spot prices, 24h change and price
 *   history for any CoinGecko id with no lookup table. It has no market cap or
 *   volume data, so those fields are omitted rather than invented.
 * - **CoinLore** (`api.coinlore.net`) serves ranked market lists with market
 *   cap, volume, supply and 1h/24h/7d change. Its `nameid` slug matches the
 *   CoinGecko id for most coins; the rest go through a verified alias table
 *   and, failing that, a symbol match that must agree with DefiLlama's price.
 *
 * Every request goes through `resilientFetchResponse` with a distinct circuit
 * breaker per upstream (`defillama-coins`, `coinlore`).
 *
 * @module keyless-market
 */

import { COINLORE_BASE, DEFILLAMA_COINS_BASE } from './constants';
import { resilientFetchResponse } from './resilient-fetch';

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/** One coin's spot price from DefiLlama, keyed by its CoinGecko id. */
export interface KeylessSpotPrice {
  /** CoinGecko id */
  id: string;
  /** Upper-case ticker as DefiLlama reports it */
  symbol: string;
  /** Price in USD */
  usd: number;
  /** 24h price change in percent, when it was requested and available */
  usd_24h_change?: number;
  /** Unix seconds of the price observation */
  last_updated_at: number;
  /** DefiLlama's confidence score (0 to 1) */
  confidence?: number;
}

/**
 * A coin in the same shape CoinGecko `/coins/markets` returns. Fields the
 * keyless sources cannot supply truthfully are left undefined.
 */
export interface KeylessMarketCoin {
  id: string;
  /** Lower-case ticker, as CoinGecko returns it */
  symbol: string;
  name: string;
  /** Logo URL, or '' when the coin is only known to DefiLlama */
  image: string;
  current_price: number;
  market_cap?: number;
  market_cap_rank?: number | null;
  total_volume?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  circulating_supply?: number;
  total_supply?: number | null;
  max_supply?: number | null;
  last_updated: string;
}

/** Single-coin details merged from CoinLore and DefiLlama. */
export interface KeylessCoinDetail {
  /** CoinGecko id the caller asked for */
  id: string;
  /** Upper-case ticker */
  symbol: string;
  name: string;
  /** Logo URL, or null when the coin is only known to DefiLlama */
  image: string | null;
  rank: number | null;
  priceUsd: number;
  priceBtc?: number;
  change1h?: number;
  change24h?: number;
  change7d?: number;
  marketCapUsd?: number;
  volume24hUsd?: number;
  circulatingSupply?: number;
  totalSupply?: number | null;
  maxSupply?: number | null;
  /** CoinLore's numeric id, needed for its per-coin endpoints */
  coinloreId?: string;
  /** Which upstream supplied the market fields */
  source: 'coinlore' | 'defillama';
  lastUpdated: string;
}

/** A search hit, keyed by CoinGecko id where one is known. */
export interface KeylessSearchCoin {
  id: string;
  name: string;
  /** Upper-case ticker */
  symbol: string;
  rank: number | null;
  image: string;
}

/** One point of price history. */
export interface KeylessHistoryPoint {
  /** Unix milliseconds */
  time: number;
  priceUsd: number;
}

/** A trading pair for a coin on one exchange, priced in USD. */
export interface KeylessCoinMarket {
  exchange: string;
  base: string;
  quote: string;
  priceUsd: number;
  volumeUsd24h: number;
  /** Share of the coin's total 24h volume, in percent, when known */
  volumePercent?: number;
}

/** Candle sizes DefiLlama's `/chart` endpoint accepts. */
export type LlamaPeriod =
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '12h'
  | '1d'
  | '2d'
  | '1w';

/** A history request: candle size plus how many candles back from now. */
export interface HistoryWindow {
  period: LlamaPeriod;
  points: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** DefiLlama refuses chart requests above this many points. */
export const MAX_HISTORY_POINTS = 500;

/** CoinLore returns at most 100 tickers per page. */
const COINLORE_PAGE_SIZE = 100;

/** How deep into CoinLore's ranking id lookups and search look. */
const COINLORE_INDEX_PAGES = 5;

/** Maximum relative price gap before two sources are treated as different coins. */
const PRICE_AGREEMENT_TOLERANCE = 0.1;

/** DefiLlama accepts many coins per call; keep URLs a sane length. */
const DEFILLAMA_BATCH = 50;

const SPOT_TTL_MS = 30_000;
const LIST_TTL_MS = 60_000;
const HISTORY_TTL_MS = 5 * 60_000;
const MARKETS_TTL_MS = 2 * 60_000;

const PERIOD_SECONDS: Record<LlamaPeriod, number> = {
  '5m': 300,
  '15m': 900,
  '30m': 1_800,
  '1h': 3_600,
  '2h': 7_200,
  '4h': 14_400,
  '6h': 21_600,
  '12h': 43_200,
  '1d': 86_400,
  '2d': 172_800,
  '1w': 604_800,
};

/**
 * CoinLore `nameid` to CoinGecko id, for coins where the two differ. Each pair
 * was checked against DefiLlama on 2026-09-30 (same ticker, price within 5%).
 * Coins not listed here use their `nameid` unchanged.
 */
const NAMEID_TO_COINGECKO: Record<string, string> = {
  aevo: 'aevo-exchange',
  'agora-finance': 'agora-dollar',
  'arpa-chain': 'arpa',
  aster: 'aster-2',
  avalanche: 'avalanche-2',
  berachain: 'berachain-bera',
  'binance-coin': 'binancecoin',
  bio: 'bio-protocol',
  'blur-token': 'blur',
  casper: 'casper-network',
  chromia: 'chromaway',
  compound: 'compound-governance-token',
  'conflux-network': 'conflux-token',
  constellation: 'constellation-labs',
  core: 'coredaoorg',
  creditcoin: 'creditcoin-2',
  'deepbook-protocol': 'deep',
  dfinity: 'internet-computer',
  dia: 'dia-data',
  dogs: 'dogs-2',
  dogwifhat: 'dogwifcoin',
  'dola-usd-stablecoin': 'dola-usd',
  'elrond-egold': 'elrond-erd-2',
  'enjin-coin': 'enjincoin',
  'ether-fi-ethfi': 'ether-fi',
  ethereumpow: 'ethereum-pow-iou',
  'euler-finance': 'euler',
  eurc: 'euro-coin',
  fetch: 'fetch-ai',
  firo: 'zcoin',
  'first-neiro-on-ethereum': 'neiro-3',
  flare: 'flare-networks',
  'floki-inu': 'floki',
  'gnosis-gno': 'gnosis',
  'gomining-token': 'gmt-token',
  'gravity-token': 'g-token',
  'green-metaverse-token': 'stepn',
  'hashkey-platform-token': 'hashkey-ecopoints',
  holo: 'holotoken',
  'humanity-protocol': 'humanity',
  'io-net': 'io',
  iq: 'everipedia',
  jito: 'jito-governance-token',
  'kamino-finance': 'kamino',
  'lista-dao': 'lista',
  lombard: 'lombard-protocol',
  'maple-finance': 'syrup',
  meme: 'memecoin-2',
  mew: 'cat-in-a-dogs-world',
  'moo-deng-solana': 'moo-deng',
  mvl: 'mass-vehicle-ledger',
  'near-protocol': 'near',
  onyxcoin: 'chain-2',
  'open-campus': 'edu-coin',
  pancakeswap: 'pancakeswap-token',
  'pax-dollar': 'paxos-standard',
  peaq: 'peaq-2',
  'phala-network': 'pha',
  pi: 'pi-network',
  'popcat-sol': 'popcat',
  'pundix-new': 'pundi-x-2',
  quant: 'quant-network',
  quarkchain: 'quark-chain',
  qubic: 'qubic-network',
  redstone: 'redstone-oracles',
  render: 'render-token',
  'reserve-rights': 'reserve-rights-token',
  rlc: 'iexec-rlc',
  safe1: 'safe',
  sei: 'sei-network',
  shentu: 'certik',
  shuffle: 'shuffle-2',
  sign: 'sign-global',
  'skale-network': 'skale',
  'sonic-prev-ftm': 'sonic-3',
  spark: 'spark-2',
  stacks: 'blockstack',
  'starknet-token': 'starknet',
  'storx-network': 'storx',
  'story-protocol': 'story-2',
  'stratis-new': 'stratis',
  superverse: 'superfarm',
  synapse: 'synapse-2',
  'synthetix-network-token': 'havven',
  toncoin: 'the-open-network',
  travala: 'concierge-io',
  trueusd: 'true-usd',
  'world-liberty-financial-wlfi': 'world-liberty-financial',
  'wrapped-bnb': 'wbnb',
  'wrapped-matic': 'wmatic',
  'xinfin-network': 'xdce-crowd-sale',
  'xt-com-token': 'xtcom-token',
  zel: 'zelcash',
};

const COINGECKO_TO_NAMEID: Record<string, string> = Object.fromEntries(
  Object.entries(NAMEID_TO_COINGECKO).map(([nameid, cg]) => [cg, nameid]),
);

/** Quotes whose `price_usd` CoinLore reports reliably (USD and USD stablecoins). */
const USD_QUOTES = new Set(['USD', 'USDT', 'USDC', 'FDUSD', 'DAI', 'USDE', 'TUSD', 'PYUSD', 'RLUSD']);

// =============================================================================
// CACHE
// =============================================================================

const cache = new Map<string, { value: unknown; expires: number }>();
const MAX_CACHE_ENTRIES = 500;

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

/** Drop every cached upstream response (used by tests and health probes). */
export function clearKeylessMarketCache(): void {
  cache.clear();
}

// =============================================================================
// HELPERS
// =============================================================================

/** Parse a CoinLore numeric field ("123.4", 123.4, "" or null). */
function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : undefined;
}

function pricesAgree(a: number, b: number): boolean {
  if (!(a > 0) || !(b > 0)) return false;
  return Math.abs(a - b) / Math.max(a, b) <= PRICE_AGREEMENT_TOLERANCE;
}

async function getJson<T>(url: string, service: string): Promise<T> {
  const res = await resilientFetchResponse(url, {
    service,
    timeoutMs: 8_000,
    retries: 1,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`${service} ${res.status} from ${url}`);
  }
  return (await res.json()) as T;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim().toLowerCase()).filter(Boolean))];
}

// =============================================================================
// DEFILLAMA
// =============================================================================

interface LlamaPriceEntry {
  price: number;
  symbol: string;
  timestamp: number;
  confidence?: number;
}

async function fetchLlamaCurrent(ids: string[]): Promise<Record<string, LlamaPriceEntry>> {
  const key = `llama:current:${ids.join(',')}`;
  return cached(key, SPOT_TTL_MS, async () => {
    const coins = ids.map((id) => `coingecko:${id}`).join(',');
    const body = await getJson<{ coins?: Record<string, LlamaPriceEntry> }>(
      `${DEFILLAMA_COINS_BASE}/prices/current/${coins}`,
      'defillama-coins',
    );
    return body.coins ?? {};
  });
}

async function fetchLlamaChange24h(ids: string[]): Promise<Record<string, number>> {
  const key = `llama:pct24h:${ids.join(',')}`;
  return cached(key, SPOT_TTL_MS, async () => {
    const coins = ids.map((id) => `coingecko:${id}`).join(',');
    const body = await getJson<{ coins?: Record<string, number> }>(
      `${DEFILLAMA_COINS_BASE}/percentage/${coins}?period=24h`,
      'defillama-coins',
    );
    return body.coins ?? {};
  });
}

/**
 * Spot USD prices for CoinGecko ids, from DefiLlama.
 *
 * Coins DefiLlama does not know are absent from the result. When
 * `include24hChange` is set, the 24h change is fetched in parallel; if only
 * that call fails, prices are still returned without the change field.
 * Throws when DefiLlama's price endpoint is unreachable.
 */
export async function getKeylessSpotPrices(
  ids: string[],
  options: { include24hChange?: boolean } = {},
): Promise<Record<string, KeylessSpotPrice>> {
  const wanted = uniqueIds(ids);
  const result: Record<string, KeylessSpotPrice> = {};
  if (wanted.length === 0) return result;

  for (const batch of chunk(wanted, DEFILLAMA_BATCH)) {
    const [prices, changes] = await Promise.all([
      fetchLlamaCurrent(batch),
      options.include24hChange
        ? fetchLlamaChange24h(batch).catch((err: unknown) => {
            console.warn('[keyless-market] DefiLlama 24h change unavailable:', (err as Error).message);
            return {} as Record<string, number>;
          })
        : Promise.resolve({} as Record<string, number>),
    ]);

    for (const id of batch) {
      const entry = prices[`coingecko:${id}`];
      if (!entry || !(entry.price > 0)) continue;
      const spot: KeylessSpotPrice = {
        id,
        symbol: entry.symbol,
        usd: entry.price,
        last_updated_at: entry.timestamp,
      };
      if (typeof entry.confidence === 'number') spot.confidence = entry.confidence;
      const change = changes[`coingecko:${id}`];
      if (typeof change === 'number' && Number.isFinite(change)) spot.usd_24h_change = change;
      result[id] = spot;
    }
  }
  return result;
}

/**
 * Pick the finest DefiLlama candle size that covers `days` within the
 * 500-point cap. CoinGecko uses 5-minute candles for one day, hourly up to 90
 * days and daily beyond; this follows the same idea with the finest size the
 * cap allows. `'max'` returns weekly candles, which reach back about 9.5 years.
 */
export function historyWindowForDays(days: number | 'max'): HistoryWindow {
  if (days === 'max') return { period: '1w', points: MAX_HISTORY_POINTS };
  const spanSeconds = Math.max(days, 1 / 24) * 86_400;
  const order: LlamaPeriod[] = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '2d', '1w'];
  for (const period of order) {
    const points = Math.ceil(spanSeconds / PERIOD_SECONDS[period]);
    if (points <= MAX_HISTORY_POINTS) return { period, points: Math.max(points, 2) };
  }
  return { period: '1w', points: MAX_HISTORY_POINTS };
}

/**
 * USD price history for a CoinGecko id, from DefiLlama's `/chart` endpoint,
 * ending now. Returns an empty array when DefiLlama has no history for the
 * coin; throws when DefiLlama is unreachable.
 */
export async function getKeylessPriceHistory(
  coinId: string,
  window: HistoryWindow,
): Promise<KeylessHistoryPoint[]> {
  const id = coinId.trim().toLowerCase();
  const points = Math.min(Math.max(Math.floor(window.points), 1), MAX_HISTORY_POINTS);
  const key = `llama:chart:${id}:${window.period}:${points}`;
  return cached(key, HISTORY_TTL_MS, async () => {
    const body = await getJson<{
      coins?: Record<string, { prices?: Array<{ timestamp: number; price: number }> }>;
    }>(
      `${DEFILLAMA_COINS_BASE}/chart/coingecko:${encodeURIComponent(id)}?span=${points}&period=${window.period}`,
      'defillama-coins',
    );
    const series = body.coins?.[`coingecko:${id}`]?.prices ?? [];
    return series
      .filter((p) => Number.isFinite(p.price) && Number.isFinite(p.timestamp))
      .map((p) => ({ time: p.timestamp * 1000, priceUsd: p.price }));
  });
}

// =============================================================================
// COINLORE
// =============================================================================

/** Raw CoinLore ticker as `/tickers/` and `/ticker/` return it. */
interface CoinLoreTicker {
  id: string;
  symbol: string;
  name: string;
  nameid: string;
  rank: number | string;
  price_usd: string;
  percent_change_24h?: string;
  percent_change_1h?: string;
  percent_change_7d?: string;
  price_btc?: string;
  market_cap_usd?: string;
  volume24?: number | string;
  csupply?: string;
  tsupply?: string | null;
  msupply?: string | null;
}

function coinGeckoIdForNameid(nameid: string): string {
  return NAMEID_TO_COINGECKO[nameid] ?? nameid;
}

function coinloreImage(nameid: string): string {
  return `https://www.coinlore.com/img/50x50/${nameid}.png`;
}

/** Fetch one CoinLore ranking page (100 coins starting at `start`). */
async function fetchCoinLorePage(start: number): Promise<CoinLoreTicker[]> {
  return cached(`coinlore:tickers:${start}`, LIST_TTL_MS, async () => {
    const body = await getJson<{ data?: CoinLoreTicker[] }>(
      `${COINLORE_BASE}/tickers/?start=${start}&limit=${COINLORE_PAGE_SIZE}`,
      'coinlore',
    );
    if (!Array.isArray(body.data)) throw new Error('coinlore returned no ticker list');
    return body.data;
  });
}

/**
 * The top ~500 CoinLore coins. Pages load in parallel; a failed page is
 * skipped so one slow page does not sink every lookup. Throws only when every
 * page fails.
 */
async function fetchCoinLoreIndex(): Promise<CoinLoreTicker[]> {
  const pages = await Promise.allSettled(
    Array.from({ length: COINLORE_INDEX_PAGES }, (_, i) => fetchCoinLorePage(i * COINLORE_PAGE_SIZE)),
  );
  const ok = pages.filter((p): p is PromiseFulfilledResult<CoinLoreTicker[]> => p.status === 'fulfilled');
  if (ok.length === 0) {
    throw (pages[0] as PromiseRejectedResult).reason;
  }
  return ok.flatMap((p) => p.value);
}

/**
 * Find the CoinLore ticker for a CoinGecko id. Matches on the (aliased)
 * `nameid` first, then on the ticker symbol DefiLlama reports for the id. A
 * candidate whose price disagrees with DefiLlama's by more than 10% is a
 * different coin that happens to share the slug or symbol, and is rejected.
 */
function matchTicker(
  coinId: string,
  index: CoinLoreTicker[],
  llama?: KeylessSpotPrice,
): CoinLoreTicker | undefined {
  const nameid = COINGECKO_TO_NAMEID[coinId] ?? coinId;
  const direct = index.find((t) => t.nameid === nameid);
  if (direct) {
    const price = num(direct.price_usd) ?? 0;
    if (!llama || pricesAgree(price, llama.usd)) return direct;
  }
  if (!llama) return undefined;
  const symbol = llama.symbol.toUpperCase();
  return index
    .filter((t) => t.symbol.toUpperCase() === symbol && pricesAgree(num(t.price_usd) ?? 0, llama.usd))
    .sort((a, b) => Number(a.rank) - Number(b.rank))[0];
}

function tickerToMarketCoin(t: CoinLoreTicker, id = coinGeckoIdForNameid(t.nameid)): KeylessMarketCoin {
  const change24h = num(t.percent_change_24h);
  return {
    id,
    symbol: t.symbol.toLowerCase(),
    name: t.name,
    image: coinloreImage(t.nameid),
    current_price: num(t.price_usd) ?? 0,
    market_cap: num(t.market_cap_usd),
    market_cap_rank: num(t.rank) ?? null,
    total_volume: num(t.volume24),
    price_change_percentage_24h: change24h,
    price_change_percentage_1h_in_currency: num(t.percent_change_1h),
    price_change_percentage_24h_in_currency: change24h,
    price_change_percentage_7d_in_currency: num(t.percent_change_7d),
    circulating_supply: num(t.csupply),
    total_supply: num(t.tsupply) ?? null,
    max_supply: num(t.msupply) ?? null,
    last_updated: new Date().toISOString(),
  };
}

function spotToMarketCoin(spot: KeylessSpotPrice): KeylessMarketCoin {
  return {
    id: spot.id,
    symbol: spot.symbol.toLowerCase(),
    name: spot.symbol.toUpperCase(),
    image: '',
    current_price: spot.usd,
    price_change_percentage_24h: spot.usd_24h_change,
    price_change_percentage_24h_in_currency: spot.usd_24h_change,
    last_updated: new Date(spot.last_updated_at * 1000).toISOString(),
  };
}

/**
 * Resolve CoinGecko ids to CoinLore tickers, verifying each match against
 * DefiLlama's price. Returns the DefiLlama spot prices alongside so callers
 * can serve coins CoinLore does not rank. Either upstream may fail on its own;
 * this throws only when both do.
 */
async function resolveIds(
  ids: string[],
  include24hChange: boolean,
): Promise<{ tickers: Map<string, CoinLoreTicker>; spots: Record<string, KeylessSpotPrice> }> {
  const [spotsRes, indexRes] = await Promise.allSettled([
    getKeylessSpotPrices(ids, { include24hChange }),
    fetchCoinLoreIndex(),
  ]);
  if (spotsRes.status === 'rejected' && indexRes.status === 'rejected') {
    throw spotsRes.reason;
  }
  const spots = spotsRes.status === 'fulfilled' ? spotsRes.value : {};
  const index = indexRes.status === 'fulfilled' ? indexRes.value : [];
  const tickers = new Map<string, CoinLoreTicker>();
  for (const id of ids) {
    const t = matchTicker(id, index, spots[id]);
    if (t) tickers.set(id, t);
  }
  return { tickers, spots };
}

/**
 * Coins in CoinGecko `/coins/markets` shape.
 *
 * - Without `ids`: CoinLore's market-cap ranking, `perPage` (max 250) coins
 *   from page `page`.
 * - With `ids`: those coins, ordered by rank. Coins CoinLore does not rank
 *   come from DefiLlama with price and 24h change only.
 *
 * Throws when the upstreams are unreachable.
 */
export async function getKeylessMarketCoins(
  options: { ids?: string[]; perPage?: number; page?: number } = {},
): Promise<KeylessMarketCoin[]> {
  const perPage = Math.min(Math.max(Math.floor(options.perPage ?? 100), 1), 250);
  const page = Math.max(Math.floor(options.page ?? 1), 1);
  const ids = uniqueIds(options.ids ?? []);

  if (ids.length > 0) {
    const { tickers, spots } = await resolveIds(ids, true);
    const coins: KeylessMarketCoin[] = [];
    for (const id of ids) {
      const t = tickers.get(id);
      if (t) coins.push(tickerToMarketCoin(t, id));
      else if (spots[id]) coins.push(spotToMarketCoin(spots[id]));
    }
    coins.sort((a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity));
    return coins.slice((page - 1) * perPage, page * perPage);
  }

  const start = (page - 1) * perPage;
  const firstPage = Math.floor(start / COINLORE_PAGE_SIZE) * COINLORE_PAGE_SIZE;
  const starts: number[] = [];
  for (let s = firstPage; s < start + perPage; s += COINLORE_PAGE_SIZE) starts.push(s);
  const pages = await Promise.all(starts.map((s) => fetchCoinLorePage(s)));
  const offset = start - firstPage;
  return pages
    .flat()
    .slice(offset, offset + perPage)
    .map((t) => tickerToMarketCoin(t));
}

/**
 * Answer a CoinGecko `/simple/price` query (USD only) from the keyless
 * sources, in CoinGecko's response shape.
 *
 * Price, 24h change and `last_updated_at` come from DefiLlama for any
 * CoinGecko id. `usd_market_cap` and `usd_24h_vol` are included only for coins
 * CoinLore ranks and whose CoinLore price agrees with DefiLlama's. Returns
 * null when no requested coin could be priced.
 */
export async function getKeylessSimplePrice(
  ids: string[],
  options: {
    include24hChange?: boolean;
    includeMarketCap?: boolean;
    include24hVol?: boolean;
    includeLastUpdatedAt?: boolean;
  } = {},
): Promise<Record<string, Record<string, number>> | null> {
  const wanted = uniqueIds(ids);
  if (wanted.length === 0) return null;

  const needsCoinLore = !!(options.includeMarketCap || options.include24hVol);
  let spots: Record<string, KeylessSpotPrice>;
  let tickers = new Map<string, CoinLoreTicker>();
  if (needsCoinLore) {
    ({ spots, tickers } = await resolveIds(wanted, !!options.include24hChange));
  } else {
    spots = await getKeylessSpotPrices(wanted, { include24hChange: options.include24hChange });
  }

  const out: Record<string, Record<string, number>> = {};
  for (const id of wanted) {
    const spot = spots[id];
    if (!spot) continue;
    const entry: Record<string, number> = { usd: spot.usd };
    const t = tickers.get(id);
    if (options.includeMarketCap && t) {
      const mcap = num(t.market_cap_usd);
      if (mcap !== undefined) entry.usd_market_cap = mcap;
    }
    if (options.include24hVol && t) {
      const vol = num(t.volume24);
      if (vol !== undefined) entry.usd_24h_vol = vol;
    }
    if (options.include24hChange && spot.usd_24h_change !== undefined) {
      entry.usd_24h_change = spot.usd_24h_change;
    }
    if (options.includeLastUpdatedAt) entry.last_updated_at = spot.last_updated_at;
    out[id] = entry;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Details for one CoinGecko id. Uses CoinLore's full market fields when it
 * ranks the coin (and its price agrees with DefiLlama's), otherwise
 * DefiLlama's price and 24h change alone. Returns null when neither source
 * knows the coin; throws when both are unreachable.
 */
export async function getKeylessCoinDetails(coinId: string): Promise<KeylessCoinDetail | null> {
  const id = coinId.trim().toLowerCase();
  if (!id) return null;
  const { tickers, spots } = await resolveIds([id], true);
  const t = tickers.get(id);
  const spot = spots[id];

  if (t) {
    return {
      id,
      symbol: t.symbol.toUpperCase(),
      name: t.name,
      image: coinloreImage(t.nameid),
      rank: num(t.rank) ?? null,
      priceUsd: num(t.price_usd) ?? spot?.usd ?? 0,
      priceBtc: num(t.price_btc),
      change1h: num(t.percent_change_1h),
      change24h: num(t.percent_change_24h),
      change7d: num(t.percent_change_7d),
      marketCapUsd: num(t.market_cap_usd),
      volume24hUsd: num(t.volume24),
      circulatingSupply: num(t.csupply),
      totalSupply: num(t.tsupply) ?? null,
      maxSupply: num(t.msupply) ?? null,
      coinloreId: t.id,
      source: 'coinlore',
      lastUpdated: new Date().toISOString(),
    };
  }

  if (spot) {
    return {
      id,
      symbol: spot.symbol.toUpperCase(),
      name: spot.symbol.toUpperCase(),
      image: null,
      rank: null,
      priceUsd: spot.usd,
      change24h: spot.usd_24h_change,
      source: 'defillama',
      lastUpdated: new Date(spot.last_updated_at * 1000).toISOString(),
    };
  }

  return null;
}

/**
 * Search the top ~500 coins by name, ticker or slug. Exact ticker and name
 * matches rank first, then prefix matches, then substring matches; ties go to
 * the higher market cap. Throws when CoinLore is unreachable.
 */
export async function searchKeylessCoins(query: string, limit = 10): Promise<KeylessSearchCoin[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const index = await fetchCoinLoreIndex();

  const scored: Array<{ t: CoinLoreTicker; score: number }> = [];
  for (const t of index) {
    const symbol = t.symbol.toLowerCase();
    const name = t.name.toLowerCase();
    const id = coinGeckoIdForNameid(t.nameid);
    let score: number;
    if (symbol === q || name === q || id === q || t.nameid === q) score = 0;
    else if (symbol.startsWith(q) || name.startsWith(q) || id.startsWith(q)) score = 1;
    else if (name.includes(q) || id.includes(q)) score = 2;
    else continue;
    scored.push({ t, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || Number(a.t.rank) - Number(b.t.rank))
    .slice(0, Math.max(limit, 1))
    .map(({ t }) => ({
      id: coinGeckoIdForNameid(t.nameid),
      name: t.name,
      symbol: t.symbol.toUpperCase(),
      rank: num(t.rank) ?? null,
      image: coinloreImage(t.nameid),
    }));
}

/**
 * Trading pairs for a coin from CoinLore, busiest first. Only pairs quoted in
 * USD or a USD stablecoin are returned: CoinLore's USD conversion of other
 * fiat quotes (KRW, IDR and so on) is unreliable. Returns an empty array for
 * coins CoinLore does not rank.
 */
export async function getKeylessCoinMarkets(coinId: string, limit = 10): Promise<KeylessCoinMarket[]> {
  const detail = await getKeylessCoinDetails(coinId);
  if (!detail?.coinloreId) return [];
  const coinloreId = detail.coinloreId;
  const rows = await cached(`coinlore:markets:${coinloreId}`, MARKETS_TTL_MS, () =>
    getJson<Array<{
      name: string;
      base: string;
      quote: string;
      price_usd: number;
      volume_usd: number;
    }>>(`${COINLORE_BASE}/coin/markets/?id=${encodeURIComponent(coinloreId)}`, 'coinlore'),
  );
  if (!Array.isArray(rows)) return [];

  const total = detail.volume24hUsd;
  return rows
    .filter((r) => USD_QUOTES.has(String(r.quote).toUpperCase()) && r.price_usd > 0)
    .sort((a, b) => (b.volume_usd || 0) - (a.volume_usd || 0))
    .slice(0, Math.max(limit, 1))
    .map((r) => {
      const market: KeylessCoinMarket = {
        exchange: r.name,
        base: r.base,
        quote: r.quote,
        priceUsd: r.price_usd,
        volumeUsd24h: r.volume_usd || 0,
      };
      if (total && total > 0 && r.volume_usd) market.volumePercent = (r.volume_usd / total) * 100;
      return market;
    });
}
