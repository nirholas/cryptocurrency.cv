/**
 * Santiment Adapter — On-chain + Social Analytics
 *
 * Santiment provides unique insights combining:
 * - Social sentiment analysis (crypto Twitter, Reddit, Telegram)
 * - On-chain metrics (active addresses, whale transactions)
 * - Development activity (GitHub commits)
 * - Market metrics with social context
 *
 * Uses the free SanAPI GraphQL endpoint.
 * For pro features, set SANTIMENT_API_KEY.
 *
 * API: https://api.santiment.net/graphiql
 * env: SANTIMENT_API_KEY
 *
 * @module providers/adapters/social/santiment
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { SocialMetric } from './types';

const SANTIMENT_API = 'https://api.santiment.net/graphql';
const SANTIMENT_API_KEY = process.env.SANTIMENT_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: SANTIMENT_API_KEY ? 30 : 10,
  windowMs: 60_000,
};

// GraphQL query for social + on-chain data
function buildQuery(slug: string, from: string, to: string): string {
  return JSON.stringify({
    query: `{
      getMetric(metric: "social_volume_total") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime
          value
        }
      }
      sentimentPositive: getMetric(metric: "sentiment_positive_total") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime
          value
        }
      }
      sentimentNegative: getMetric(metric: "sentiment_negative_total") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime
          value
        }
      }
      devActivity: getMetric(metric: "dev_activity") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime
          value
        }
      }
      activeAddresses: getMetric(metric: "daily_active_addresses") {
        timeseriesData(slug: "${slug}", from: "${from}", to: "${to}", interval: "1d") {
          datetime
          value
        }
      }
    }`,
  });
}

// Map common symbols to Santiment slugs
const SLUG_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binance-coin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche',
  DOT: 'polkadot',
  MATIC: 'polygon',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  MKR: 'maker',
  CRV: 'curve-dao-token',
  ARB: 'arbitrum',
  OP: 'optimism',
};

function getSlug(symbol: string): string {
  return SLUG_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
}

function getLatestValue(data: Array<{ value: number }> | undefined): number {
  if (!data || data.length === 0) return 0;
  return data[data.length - 1].value;
}

export const santimentAdapter: DataProvider<SocialMetric[]> = {
  name: 'santiment',
  description: 'Santiment — Social + on-chain analytics with development activity tracking',
  priority: 2,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['social-metrics', 'on-chain'],

  async fetch(params: FetchParams): Promise<SocialMetric[]> {
    const symbols = params.symbols ?? ['BTC', 'ETH', 'SOL'];
    const now = new Date();
    const to = now.toISOString();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const results = await Promise.allSettled(
      symbols.map(async (symbol): Promise<SocialMetric> => {
        const slug = getSlug(symbol);
        const body = buildQuery(slug, from, to);

        const res = await fetch(SANTIMENT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'free-crypto-news/2.0',
            ...(SANTIMENT_API_KEY && { Authorization: `Apikey ${SANTIMENT_API_KEY}` }),
          },
          body,
        });

        if (!res.ok) throw new Error(`Santiment ${res.status}`);

        const json = await res.json();
        const d = json.data || {};

        const socialVolume = getLatestValue(d.getMetric?.timeseriesData);
        const positive = getLatestValue(d.sentimentPositive?.timeseriesData);
        const negative = getLatestValue(d.sentimentNegative?.timeseriesData);
        const devActivity = getLatestValue(d.devActivity?.timeseriesData);
        const activeAddresses = getLatestValue(d.activeAddresses?.timeseriesData);

        // Normalize sentiment to -1 to 1 range
        const sentimentTotal = positive + negative;
        const sentiment = sentimentTotal > 0
          ? (positive - negative) / sentimentTotal
          : 0;

        // Social score: blend of social volume + dev activity
        const socialScore = Math.min(100, Math.round(
          (socialVolume / 10) * 0.6 + devActivity * 0.4,
        ));

        return {
          symbol: symbol.toUpperCase(),
          name: slug,
          socialScore,
          socialVolume: Math.round(socialVolume),
          socialDominance: 0, // Would need global volume for ratio
          sentiment: Math.round(sentiment * 1000) / 1000,
          contributors: Math.round(activeAddresses),
          source: 'santiment',
          timestamp: to,
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<SocialMetric> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(SANTIMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ currentUser { id } }' }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  normalize(data: SocialMetric[]): SocialMetric[] {
    return data;
  },
};

export default santimentAdapter;
