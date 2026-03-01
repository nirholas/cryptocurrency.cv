/**
 * Discord/Telegram Channel Monitoring Service
 * 
 * Monitors crypto-related Discord servers and Telegram channels
 * for mentions, sentiment, and emerging narratives.
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logger';

// Types
export interface ChannelMessage {
  id: string;
  platform: 'discord' | 'telegram';
  channelId: string;
  channelName: string;
  serverId?: string;
  serverName?: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  content: string;
  timestamp: Date;
  replyCount: number;
  reactionCount: number;
  mentionedCoins: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  isInfluencer: boolean;
  attachments: MessageAttachment[];
  embeds: MessageEmbed[];
}

export interface MessageAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
}

export interface MessageEmbed {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
}

export interface ChannelConfig {
  id: string;
  platform: 'discord' | 'telegram';
  name: string;
  serverId?: string;
  serverName?: string;
  category: 'alpha' | 'news' | 'analysis' | 'trading' | 'general';
  importance: 'high' | 'medium' | 'low';
  influencerIds: string[];
}

export interface ChannelStats {
  channelId: string;
  channelName: string;
  platform: 'discord' | 'telegram';
  messagesLast24h: number;
  uniqueAuthorsLast24h: number;
  topMentionedCoins: Array<{ coin: string; count: number }>;
  sentimentBreakdown: { bullish: number; bearish: number; neutral: number };
  peakActivityHour: number;
  averageResponseTime: number;
}

export interface SocialAlert {
  id: string;
  type: 'whale_mention' | 'influencer_post' | 'sentiment_shift' | 'volume_spike' | 'alpha_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  platform: 'discord' | 'telegram';
  channelName: string;
  message: string;
  coins: string[];
  timestamp: Date;
  originalMessage?: ChannelMessage;
}

// Configuration
const TRACKED_COINS = [
  'BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
  'ATOM', 'UNI', 'LTC', 'NEAR', 'APT', 'ARB', 'OP', 'INJ', 'SUI', 'SEI',
  'PEPE', 'SHIB', 'BONK', 'WIF', 'JUP', 'PYTH', 'JTO', 'TIA', 'MANTA', 'DYM',
];

const SENTIMENT_KEYWORDS = {
  bullish: ['moon', 'pump', 'bullish', 'buy', 'long', 'ape', 'send it', 'LFG', 'WAGMI', 'breakout', 'accumulate', 'undervalued'],
  bearish: ['dump', 'bearish', 'sell', 'short', 'rug', 'scam', 'crash', 'NGMI', 'overvalued', 'top signal', 'exit'],
};

// Channel registry
const channelRegistry = new Map<string, ChannelConfig>();

// Message buffer for analysis
const messageBuffer: ChannelMessage[] = [];
const MESSAGE_BUFFER_LIMIT = 10000;
const MESSAGE_BUFFER_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

// Event emitter for real-time alerts
const alertEmitter = new EventEmitter();

/**
 * Register a channel for monitoring
 */
export function registerChannel(config: ChannelConfig): void {
  channelRegistry.set(config.id, config);
  logger.info(`Registered ${config.platform} channel: ${config.name}`);
}

/**
 * Unregister a channel
 */
export function unregisterChannel(channelId: string): boolean {
  return channelRegistry.delete(channelId);
}

/**
 * Get all registered channels
 */
export function getRegisteredChannels(): ChannelConfig[] {
  return Array.from(channelRegistry.values());
}

/**
 * Process an incoming message
 */
export function processMessage(message: Omit<ChannelMessage, 'mentionedCoins' | 'sentiment' | 'isInfluencer'>): ChannelMessage {
  const channel = channelRegistry.get(message.channelId);
  
  // Extract mentioned coins
  const mentionedCoins = extractMentionedCoins(message.content);
  
  // Analyze sentiment
  const sentiment = analyzeSentiment(message.content);
  
  // Check if influencer
  const isInfluencer = channel?.influencerIds.includes(message.authorId) || false;

  const enrichedMessage: ChannelMessage = {
    ...message,
    mentionedCoins,
    sentiment,
    isInfluencer,
  };

  // Add to buffer
  addToBuffer(enrichedMessage);

  // Check for alerts
  checkForAlerts(enrichedMessage, channel);

  return enrichedMessage;
}

