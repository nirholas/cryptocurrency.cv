/**
 * Farcaster Social Adapter — Decentralized social protocol metrics
 *
 * Farcaster data via Neynar API:
 * - Cast (post) volume and engagement
 * - Trending topics in crypto discussions
 * - User growth and activity metrics
 * - Requires NEYNAR_API_KEY
 *
 * @module providers/adapters/social/farcaster
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { SocialMetric } from './types';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 300,
  windowMs: 60_000,
};

/**
 * Farcaster social metrics provider via Neynar API.
 *
 * Priority: 4 (supplementary)
 * Weight: 0.15 (niche but valuable for crypto-native sentiment)
 */
export const farcasterAdapter: DataProvider<SocialMetric[]> = {
  name: 'farcaster',
  description: 'Farcaster via Neynar — decentralized social data for crypto-native audience',
  priority: 4,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['social-metrics'],

  async fetch(params: FetchParams): Promise<SocialMetric[]> {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY required for Farcaster data');
    }

    const limit = params.limit ?? 25;
    const query = params.extra?.query as string ?? 'crypto';

    // Search for trending crypto casts
    const response = await fetch(
      `${NEYNAR_BASE}/feed/trending?limit=${Math.min(limit, 100)}&time_window=24h`,
      {
        headers: {
          Accept: 'application/json',
          api_key: apiKey,
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const json = await response.json();
    const casts: NeynarCast[] = json?.casts ?? [];
    const now = new Date().toISOString();

    // Aggregate engagement by mentioned coin/topic
    const coinMentions = new Map<string, { posts: number; likes: number; recasts: number; replies: number }>();

    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol',
      'defi', 'nft', 'web3', 'crypto', 'layer2', 'airdrop',
      'staking', 'yield', 'dex', 'dao',
    ];

    for (const cast of casts) {
      const text = (cast.text || '').toLowerCase();
      for (const keyword of cryptoKeywords) {
        if (text.includes(keyword)) {
          const existing = coinMentions.get(keyword) || {
            posts: 0, likes: 0, recasts: 0, replies: 0,
          };
          existing.posts += 1;
          existing.likes += cast.reactions?.likes_count ?? 0;
          existing.recasts += cast.reactions?.recasts_count ?? 0;
          existing.replies += cast.replies?.count ?? 0;
          coinMentions.set(keyword, existing);
        }
      }
    }

    // If no crypto mentions found in trending, search explicitly
    if (coinMentions.size === 0) {
      const searchResponse = await fetch(
        `${NEYNAR_BASE}/cast/search?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}`,
        {
          headers: {
            Accept: 'application/json',
            api_key: apiKey,
          },
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (searchResponse.ok) {
        const searchJson = await searchResponse.json();
        const searchCasts: NeynarCast[] = searchJson?.result?.casts ?? [];

        for (const cast of searchCasts) {
          const text = (cast.text || '').toLowerCase();
          for (const keyword of cryptoKeywords) {
            if (text.includes(keyword)) {
              const existing = coinMentions.get(keyword) || {
                posts: 0, likes: 0, recasts: 0, replies: 0,
              };
              existing.posts += 1;
              existing.likes += cast.reactions?.likes_count ?? 0;
              existing.recasts += cast.reactions?.recasts_count ?? 0;
              existing.replies += cast.replies?.count ?? 0;
              coinMentions.set(keyword, existing);
            }
          }
        }
      }
    }

    const results: SocialMetric[] = Array.from(coinMentions.entries())
      .map(([topic, data]) => ({
        symbol: topic.toUpperCase(),
        name: topic,
        socialScore: data.posts + data.likes * 0.5 + data.recasts * 2 + data.replies,
        socialVolume: data.posts,
        socialDominance: 0,
        sentiment: 0, // Would need NLP for sentiment
        galaxyScore: 0,
        altRank: 0,
        contributors: 0,
        twitterMentions: 0,
        source: 'farcaster',
        timestamp: now,
      }));

    return results.sort((a, b) => b.socialScore - a.socialScore).slice(0, limit);
  },

  async healthCheck(): Promise<boolean> {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) return false;
    try {
      const res = await fetch(`${NEYNAR_BASE}/feed/trending?limit=1`, {
        headers: { api_key: apiKey },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: SocialMetric[]): boolean {
    if (!Array.isArray(data)) return false;
    return data.every(d => typeof d.socialScore === 'number');
  },
};

interface NeynarCast {
  hash: string;
  text: string;
  timestamp: string;
  reactions?: {
    likes_count: number;
    recasts_count: number;
  };
  replies?: {
    count: number;
  };
  author?: {
    fid: number;
    username: string;
    display_name: string;
    follower_count: number;
  };
}
