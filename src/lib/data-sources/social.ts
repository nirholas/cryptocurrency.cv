/**
 * Social Sentiment & Community Data — LunarCrush, Snapshot governance, Fear & Greed
 *
 * Sources: LunarCrush, Alternative.me, Snapshot, Tally
 *
 * @module data-sources/social
 */

import { lunarcrush, alternative, snapshot, tally } from './index';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SocialMetrics {
  symbol: string;
  name: string;
  galaxyScore: number;
  altRank: number;
  socialVolume: number;
  socialDominance: number;
  socialScore: number;
  tweetVolume: number;
  redditVolume: number;
  newsVolume: number;
  sentiment: number; // 0-100
  bullishPercent: number;
  bearishPercent: number;
  timestamp: number;
}

export interface FearGreedIndex {
  value: number;
  classification: string;
  timestamp: number;
  previousClose: number;
  previousClassification: string;
}

export interface FearGreedHistory {
  date: string;
  value: number;
  classification: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  body: string;
  state: 'active' | 'closed' | 'pending';
  author: string;
  space: string;
  start: number;
  end: number;
  choices: string[];
  scores: number[];
  scoresTotal: number;
  votes: number;
  quorum: number;
  link: string;
}

export interface GovernanceSpace {
  id: string;
  name: string;
  about: string;
  network: string;
  symbol: string;
  members: number;
  proposals: number;
  categories: string[];
  treasuryValue?: number;
}

export interface TrendingToken {
  symbol: string;
  name: string;
  socialVolume24h: number;
  socialVolumeChange: number;
  sentimentScore: number;
  priceChange24h: number;
  category: string;
}

// ═══════════════════════════════════════════════════════════════
// LUNARCRUSH — SOCIAL METRICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get social metrics for a token from LunarCrush
 */
