/**
 * @fileoverview Social Channel Monitoring API
 * Discord and Telegram public channel aggregation
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// Use Node.js runtime since database.ts requires fs/path modules
export const runtime = 'nodejs';

interface SocialMessage {
  id: string;
  platform: 'discord' | 'telegram' | 'twitter';
  channel: string;
  author: string;
  content: string;
  timestamp: string;
  engagement: {
    reactions: number;
    replies: number;
    forwards: number;
  };
  sentiment: 'bullish' | 'bearish' | 'neutral';
  mentions: string[];
  hashtags: string[];
  isInfluencer: boolean;
  influencerScore?: number;
}

interface ChannelConfig {
  platform: 'discord' | 'telegram';
  channelId: string;
  name: string;
  webhookUrl?: string;
  enabled: boolean;
}

interface MonitoringResult {
  platform: string;
  channels: number;
  messages: SocialMessage[];
  trending: { topic: string; count: number; sentiment: number }[];
  topInfluencers: { name: string; platform: string; messageCount: number; avgEngagement: number }[];
  lastUpdated: string;
}

// Storage configuration
// - Channel configs are persisted to database for durability
// - Message cache is in-memory for real-time performance (ephemeral by design)
const CHANNEL_CONFIG_KEY = 'social:monitor:channels';

// In-memory caches (backed by database where appropriate)
let channelConfigCache: ChannelConfig[] | null = null;
const messageCache: SocialMessage[] = [];
const MAX_MESSAGE_CACHE = 1000; // Keep last 1000 messages in memory

/**
 * Load channel configs from database
 */
async function getChannelConfigs(): Promise<ChannelConfig[]> {
  if (channelConfigCache !== null) {
    return channelConfigCache;
  }
  
  try {
    const configs = await db.get<ChannelConfig[]>(CHANNEL_CONFIG_KEY);
    channelConfigCache = configs || [];
    return channelConfigCache;
  } catch {
    channelConfigCache = [];
    return channelConfigCache;
  }
}

/**
 * Save channel configs to database
 */