/**
 * Extract mentioned cryptocurrency symbols from text
 */
function extractMentionedCoins(text: string): string[] {
  const upperText = text.toUpperCase();
  const mentioned: string[] = [];

  for (const coin of TRACKED_COINS) {
    // Look for $SYMBOL, SYMBOL, or full names
    const patterns = [
      new RegExp(`\\$${coin}\\b`, 'i'),
      new RegExp(`\\b${coin}\\b`),
    ];

    if (patterns.some(p => p.test(upperText))) {
      mentioned.push(coin);
    }
  }

  return [...new Set(mentioned)];
}

/**
 * Analyze sentiment of a message
 */
function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase();
  
  let bullishScore = 0;
  let bearishScore = 0;

  for (const keyword of SENTIMENT_KEYWORDS.bullish) {
    if (lowerText.includes(keyword.toLowerCase())) {
      bullishScore++;
    }
  }

  for (const keyword of SENTIMENT_KEYWORDS.bearish) {
    if (lowerText.includes(keyword.toLowerCase())) {
      bearishScore++;
    }
  }

  if (bullishScore > bearishScore && bullishScore >= 2) return 'bullish';
  if (bearishScore > bullishScore && bearishScore >= 2) return 'bearish';
  return 'neutral';
}

/**
 * Add message to the rolling buffer
 */
function addToBuffer(message: ChannelMessage): void {
  messageBuffer.push(message);
  
  // Trim old messages
  const cutoff = Date.now() - MESSAGE_BUFFER_WINDOW;
  while (messageBuffer.length > 0 && messageBuffer[0].timestamp.getTime() < cutoff) {
    messageBuffer.shift();
  }

  // Hard limit
  if (messageBuffer.length > MESSAGE_BUFFER_LIMIT) {
    messageBuffer.splice(0, messageBuffer.length - MESSAGE_BUFFER_LIMIT);
  }
}

/**
 * Check if message triggers any alerts
 */
function checkForAlerts(message: ChannelMessage, channel?: ChannelConfig): void {
  const alerts: SocialAlert[] = [];

  // Influencer post alert
  if (message.isInfluencer && message.mentionedCoins.length > 0) {
    alerts.push({
      id: `inf_${message.id}`,
      type: 'influencer_post',
      severity: channel?.importance === 'high' ? 'high' : 'medium',
      platform: message.platform,
      channelName: message.channelName,
      message: `Influencer @${message.authorName} mentioned ${message.mentionedCoins.join(', ')}`,
      coins: message.mentionedCoins,
      timestamp: new Date(),
      originalMessage: message,
    });
  }

  // Alpha channel leak detection
  if (channel?.category === 'alpha' && message.mentionedCoins.length > 0) {
    const isLowCap = message.mentionedCoins.some(c => !['BTC', 'ETH', 'SOL', 'XRP', 'ADA'].includes(c));
    if (isLowCap && message.sentiment === 'bullish') {
      alerts.push({
        id: `alpha_${message.id}`,
        type: 'alpha_leak',
        severity: 'high',
        platform: message.platform,
        channelName: message.channelName,
        message: `Potential alpha: ${message.mentionedCoins.join(', ')} in ${channel.name}`,
        coins: message.mentionedCoins,
        timestamp: new Date(),
        originalMessage: message,
      });
    }
  }

  // Emit alerts
  for (const alert of alerts) {
    alertEmitter.emit('alert', alert);
  }
}

/**
 * Get channel statistics
 */
