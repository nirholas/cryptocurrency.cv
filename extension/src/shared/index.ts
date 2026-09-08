/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * Shared settings, storage, and API client for the browser extension.
 * Every surface (popup, options, service worker) imports from here so the
 * three agree on storage keys and response shapes.
 */

export const DEFAULT_API_BASE_URL = 'https://cryptocurrency.cv';

/** Categories exposed as popup tabs. Keys match the API's `category` query parameter. */
export const CATEGORIES: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'bitcoin', label: 'Bitcoin' },
  { key: 'ethereum', label: 'Ethereum' },
  { key: 'solana', label: 'Solana' },
  { key: 'defi', label: 'DeFi' },
  { key: 'macro', label: 'Macro' },
  { key: 'etf', label: 'ETF' },
  { key: 'security', label: 'Security' },
];

export const REFRESH_OPTIONS = [2, 5, 15, 30] as const;
export type RefreshMinutes = (typeof REFRESH_OPTIONS)[number];

/** Coins shown in the ticker. Keys are CoinGecko ids, which /api/prices expects. */
export const TICKER_COINS: ReadonlyArray<{ id: string; symbol: string }> = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
];

export interface Settings {
  defaultCategory: string;
  refreshMinutes: RefreshMinutes;
  notificationsEnabled: boolean;
  apiBaseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultCategory: 'all',
  refreshMinutes: 5,
  notificationsEnabled: true,
  apiBaseUrl: DEFAULT_API_BASE_URL,
};

/** Article shape returned by GET /api/news (subset the extension uses). */
export interface NewsArticle {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
  tier?: string;
  imageUrl?: string;
  ai?: { impactScore?: number; summary?: string };
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  sources: string[];
  fetchedAt: string;
}

/** GET /api/prices?coins=... returns { [coinId]: { usd, usd_24h_change } }. */
export type PricesResponse = Record<string, { usd: number; usd_24h_change?: number }>;

export interface CachedNews {
  articles: NewsArticle[];
  fetchedAt: number;
}

export interface CachedPrices {
  prices: PricesResponse;
  fetchedAt: number;
}

export const ALARM_NAME = 'fcn-poll';
export const NEWS_LIMIT = 20;

/** Storage keys. Settings sync across the profile; caches stay local. */
export const STORAGE = {
  settings: 'settings',
  newsCache: 'newsCache',
  pricesCache: 'pricesCache',
  seenLinks: 'seenLinks',
  unreadBreaking: 'unreadBreaking',
  lastError: 'lastError',
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  const url = new URL(trimmed);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('API base URL must use https (http is only allowed for localhost)');
  }
  return url.origin + url.pathname.replace(/\/+$/, '');
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(STORAGE.settings);
  const raw = (stored[STORAGE.settings] ?? {}) as Partial<Settings>;
  const refresh = REFRESH_OPTIONS.includes(raw.refreshMinutes as RefreshMinutes)
    ? (raw.refreshMinutes as RefreshMinutes)
    : DEFAULT_SETTINGS.refreshMinutes;
  const category = CATEGORIES.some((c) => c.key === raw.defaultCategory)
    ? (raw.defaultCategory as string)
    : DEFAULT_SETTINGS.defaultCategory;
  let apiBaseUrl = DEFAULT_SETTINGS.apiBaseUrl;
  if (typeof raw.apiBaseUrl === 'string' && raw.apiBaseUrl) {
    try {
      apiBaseUrl = normalizeBaseUrl(raw.apiBaseUrl);
    } catch {
      apiBaseUrl = DEFAULT_SETTINGS.apiBaseUrl;
    }
  }
  return {
    defaultCategory: category,
    refreshMinutes: refresh,
    notificationsEnabled:
      typeof raw.notificationsEnabled === 'boolean'
        ? raw.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,
    apiBaseUrl,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE.settings]: settings });
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    // Default Accept stays "*/*" so the API treats us as a browser reader,
    // which is what we are; the JSON-only Accept is reserved for SDK clients.
    headers: { 'X-Requested-With': 'free-crypto-news-extension' },
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    let retryAfter: number | undefined;
    try {
      const body = (await response.json()) as { error?: string; retryAfter?: number };
      if (body.error) message = body.error;
      if (typeof body.retryAfter === 'number') retryAfter = body.retryAfter;
    } catch {
      // Non-JSON error body; the status line is the message.
    }
    throw new ApiError(message, response.status, retryAfter);
  }
  return (await response.json()) as T;
}

export async function fetchNews(baseUrl: string, category: string, limit = NEWS_LIMIT): Promise<NewsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category !== 'all') params.set('category', category);
  return requestJson<NewsResponse>(`${baseUrl}/api/news?${params.toString()}`);
}

export async function fetchPrices(baseUrl: string): Promise<PricesResponse> {
  const ids = TICKER_COINS.map((c) => c.id).join(',');
  return requestJson<PricesResponse>(`${baseUrl}/api/prices?coins=${ids}`);
}

export async function readNewsCache(): Promise<Record<string, CachedNews>> {
  const stored = await chrome.storage.local.get(STORAGE.newsCache);
  return (stored[STORAGE.newsCache] ?? {}) as Record<string, CachedNews>;
}

export async function writeNewsCache(category: string, entry: CachedNews): Promise<void> {
  const cache = await readNewsCache();
  cache[category] = entry;
  await chrome.storage.local.set({ [STORAGE.newsCache]: cache });
}

export async function readPricesCache(): Promise<CachedPrices | undefined> {
  const stored = await chrome.storage.local.get(STORAGE.pricesCache);
  return stored[STORAGE.pricesCache] as CachedPrices | undefined;
}

export async function writePricesCache(entry: CachedPrices): Promise<void> {
  await chrome.storage.local.set({ [STORAGE.pricesCache]: entry });
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatUsd(value: number): string {
  return value >= 1000 ? usdCompact.format(value) : usd.format(value);
}

export function formatChange(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatRelativeAge(fetchedAt: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - fetchedAt) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/**
 * Breaking-news heuristic. The dedicated /api/breaking route is a paid x402
 * endpoint, so the worker derives urgency from the free feed: an article
 * counts as breaking when it comes from a top-tier source or the API's AI
 * enrichment scores it as high impact.
 */
export function isBreaking(article: NewsArticle): boolean {
  if (article.tier === 'tier1') return true;
  const impact = article.ai?.impactScore;
  return typeof impact === 'number' && impact >= 7;
}