async function saveChannelConfigs(configs: ChannelConfig[]): Promise<void> {
  channelConfigCache = configs;
  try {
    await db.set(CHANNEL_CONFIG_KEY, configs);
  } catch (error) {
    console.warn('Failed to persist channel configs:', error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const channel = searchParams.get('channel');
  const coin = searchParams.get('coin');
  const since = searchParams.get('since');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let messages = [...messageCache];

    // Filter by platform
    if (platform) {
      messages = messages.filter((m) => m.platform === platform);
    }

    // Filter by channel
    if (channel) {
      messages = messages.filter((m) =>
        m.channel.toLowerCase().includes(channel.toLowerCase())
      );
    }

    // Filter by coin mention
    if (coin) {
      const coinLower = coin.toLowerCase();
      messages = messages.filter(
        (m) =>
          m.content.toLowerCase().includes(coinLower) ||
          m.mentions.some((mention) => mention.toLowerCase().includes(coinLower))
      );
    }

    // Filter by time
    if (since) {
      const sinceDate = new Date(since);
      messages = messages.filter((m) => new Date(m.timestamp) >= sinceDate);
    }

    // Sort by timestamp (newest first)
    messages.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Calculate trending topics
    const topicCounts = new Map<string, { count: number; sentimentSum: number }>();
    for (const msg of messages) {
      for (const mention of msg.mentions) {
        const existing = topicCounts.get(mention) || { count: 0, sentimentSum: 0 };
        existing.count++;
        existing.sentimentSum += msg.sentiment === 'bullish' ? 1 : msg.sentiment === 'bearish' ? -1 : 0;
        topicCounts.set(mention, existing);
      }
    }

    const trending = Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sentiment: data.count > 0 ? data.sentimentSum / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top influencers
    const influencerStats = new Map<
      string,
      { platform: string; messageCount: number; totalEngagement: number }
    >();
    for (const msg of messages.filter((m) => m.isInfluencer)) {
      const key = `${msg.author}-${msg.platform}`;
      const existing = influencerStats.get(key) || {
        platform: msg.platform,
        messageCount: 0,
        totalEngagement: 0,
      };
      existing.messageCount++;
      existing.totalEngagement +=
        msg.engagement.reactions + msg.engagement.replies * 2 + msg.engagement.forwards * 3;
      influencerStats.set(key, existing);
    }

    const topInfluencers = Array.from(influencerStats.entries())
      .map(([key, data]) => ({
        name: key.split('-')[0],
        platform: data.platform,
        messageCount: data.messageCount,
        avgEngagement:
          data.messageCount > 0 ? data.totalEngagement / data.messageCount : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 10);

    const monitoredChannels = await getChannelConfigs();
    
    const result: MonitoringResult = {
      platform: platform || 'all',
      channels: monitoredChannels.filter((c) => c.enabled).length,
      messages: messages.slice(0, limit),
      trending,
      topInfluencers,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch social data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Add or update monitored channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channel, message } = body;

    if (action === 'add_channel') {
      // Add new channel to monitor
      const config: ChannelConfig = {
        platform: channel.platform,
        channelId: channel.channelId,
        name: channel.name,
        webhookUrl: channel.webhookUrl,
        enabled: true,
      };

      const monitoredChannels = await getChannelConfigs();
      const existingIndex = monitoredChannels.findIndex(
        (c) => c.channelId === config.channelId && c.platform === config.platform
      );

      if (existingIndex >= 0) {
        monitoredChannels[existingIndex] = config;
      } else {
        monitoredChannels.push(config);
      }
      
      await saveChannelConfigs(monitoredChannels);

      return NextResponse.json({
        success: true,
        message: `Channel ${config.name} added to monitoring`,
        totalChannels: monitoredChannels.length,
      });
    }

    if (action === 'remove_channel') {
      const monitoredChannels = await getChannelConfigs();
      const index = monitoredChannels.findIndex(
        (c) => c.channelId === channel.channelId
      );

      if (index >= 0) {
        monitoredChannels.splice(index, 1);
        await saveChannelConfigs(monitoredChannels);
        return NextResponse.json({
          success: true,
          message: 'Channel removed from monitoring',
        });
      }

      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    if (action === 'ingest') {
      // Ingest a new message (from webhook or polling)
      const newMessage = processIncomingMessage(message);
      messageCache.push(newMessage);

      // Keep cache size manageable
      if (messageCache.length > 10000) {
        messageCache.splice(0, messageCache.length - 10000);
      }

      return NextResponse.json({
        success: true,
        messageId: newMessage.id,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: add_channel, remove_channel, or ingest' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function processIncomingMessage(raw: Record<string, unknown>): SocialMessage {
  const content = (raw.content as string) || '';

  // Extract crypto mentions
  const cryptoPattern =
    /\b(BTC|ETH|SOL|XRP|ADA|DOGE|DOT|AVAX|LINK|MATIC|Bitcoin|Ethereum|Solana)\b/gi;
  const mentions = [...new Set((content.match(cryptoPattern) || []).map((m) => m.toUpperCase()))];

  // Extract hashtags
  const hashtagPattern = /#(\w+)/g;
  const hashtags = [...new Set((content.match(hashtagPattern) || []).map((h) => h.toLowerCase()))];

  // Detect sentiment
  const sentiment = detectSentiment(content);

  // Check if influencer (placeholder logic)
  const isInfluencer = (raw.followerCount as number) > 10000 || (raw.isVerified as boolean);

  return {
    id: (raw.id as string) || crypto.randomUUID(),
    platform: (raw.platform as 'discord' | 'telegram' | 'twitter') || 'discord',
    channel: (raw.channel as string) || 'unknown',
    author: (raw.author as string) || 'anonymous',
    content,
    timestamp: (raw.timestamp as string) || new Date().toISOString(),
    engagement: {
      reactions: (raw.reactions as number) || 0,
      replies: (raw.replies as number) || 0,
      forwards: (raw.forwards as number) || 0,
    },
    sentiment,
    mentions,
    hashtags,
    isInfluencer,
    influencerScore: isInfluencer ? (raw.followerCount as number) / 1000 : undefined,
  };
}

function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase();

  const bullishWords = ['moon', 'pump', 'bull', 'buy', 'long', 'ath', 'breakout', 'bullish', '🚀', '📈', '💎', '🙌'];
  const bearishWords = ['dump', 'crash', 'bear', 'sell', 'short', 'rekt', 'bearish', 'scam', '📉', '💀', '🔻'];

  let bullishScore = 0;
  let bearishScore = 0;

  for (const word of bullishWords) {
    if (lowerText.includes(word)) bullishScore++;
  }

  for (const word of bearishWords) {
    if (lowerText.includes(word)) bearishScore++;
  }

  if (bullishScore > bearishScore) return 'bullish';
  if (bearishScore > bullishScore) return 'bearish';
  return 'neutral';
}

// Webhook endpoint for receiving real-time updates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, channelId, messages } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array required' },
        { status: 400 }
      );
    }

    let processed = 0;
    for (const msg of messages) {
      const newMessage = processIncomingMessage({
        ...msg,
        platform,
        channel: channelId,
      });
      messageCache.push(newMessage);
      processed++;
    }

    // Trim cache
    if (messageCache.length > 10000) {
      messageCache.splice(0, messageCache.length - 10000);
    }

    return NextResponse.json({
      success: true,
      processed,
      cacheSize: messageCache.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
