import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute cache

/**
 * Discord Channel Monitor API
 * 
 * Monitor Discord channels for crypto intelligence including:
 * - Alpha mentions and early signals
 * - Whale wallet discussions
 * - Project announcements
 * - Community sentiment
 * - Trending topics
 * 
 * Note: Requires Discord bot token with appropriate permissions.
 * Set DISCORD_BOT_TOKEN environment variable.
 */

interface DiscordMessage {
  id: string;
  channelId: string;
  channelName: string;
  guildId: string;
  guildName: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  attachments: number;
  reactions: { emoji: string; count: number }[];
  mentions: {
    tickers: string[];
    addresses: string[];
    urls: string[];
  };
}

interface ChannelStats {
  channelId: string;
  channelName: string;
  messageCount: number;
  uniqueAuthors: number;
  topTickers: { ticker: string; count: number }[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  activity: 'high' | 'medium' | 'low';
}

interface DiscordIntelligence {
  messages: DiscordMessage[];
  channelStats: ChannelStats[];
  trending: {
    tickers: { ticker: string; mentions: number; sentiment: string }[];
    topics: { topic: string; count: number }[];
  };
  alerts: {
    type: 'whale_mention' | 'alpha' | 'fud' | 'breaking';
    message: DiscordMessage;
    confidence: number;
  }[];
}

// Discord API configuration
const DISCORD_API = 'https://discord.com/api/v10';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channel_id');
  const guildId = searchParams.get('guild_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const keyword = searchParams.get('keyword');
  const ticker = searchParams.get('ticker');
  
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!botToken) {
    return NextResponse.json(
      { 
        error: 'Discord integration not configured',
        message: 'DISCORD_BOT_TOKEN environment variable is required',
        setup: {
          instructions: 'To enable Discord monitoring, set DISCORD_BOT_TOKEN environment variable.',
          steps: [
            '1. Create a Discord application at https://discord.com/developers/applications',
            '2. Create a bot and copy the token',
            '3. Invite the bot to your server with "Read Message History" permission',
            '4. Set DISCORD_BOT_TOKEN=your_token in environment variables',
          ],
        },
      },
      { status: 503 }
    );
  }
  
  if (!channelId && !guildId) {
    return NextResponse.json(
      { error: 'Either channel_id or guild_id is required' },
      { status: 400 }
    );
  }

