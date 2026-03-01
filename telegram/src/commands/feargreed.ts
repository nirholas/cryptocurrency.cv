/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import type { Context } from 'grammy';
import { apiFetch } from '../api.js';
import { escHtml, fearGreedEmoji } from '../format.js';

// ---------------------------------------------------------------------------
// /fear — Fear & Greed Index
// ---------------------------------------------------------------------------

interface FearGreedResponse {
  current: {
    value: number;
    valueClassification: string;
    timestamp: number;
    timeUntilUpdate: string;
  };
  trend: {
    direction: string;
    change7d: number;
    change30d: number;
    averageValue7d: number;
    averageValue30d: number;
  };
  breakdown: Record<
    string,
    { value: number; weight: number }
  >;
  lastUpdated: string;
}

function progressBar(value: number, total = 100, length = 15): string {
  const filled = Math.round((value / total) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

export async function fearGreedCommand(ctx: Context): Promise<void> {
  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<FearGreedResponse>('/api/fear-greed', {
      days: 7,
    });

    const c = data.current;
    const t = data.trend;
    const emoji = fearGreedEmoji(c.value);

    const lines = [
      `${emoji} <b>Fear & Greed Index</b>`,
      '',
      `<b>${c.value}/100</b> — ${escHtml(c.valueClassification)}`,
      `${progressBar(c.value)}`,
      '',
      `<b>Trend:</b> ${escHtml(t.direction)}`,
      `  7d change: ${t.change7d >= 0 ? '+' : ''}${t.change7d}`,
      `  30d change: ${t.change30d >= 0 ? '+' : ''}${t.change30d}`,
      `  7d avg: ${t.averageValue7d.toFixed(0)} · 30d avg: ${t.averageValue30d.toFixed(0)}`,
    ];

    if (data.breakdown) {
      lines.push('', '<b>Breakdown:</b>');
      const labels: Record<string, string> = {
        volatility: '📊 Volatility',
        marketMomentum: '📈 Momentum',
        socialMedia: '💬 Social',
        surveys: '📝 Surveys',
        dominance: '👑 BTC Dom',
        trends: '🔍 Trends',
      };
      for (const [key, info] of Object.entries(data.breakdown)) {
        const label = labels[key] || key;
        lines.push(`  ${label}: ${info.value}/100 (${(info.weight * 100).toFixed(0)}%)`);
      }
    }

    lines.push('', '<i>Data via Alternative.me · cryptocurrency.cv</i>');

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('fear-greed command error:', err);
    await ctx.reply('⚠️ Failed to fetch Fear & Greed Index.');
  }
}