export async function getTokenSocial(symbol: string): Promise<SocialMetrics | null> {
  try {
    const data = await lunarcrush.fetch<{ data: any[] }>(
      `/coins/${symbol.toLowerCase()}/v1`,
    );
    const coin = data.data?.[0];
    if (!coin) return null;

    return {
      symbol: coin.symbol || symbol,
      name: coin.name || '',
      galaxyScore: coin.galaxy_score || 0,
      altRank: coin.alt_rank || 0,
      socialVolume: coin.social_volume || 0,
      socialDominance: coin.social_dominance || 0,
      socialScore: coin.social_score || 0,
      tweetVolume: coin.tweet_volume || 0,
      redditVolume: coin.reddit_volume || 0,
      newsVolume: coin.news_volume || 0,
      sentiment: coin.sentiment || 50,
      bullishPercent: coin.bullish_sentiment || 0,
      bearishPercent: coin.bearish_sentiment || 0,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Get trending tokens by social volume
 */
export async function getTrendingSocial(limit = 20): Promise<TrendingToken[]> {
  try {
    const data = await lunarcrush.fetch<{ data: any[] }>('/coins/list/v2');
    return (data.data || []).slice(0, limit).map((coin: any) => ({
      symbol: coin.symbol || '',
      name: coin.name || '',
      socialVolume24h: coin.social_volume || 0,
      socialVolumeChange: coin.social_volume_change || 0,
      sentimentScore: coin.sentiment || 50,
      priceChange24h: coin.price_change_24h || 0,
      category: coin.category || 'crypto',
    }));
  } catch {
    return [];
  }
}

/**
 * Get social metrics for multiple tokens
 */
export async function getBatchSocialMetrics(symbols: string[]): Promise<SocialMetrics[]> {
  const results = await Promise.allSettled(symbols.map((s) => getTokenSocial(s)));
  return results
    .filter((r): r is PromiseFulfilledResult<SocialMetrics | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((m): m is SocialMetrics => m !== null);
}

// ═══════════════════════════════════════════════════════════════
// FEAR & GREED INDEX
// ═══════════════════════════════════════════════════════════════

/**
 * Get current Crypto Fear & Greed Index
 */
export async function getFearGreedIndex(): Promise<FearGreedIndex> {
  const data = await alternative.fetch<{
    data: Array<{
      value: string;
      value_classification: string;
      timestamp: string;
    }>;
  }>('/fng/?limit=2');

  const current = data.data[0];
  const previous = data.data[1];

  return {
    value: parseInt(current.value),
    classification: current.value_classification,
    timestamp: parseInt(current.timestamp) * 1000,
    previousClose: parseInt(previous?.value || current.value),
    previousClassification: previous?.value_classification || current.value_classification,
  };
}

/**
 * Get Fear & Greed Index history
 */
export async function getFearGreedHistory(days = 30): Promise<FearGreedHistory[]> {
  const data = await alternative.fetch<{
    data: Array<{
      value: string;
      value_classification: string;
      timestamp: string;
    }>;
  }>(`/fng/?limit=${days}`);

  return (data.data || []).map((d) => ({
    date: new Date(parseInt(d.timestamp) * 1000).toISOString().split('T')[0],
    value: parseInt(d.value),
    classification: d.value_classification,
  }));
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT — GOVERNANCE
// ═══════════════════════════════════════════════════════════════

/**
 * Get active governance proposals from Snapshot
 */
export async function getActiveProposals(
  space?: string,
  limit = 20,
): Promise<GovernanceProposal[]> {
  const query = `{
    proposals(
      first: ${limit},
      skip: 0,
      where: {
        state: "active",
        ${space ? `space: "${space}",` : ''}
      },
      orderBy: "created",
      orderDirection: desc
    ) {
      id
      title
      body
      state
      author
      space { id }
      start
      end
      choices
      scores
      scores_total
      votes
      quorum
      link
    }
  }`;

  try {
    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.data?.proposals || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      body: (p.body || '').slice(0, 500),
      state: p.state,
      author: p.author,
      space: p.space?.id || '',
      start: p.start * 1000,
      end: p.end * 1000,
      choices: p.choices || [],
      scores: p.scores || [],
      scoresTotal: p.scores_total || 0,
      votes: p.votes || 0,
      quorum: p.quorum || 0,
      link: p.link || `https://snapshot.org/#/${p.space?.id}/proposal/${p.id}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Get top governance spaces on Snapshot
 */
export async function getTopSpaces(limit = 20): Promise<GovernanceSpace[]> {
  const query = `{
    spaces(
      first: ${limit},
      skip: 0,
      orderBy: "followersCount",
      orderDirection: desc
    ) {
      id
      name
      about
      network
      symbol
      followersCount
      proposalsCount
      categories
      treasuries {
        name
        network
        address
      }
    }
  }`;

  try {
    const response = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.data?.spaces || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      about: (s.about || '').slice(0, 300),
      network: s.network || '',
      symbol: s.symbol || '',
      members: s.followersCount || 0,
      proposals: s.proposalsCount || 0,
      categories: s.categories || [],
    }));
  } catch {
    return [];
  }
}

/**
 * Get governance proposals for major DeFi protocols
 */
export async function getMajorProtocolGovernance(): Promise<
  Record<string, GovernanceProposal[]>
> {
  const majorSpaces = [
    'aave.eth',
    'uniswapgovernance.eth',
    'sushigov.eth',
    'lido-snapshot.eth',
    'compound-governance.eth',
    'arbitrumfoundation.eth',
    'opcollective.eth',
    'ens.eth',
  ];

  const results = await Promise.allSettled(
    majorSpaces.map(async (space) => ({
      space,
      proposals: await getActiveProposals(space, 5),
    })),
  );

  const governance: Record<string, GovernanceProposal[]> = {};
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.proposals.length > 0) {
      governance[result.value.space] = result.value.proposals;
    }
  }

  return governance;
}

// ═══════════════════════════════════════════════════════════════
// AGGREGATED VIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Full social & sentiment dashboard
 */
export async function getSocialDashboard(): Promise<{
  fearGreed: FearGreedIndex | null;
  fearGreedHistory: FearGreedHistory[];
  trendingTokens: TrendingToken[];
  btcSocial: SocialMetrics | null;
  ethSocial: SocialMetrics | null;
  activeProposals: GovernanceProposal[];
  topSpaces: GovernanceSpace[];
}> {
  const [fearGreed, history, trending, btc, eth, proposals, spaces] = await Promise.allSettled([
    getFearGreedIndex(),
    getFearGreedHistory(7),
    getTrendingSocial(10),
    getTokenSocial('BTC'),
    getTokenSocial('ETH'),
    getActiveProposals(undefined, 10),
    getTopSpaces(10),
  ]);

  return {
    fearGreed: fearGreed.status === 'fulfilled' ? fearGreed.value : null,
    fearGreedHistory: history.status === 'fulfilled' ? history.value : [],
    trendingTokens: trending.status === 'fulfilled' ? trending.value : [],
    btcSocial: btc.status === 'fulfilled' ? btc.value : null,
    ethSocial: eth.status === 'fulfilled' ? eth.value : null,
    activeProposals: proposals.status === 'fulfilled' ? proposals.value : [],
    topSpaces: spaces.status === 'fulfilled' ? spaces.value : [],
  };
}

/**
 * Social sentiment for a specific token with governance context
 */
export async function getTokenSentimentProfile(symbol: string, snapshotSpace?: string): Promise<{
  social: SocialMetrics | null;
  fearGreed: FearGreedIndex | null;
  governance: GovernanceProposal[];
}> {
  const [social, fearGreed, governance] = await Promise.allSettled([
    getTokenSocial(symbol),
    getFearGreedIndex(),
    snapshotSpace ? getActiveProposals(snapshotSpace) : Promise.resolve([]),
  ]);

  return {
    social: social.status === 'fulfilled' ? social.value : null,
    fearGreed: fearGreed.status === 'fulfilled' ? fearGreed.value : null,
    governance: governance.status === 'fulfilled' ? governance.value : [],
  };
}