export function getChannelStats(channelId: string): ChannelStats | null {
  const channel = channelRegistry.get(channelId);
  if (!channel) return null;

  const channelMessages = messageBuffer.filter(m => m.channelId === channelId);
  
  if (channelMessages.length === 0) {
    return {
      channelId,
      channelName: channel.name,
      platform: channel.platform,
      messagesLast24h: 0,
      uniqueAuthorsLast24h: 0,
      topMentionedCoins: [],
      sentimentBreakdown: { bullish: 0, bearish: 0, neutral: 0 },
      peakActivityHour: 0,
      averageResponseTime: 0,
    };
  }

  // Count messages per hour for peak activity
  const hourCounts: Record<number, number> = {};
  const uniqueAuthors = new Set<string>();
  const coinMentions: Record<string, number> = {};
  const sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };

  for (const msg of channelMessages) {
    const hour = msg.timestamp.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    uniqueAuthors.add(msg.authorId);
    
    for (const coin of msg.mentionedCoins) {
      coinMentions[coin] = (coinMentions[coin] || 0) + 1;
    }

    sentimentCounts[msg.sentiment]++;
  }

  const peakActivityHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

  const topMentionedCoins = Object.entries(coinMentions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([coin, count]) => ({ coin, count }));

  return {
    channelId,
    channelName: channel.name,
    platform: channel.platform,
    messagesLast24h: channelMessages.length,
    uniqueAuthorsLast24h: uniqueAuthors.size,
    topMentionedCoins,
    sentimentBreakdown: sentimentCounts,
    peakActivityHour: parseInt(peakActivityHour, 10),
    averageResponseTime: 0, // Would need thread analysis
  };
}

/**
 * Get aggregated stats for all channels
 */
export function getAllChannelStats(): ChannelStats[] {
  return Array.from(channelRegistry.keys())
    .map(id => getChannelStats(id))
    .filter((s): s is ChannelStats => s !== null);
}

/**
 * Get trending coins across all channels
 */
export function getTrendingCoins(limit = 20): Array<{ coin: string; mentions: number; sentiment: number; channels: string[] }> {
  const coinData: Record<string, { mentions: number; sentimentSum: number; channels: Set<string> }> = {};

  for (const msg of messageBuffer) {
    for (const coin of msg.mentionedCoins) {
      if (!coinData[coin]) {
        coinData[coin] = { mentions: 0, sentimentSum: 0, channels: new Set() };
      }
      coinData[coin].mentions++;
      coinData[coin].sentimentSum += msg.sentiment === 'bullish' ? 1 : msg.sentiment === 'bearish' ? -1 : 0;
      coinData[coin].channels.add(msg.channelName);
    }
  }

  return Object.entries(coinData)
    .map(([coin, data]) => ({
      coin,
      mentions: data.mentions,
      sentiment: data.mentions > 0 ? data.sentimentSum / data.mentions : 0,
      channels: Array.from(data.channels),
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, limit);
}

/**
 * Get recent messages for a coin
 */
export function getMessagesForCoin(coin: string, limit = 50): ChannelMessage[] {
  return messageBuffer
    .filter(m => m.mentionedCoins.includes(coin.toUpperCase()))
    .slice(-limit);
}

/**
 * Subscribe to alerts
 */
export function onAlert(callback: (alert: SocialAlert) => void): () => void {
  alertEmitter.on('alert', callback);
  return () => alertEmitter.off('alert', callback);
}

/**
 * Get recent alerts
 */
const recentAlerts: SocialAlert[] = [];
const MAX_RECENT_ALERTS = 100;

alertEmitter.on('alert', (alert: SocialAlert) => {
  recentAlerts.push(alert);
  if (recentAlerts.length > MAX_RECENT_ALERTS) {
    recentAlerts.shift();
  }
});

export function getRecentAlerts(limit = 50): SocialAlert[] {
  return recentAlerts.slice(-limit);
}

// Pre-register some popular channels (for demo purposes)
const defaultChannels: ChannelConfig[] = [
  {
    id: 'discord_1',
    platform: 'discord',
    name: 'Crypto Trading Hub',
    serverName: 'DeFi Alpha',
    category: 'alpha',
    importance: 'high',
    influencerIds: ['user_123', 'user_456'],
  },
  {
    id: 'telegram_1',
    platform: 'telegram',
    name: 'Whale Alerts',
    category: 'news',
    importance: 'high',
    influencerIds: [],
  },
  {
    id: 'discord_2',
    platform: 'discord',
    name: 'General Chat',
    serverName: 'Crypto Community',
    category: 'general',
    importance: 'low',
    influencerIds: [],
  },
  {
    id: 'telegram_2',
    platform: 'telegram',
    name: 'Technical Analysis',
    category: 'analysis',
    importance: 'medium',
    influencerIds: ['ta_master'],
  },
];

// Register default channels
for (const channel of defaultChannels) {
  registerChannel(channel);
}
