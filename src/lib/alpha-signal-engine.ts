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
 * Alpha Signal Intelligence Engine
 * 
 * AI-powered system that detects early market-moving signals in news
 * before they become mainstream, with confidence scoring and track record.
 */

export interface AlphaSignal {
  id: string;
  timestamp: Date;
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  source: string;
  
  // Signal Analysis
  signalType: 'bullish' | 'bearish' | 'neutral' | 'volatility';
  signalStrength: number; // 0-100
  confidence: number; // 0-100
  urgency: 'critical' | 'high' | 'medium' | 'low';
  
  // Affected Assets
  primaryAsset: string;
  relatedAssets: string[];
  
  // AI Analysis
  alphaScore: number; // 0-100 - likelihood of price movement
  narrativeShift: string;
  keyInsight: string;
  actionableIntel: string;
  
  // Timing
  expectedImpactWindow: string; // e.g., "1-4 hours", "24-48 hours"
  detectedAt: Date;
  
  // Verification
  priceAtDetection?: number;
  priceAfter24h?: number;
  actualMovement?: number;
  wasAccurate?: boolean;
  
  // Virality
  shareCount: number;
  viewCount: number;
  savedCount: number;
}

export interface AlphaLeaderboardEntry {
  rank: number;
  address?: string; // wallet or anonymous ID
  username: string;
  avatar?: string;
  
  // Stats
  signalsCaught: number;
  accuracyRate: number;
  totalAlphaScore: number;
  avgResponseTime: number; // seconds to act on signal
  
  // Achievements
  badges: AlphaBadge[];
  streak: number;
  bestCall: {
    asset: string;
    movement: number;
    date: Date;
  };
}

export interface AlphaBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export interface NarrativeCluster {
  id: string;
  name: string;
  description: string;
  momentum: number; // -100 to 100
  articleCount: number;
  topAssets: string[];
  sentiment: number;
  trendDirection: 'emerging' | 'peaking' | 'fading' | 'stable';
  predictedImpact: 'high' | 'medium' | 'low';
}

export interface SmartMoneyIndicator {
  category: string;
  signal: string;
  strength: number;
  description: string;
}

// Keywords that indicate high-alpha potential
const ALPHA_KEYWORDS = {
  critical: [
    'exclusive', 'breaking', 'leaked', 'insider', 'confidential',
    'imminent', 'confirmed', 'official', 'approved', 'rejected',
    'hack', 'exploit', 'vulnerability', 'breach', 'compromised',
    'ban', 'lawsuit', 'investigation', 'subpoena', 'indictment',
  ],
  high: [
    'partnership', 'acquisition', 'merger', 'integration', 'launch',
    'upgrade', 'hard fork', 'airdrop', 'listing', 'delisting',
    'whale', 'institutional', 'etf', 'custody', 'adoption',
  ],
  medium: [
    'update', 'announcement', 'release', 'roadmap', 'milestone',
    'growth', 'expansion', 'development', 'progress', 'advance',
  ],
};

