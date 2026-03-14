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
 * Social Intelligence API
 *
 * Enterprise-grade social data aggregation from Discord, Telegram,
 * LunarCrush, and Santiment.
 *
 * GET /api/social - Get aggregated social intelligence
 * GET /api/social?view=trends - Get social trends only
 * GET /api/social?view=metrics - Get detailed metrics by ticker
 * GET /api/social?view=messages - Get messages from configured channels
 *
 * Query Parameters:
 * - view: 'full' | 'trends' | 'metrics' | 'messages' | 'trending' (default: 'full')
 * - symbols: Comma-separated ticker symbols (default: top 10)
 * - limit: Number of results (default: 20, max: 100)
 * - platform: 'all' | 'discord' | 'telegram' | 'lunarcrush' | 'santiment'
 * - format: 'json' | 'minimal' (default: 'json')
 *
 * @module api/social
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getSocialIntelligence,
  getSocialTrends,
  getLunarCrushMetrics,
  getLunarCrushTrending,
  getSantimentMetrics,
  fetchDiscordMessages,
  fetchTelegramMessages,
  extractTickers,
  analyzeSentiment,
  type SocialMessage,
} from '@/lib/social-intelligence';

export const revalidate = 60; // ISR: social data refreshes every 1 min

// Configured channels from environment
const CONFIGURED_CHANNELS = {
  discord: process.env.DISCORD_CHANNEL_IDS?.split(',').filter(Boolean) || [],
  telegram: process.env.TELEGRAM_CHAT_IDS?.split(',').filter(Boolean) || [],
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const view = searchParams.get('view') || 'full';
    const symbols = searchParams.get('symbols')?.split(',').filter(Boolean);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const platform = searchParams.get('platform') || 'all';
    const format = searchParams.get('format') || 'json';

    let responseData: Record<string, unknown> = {};

    switch (view) {
      case 'trends': {
        const trends = await getSocialTrends();
        responseData = {
          trends: trends.slice(0, limit),
          total: trends.length,
        };
        break;
      }

      case 'metrics': {
        const targetSymbols = symbols || [
          'BTC',
          'ETH',
          'SOL',
          'XRP',
          'DOGE',
          'ADA',
          'AVAX',
          'DOT',
          'LINK',
          'MATIC',
        ];

        const [lunarcrush, santiment] = await Promise.all([
          platform === 'all' || platform === 'lunarcrush'
            ? getLunarCrushMetrics(targetSymbols)
            : [],
          platform === 'all' || platform === 'santiment'
            ? getSantimentMetrics(targetSymbols.map((s) => s.toLowerCase()))
            : [],
        ]);

        responseData = {
          lunarcrush,
          santiment,
          symbols: targetSymbols,
        };
        break;
      }

      case 'messages': {
        const messages: SocialMessage[] = [];

        // Fetch from Discord channels
        if (
          (platform === 'all' || platform === 'discord') &&
          CONFIGURED_CHANNELS.discord.length > 0
        ) {
          const discordPromises = CONFIGURED_CHANNELS.discord.map((channelId) =>
            fetchDiscordMessages(channelId, Math.ceil(limit / CONFIGURED_CHANNELS.discord.length)),
          );
          const discordResults = await Promise.all(discordPromises);
          messages.push(...discordResults.flat());
        }

        // Fetch from Telegram chats
        if (
          (platform === 'all' || platform === 'telegram') &&
          CONFIGURED_CHANNELS.telegram.length > 0
        ) {
          const telegramPromises = CONFIGURED_CHANNELS.telegram.map((chatId) =>
            fetchTelegramMessages(chatId, Math.ceil(limit / CONFIGURED_CHANNELS.telegram.length)),
          );
          const telegramResults = await Promise.all(telegramPromises);
          messages.push(...telegramResults.flat());
        }

        // Sort by timestamp and limit
        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        responseData = {
          messages: messages.slice(0, limit),
          total: messages.length,
          channels: {
            discord: CONFIGURED_CHANNELS.discord.length,
            telegram: CONFIGURED_CHANNELS.telegram.length,
          },
        };
        break;
      }

      case 'trending': {
        const trending = await getLunarCrushTrending(limit);
        responseData = {
          trending,
          total: trending.length,
        };
        break;
      }

      case 'full':
      default: {
        const intelligence = await getSocialIntelligence();

        // Apply limits
        responseData = {
          trends: intelligence.trends.slice(0, limit),
          lunarcrush: intelligence.lunarcrush.slice(0, limit),
          santiment: intelligence.santiment.slice(0, limit),
          messages: intelligence.messages,
          lastUpdated: intelligence.lastUpdated,
          sources: intelligence.sources,
        };
        break;
      }
    }

    // Add metadata
    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: responseData,
      meta: {
        view,
        platform,
        limit,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        sources: {
          discord: {
            enabled: !!process.env.DISCORD_BOT_TOKEN,
            channels: CONFIGURED_CHANNELS.discord.length,
          },
          telegram: {
            enabled: !!process.env.TELEGRAM_BOT_TOKEN,
            channels: CONFIGURED_CHANNELS.telegram.length,
          },
          lunarcrush: {
            enabled: true,
            hasApiKey: !!process.env.LUNARCRUSH_API_KEY,
          },
          santiment: {
            enabled: !!process.env.SANTIMENT_API_KEY,
          },
        },
      },
    };

    // Minimal format strips metadata
    if (format === 'minimal') {
      return NextResponse.json(responseData);
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error('[Social API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch social intelligence data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/social
 *
 * Analyze custom text for tickers and sentiment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { text, options = {} } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "text" field' },
        { status: 400 },
      );
    }

    const result: Record<string, unknown> = {};

    if (options.extractTickers !== false) {
      result.tickers = extractTickers(text);
    }

    if (options.analyzeSentiment !== false) {
      result.sentiment = analyzeSentiment(text);
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        textLength: text.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Social API] POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze text',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * HEAD /api/social - Health check and capability discovery
 */
export async function HEAD() {
  return new NextResponse(null, {
    headers: {
      'X-Social-Discord': process.env.DISCORD_BOT_TOKEN ? 'enabled' : 'disabled',
      'X-Social-Telegram': process.env.TELEGRAM_BOT_TOKEN ? 'enabled' : 'disabled',
      'X-Social-LunarCrush': 'enabled',
      'X-Social-Santiment': process.env.SANTIMENT_API_KEY ? 'enabled' : 'disabled',
      'X-Discord-Channels': String(CONFIGURED_CHANNELS.discord.length),
      'X-Telegram-Channels': String(CONFIGURED_CHANNELS.telegram.length),
      'X-Platforms': 'discord,telegram,lunarcrush,santiment',
    },
  });
}
