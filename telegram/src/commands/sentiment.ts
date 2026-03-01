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
import { escHtml, sentimentEmoji } from '../format.js';

// ---------------------------------------------------------------------------
// /sentiment [asset] — AI sentiment analysis
// ---------------------------------------------------------------------------

interface SentimentResponse {
  market: {
    overall: string;
    score: number;
    confidence: number;
    summary: string;
    keyDrivers: string[];
  };
  distribution: Record<string, number>;
  highImpactNews: Array<{
    title: string;
    link: string;
    sentiment: string;
    impactLevel: string;
    reasoning: string;
  }>;
  meta: {
    articlesAnalyzed: number;
    asset?: string;
    analyzedAt: string;
  };
}

export async function sentimentCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? '';
  const parts = text.split(/\s+/).slice(1);
  const asset = parts[0]?.toUpperCase() || undefined;

  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<SentimentResponse>('/api/sentiment', {
      limit: 10,
      asset,
    });

    const m = data.market;
    const assetLabel = asset ? ` · ${escHtml(asset)}` : '';

    const lines = [
      `${sentimentEmoji(m.overall)} <b>Market Sentiment</b>${assetLabel}`,
      '',
      `<b>Overall:</b> ${escHtml(m.overall.replace(/_/g, ' '))} (score: ${m.score}/100)`,
      `<b>Confidence:</b> ${m.confidence}%`,
      '',
      `💬 ${escHtml(m.summary)}`,
    ];

    if (m.keyDrivers?.length) {
      lines.push('', '<b>Key Drivers:</b>');
      for (const d of m.keyDrivers.slice(0, 4)) {
        lines.push(`  → ${escHtml(d)}`);
      }
    }

    if (data.highImpactNews?.length) {
      lines.push('', '<b>High-Impact News:</b>');
      for (const n of data.highImpactNews.slice(0, 3)) {
        lines.push(
          `${sentimentEmoji(n.sentiment)} <a href="${n.link}">${escHtml(n.title.slice(0, 100))}</a>`,
        );
      }
    }

    lines.push('', `<i>${data.meta.articlesAnalyzed} articles analyzed · cryptocurrency.cv</i>`);

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('sentiment command error:', err);
    await ctx.reply('⚠️ Failed to fetch sentiment. AI analysis may be temporarily unavailable.');
  }
}