export function calculateAlphaScore(
  title: string,
  content: string,
  source: string,
  publishTime: Date
): number {
  let score = 50; // Base score
  
  const text = `${title} ${content}`.toLowerCase();
  
  // Check for alpha keywords
  ALPHA_KEYWORDS.critical.forEach(keyword => {
    if (text.includes(keyword)) score += 15;
  });
  
  ALPHA_KEYWORDS.high.forEach(keyword => {
    if (text.includes(keyword)) score += 8;
  });
  
  ALPHA_KEYWORDS.medium.forEach(keyword => {
    if (text.includes(keyword)) score += 3;
  });
  
  // Source credibility bonus
  const premiumSources = ['bloomberg', 'reuters', 'wsj', 'coindesk', 'theblock'];
  if (premiumSources.some(s => source.toLowerCase().includes(s))) {
    score += 10;
  }
  
  // Freshness bonus - newer = higher alpha potential
  const ageMinutes = (Date.now() - publishTime.getTime()) / 60000;
  if (ageMinutes < 5) score += 20;
  else if (ageMinutes < 15) score += 15;
  else if (ageMinutes < 30) score += 10;
  else if (ageMinutes < 60) score += 5;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

export function determineSignalType(
  sentiment: number,
  volatilityIndicators: number
): AlphaSignal['signalType'] {
  if (volatilityIndicators > 70) return 'volatility';
  if (sentiment > 60) return 'bullish';
  if (sentiment < 40) return 'bearish';
  return 'neutral';
}

export function determineUrgency(
  alphaScore: number,
  signalStrength: number
): AlphaSignal['urgency'] {
  const combined = (alphaScore + signalStrength) / 2;
  if (combined >= 85) return 'critical';
  if (combined >= 70) return 'high';
  if (combined >= 50) return 'medium';
  return 'low';
}

export function generateShareableCard(signal: AlphaSignal): string {
  const emoji = signal.signalType === 'bullish' ? '🚀' : 
                signal.signalType === 'bearish' ? '🔻' : 
                signal.signalType === 'volatility' ? '⚡' : '📊';
  
  return `${emoji} ALPHA SIGNAL DETECTED

Asset: $${signal.primaryAsset}
Signal: ${signal.signalType.toUpperCase()}
Alpha Score: ${signal.alphaScore}/100
Confidence: ${signal.confidence}%

"${signal.keyInsight}"

⏰ Impact Window: ${signal.expectedImpactWindow}

Caught by Alpha Signal Intelligence
🔗 freecryptonews.io/alpha`;
}

export const ALPHA_BADGES: AlphaBadge[] = [
  {
    id: 'early-bird',
    name: 'Early Bird',
    icon: '🐦',
    description: 'Acted on 10 signals within 5 minutes',
    rarity: 'common',
  },
  {
    id: 'alpha-hunter',
    name: 'Alpha Hunter',
    icon: '🎯',
    description: '50 accurate signal predictions',
    rarity: 'rare',
  },
  {
    id: 'whale-whisperer',
    name: 'Whale Whisperer',
    icon: '🐋',
    description: 'Caught 10 whale movement signals early',
    rarity: 'epic',
  },
  {
    id: 'oracle',
    name: 'The Oracle',
    icon: '🔮',
    description: '90%+ accuracy over 100 signals',
    rarity: 'legendary',
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    icon: '⚡',
    description: 'Sub-30 second average response time',
    rarity: 'epic',
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    icon: '🔥',
    description: '20 accurate predictions in a row',
    rarity: 'legendary',
  },
  {
    id: 'diversified',
    name: 'Diversified',
    icon: '🌐',
    description: 'Signals across 20+ different assets',
    rarity: 'rare',
  },
  {
    id: 'bear-hunter',
    name: 'Bear Hunter',
    icon: '🐻',
    description: 'Caught 25 bearish signals accurately',
    rarity: 'rare',
  },
  {
    id: 'bull-rider',
    name: 'Bull Rider',
    icon: '🐂',
    description: 'Caught 25 bullish signals accurately',
    rarity: 'rare',
  },
  {
    id: 'first-mover',
    name: 'First Mover',
    icon: '🥇',
    description: 'First to act on a critical signal',
    rarity: 'legendary',
  },
];

export function getAccuracyTier(accuracy: number): {
  tier: string;
  color: string;
  description: string;
} {
  if (accuracy >= 90) return { tier: 'Elite', color: '#FFD700', description: 'Top 1% of alpha hunters' };
  if (accuracy >= 80) return { tier: 'Expert', color: '#C0C0C0', description: 'Top 5% of alpha hunters' };
  if (accuracy >= 70) return { tier: 'Advanced', color: '#CD7F32', description: 'Top 15% of alpha hunters' };
  if (accuracy >= 60) return { tier: 'Intermediate', color: '#4CAF50', description: 'Above average performance' };
  return { tier: 'Beginner', color: '#9E9E9E', description: 'Keep learning!' };
}