  try {
    let messages: DiscordMessage[] = [];
    
    if (channelId) {
      messages = await fetchChannelMessages(channelId, limit, botToken);
    } else if (guildId) {
      // Fetch from multiple channels in guild
      const channels = await fetchGuildChannels(guildId, botToken);
      const textChannels = channels.filter((c: DiscordChannel) => c.type === 0);
      
      for (const channel of textChannels.slice(0, 10)) {
        const channelMessages = await fetchChannelMessages(channel.id, Math.floor(limit / 10), botToken);
        messages.push(...channelMessages);
      }
    }
    
    // Apply filters
    if (keyword) {
      const keywordLower = keyword.toLowerCase();
      messages = messages.filter(m => 
        m.content.toLowerCase().includes(keywordLower)
      );
    }
    
    if (ticker) {
      const tickerUpper = ticker.toUpperCase();
      messages = messages.filter(m => 
        m.mentions.tickers.includes(tickerUpper) ||
        m.content.toUpperCase().includes(`$${tickerUpper}`) ||
        m.content.toUpperCase().includes(tickerUpper)
      );
    }
    
    // Process intelligence
    const intelligence = processIntelligence(messages);
    
    return NextResponse.json({
      ...intelligence,
      filters: { channel_id: channelId, guild_id: guildId, keyword, ticker, limit },
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Discord monitor error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Discord data' },
      { status: 500 }
    );
  }
}

interface DiscordChannel {
  id: string;
  type: number;
  name: string;
}

async function fetchGuildChannels(guildId: string, token: string): Promise<DiscordChannel[]> {
  const response = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers: {
      'Authorization': `Bot ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Discord API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchChannelMessages(
  channelId: string, 
  limit: number, 
  token: string
): Promise<DiscordMessage[]> {
  const response = await fetch(
    `${DISCORD_API}/channels/${channelId}/messages?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bot ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Discord API error: ${response.status}`);
  }
  
  interface DiscordApiMessage {
    id: string;
    channel_id: string;
    guild_id?: string;
    author: { id: string; username: string };
    content: string;
    timestamp: string;
    attachments: unknown[];
    reactions?: { emoji: { name: string }; count: number }[];
  }
  
  const rawMessages: DiscordApiMessage[] = await response.json();
  
  return rawMessages.map(msg => ({
    id: msg.id,
    channelId: msg.channel_id,
    channelName: '', // Would need additional call
    guildId: msg.guild_id || '',
    guildName: '',
    authorId: msg.author.id,
    authorName: msg.author.username,
    content: msg.content,
    timestamp: msg.timestamp,
    attachments: msg.attachments.length,
    reactions: (msg.reactions || []).map(r => ({
      emoji: r.emoji.name,
      count: r.count,
    })),
    mentions: extractMentions(msg.content),
  }));
}

function extractMentions(content: string): DiscordMessage['mentions'] {
  // Extract tickers ($BTC, $ETH, etc.)
  const tickerPattern = /\$([A-Z]{2,10})/g;
  const tickers: string[] = [];
  let match;
  while ((match = tickerPattern.exec(content)) !== null) {
    tickers.push(match[1]);
  }
  
  // Extract addresses (0x...)
  const addressPattern = /0x[a-fA-F0-9]{40}/g;
  const addresses = content.match(addressPattern) || [];
  
  // Extract URLs
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlPattern) || [];
  
  return { tickers, addresses, urls };
}

function processIntelligence(messages: DiscordMessage[]): DiscordIntelligence {
  // Channel stats
  const channelMap = new Map<string, DiscordMessage[]>();
  for (const msg of messages) {
    const existing = channelMap.get(msg.channelId) || [];
    existing.push(msg);
    channelMap.set(msg.channelId, existing);
  }
  
  const channelStats: ChannelStats[] = Array.from(channelMap.entries()).map(([channelId, msgs]) => {
    const uniqueAuthors = new Set(msgs.map(m => m.authorId)).size;
    const allTickers = msgs.flatMap(m => m.mentions.tickers);
    const tickerCounts = new Map<string, number>();
    for (const t of allTickers) {
      tickerCounts.set(t, (tickerCounts.get(t) || 0) + 1);
    }
    
    const topTickers = Array.from(tickerCounts.entries())
      .map(([ticker, count]) => ({ ticker, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      channelId,
      channelName: msgs[0]?.channelName || channelId,
      messageCount: msgs.length,
      uniqueAuthors,
      topTickers,
      sentiment: analyzeSentiment(msgs),
      activity: msgs.length > 50 ? 'high' : msgs.length > 20 ? 'medium' : 'low',
    };
  });
  
  // Trending tickers
  const allTickers = messages.flatMap(m => m.mentions.tickers);
  const tickerCounts = new Map<string, number>();
  for (const t of allTickers) {
    tickerCounts.set(t, (tickerCounts.get(t) || 0) + 1);
  }
  
  const trendingTickers = Array.from(tickerCounts.entries())
    .map(([ticker, mentions]) => ({ 
      ticker, 
      mentions,
      sentiment: 'neutral', // Would need NLP
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 20);
  
  // Detect alerts
  const alerts = detectAlerts(messages);
  
  return {
    messages: messages.slice(0, 100), // Limit returned messages
    channelStats,
    trending: {
      tickers: trendingTickers,
      topics: [], // Would need topic modeling
    },
    alerts,
  };
}

function analyzeSentiment(messages: DiscordMessage[]): 'bullish' | 'bearish' | 'neutral' {
  const bullishWords = ['moon', 'pump', 'bullish', 'buy', 'long', 'ath', 'breakout', '🚀', '📈'];
  const bearishWords = ['dump', 'crash', 'bearish', 'sell', 'short', 'rekt', 'rugpull', '📉'];
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  for (const msg of messages) {
    const content = msg.content.toLowerCase();
    for (const word of bullishWords) {
      if (content.includes(word)) bullishCount++;
    }
    for (const word of bearishWords) {
      if (content.includes(word)) bearishCount++;
    }
  }
  
  if (bullishCount > bearishCount * 1.5) return 'bullish';
  if (bearishCount > bullishCount * 1.5) return 'bearish';
  return 'neutral';
}

function detectAlerts(messages: DiscordMessage[]): DiscordIntelligence['alerts'] {
  const alerts: DiscordIntelligence['alerts'] = [];
  
  const whalePatterns = [
    /whale/i, /large (transfer|deposit|withdrawal)/i,
    /\d+[kmb]\s*(usd|usdc|usdt|btc|eth)/i,
  ];
  
  const alphaPatterns = [
    /alpha/i, /insider/i, /early/i, /presale/i,
    /airdrop/i, /whitelist/i,
  ];
  
  const fudPatterns = [
    /rug\s*pull/i, /scam/i, /hack/i, /exploit/i,
    /insecure/i, /warning/i,
  ];
  
  for (const msg of messages) {
    const content = msg.content;
    
    for (const pattern of whalePatterns) {
      if (pattern.test(content)) {
        alerts.push({
          type: 'whale_mention',
          message: msg,
          confidence: 70,
        });
        break;
      }
    }
    
    for (const pattern of alphaPatterns) {
      if (pattern.test(content)) {
        alerts.push({
          type: 'alpha',
          message: msg,
          confidence: 60,
        });
        break;
      }
    }
    
    for (const pattern of fudPatterns) {
      if (pattern.test(content)) {
        alerts.push({
          type: 'fud',
          message: msg,
          confidence: 65,
        });
        break;
      }
    }
  }
  
  return alerts.slice(0, 50); // Limit alerts
}
