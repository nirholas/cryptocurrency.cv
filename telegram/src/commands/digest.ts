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
// /digest — Daily news digest (AI-powered)
// ---------------------------------------------------------------------------

interface DigestSection {
  tag: string;
  headline: string;
  summary: string;
  article_count: number;
  top_articles?: Array<{ title: string; url: string }>;
}

interface DigestResponse {
  date: string;
  sections: DigestSection[];
  generated_at: string;
}

const SECTION_EMOJI: Record<string, string> = {
  bitcoin: '₿',
  ethereum: '⟠',
  defi: '🏦',
  nft: '🖼️',
  regulation: '⚖️',
  market: '📈',
  solana: '◎',
  gaming: '🎮',
  layer2: '🧱',
  stablecoin: '💵',
  exchange: '🔄',
  mining: '⛏️',
};

export async function digestCommand(ctx: Context): Promise<void> {
  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<DigestResponse>('/api/digest', {
      format: 'ai-digest',
      period: '24h',
    });

    if (!data.sections?.length) {
      await ctx.reply('No digest available right now. Check back later!');
      return;
    }

    const lines = [
      `📋 <b>Daily Crypto Digest</b> · ${escHtml(data.date)}`,
      '',
    ];

    for (const s of data.sections.slice(0, 6)) {
      const emoji = SECTION_EMOJI[s.tag] || '📌';
      lines.push(`${emoji} <b>${escHtml(s.headline)}</b>`);
      lines.push(`${escHtml(s.summary)}`);
      if (s.top_articles?.length) {
        for (const a of s.top_articles.slice(0, 2)) {
          lines.push(`  → <a href="${a.url}">${escHtml(a.title.slice(0, 80))}</a>`);
        }
      }
      lines.push('');
    }

    lines.push('<i>AI-generated digest · cryptocurrency.cv</i>');

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('digest command error:', err);
    await ctx.reply('⚠️ Failed to generate digest. AI may be temporarily unavailable.');
  }
}
