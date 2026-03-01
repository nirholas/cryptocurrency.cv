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
import { escHtml, articleLine } from '../format.js';

// ---------------------------------------------------------------------------
// /search <query> — Search crypto news articles
// ---------------------------------------------------------------------------

interface SearchResponse {
  query: string;
  total: number;
  articles: Array<{
    title: string;
    link: string;
    source: string;
    pubDate?: string;
    sentiment?: string;
    relevance?: number;
  }>;
}

export async function searchCommand(ctx: Context): Promise<void> {
  const text = ctx.message?.text ?? '';
  const query = text.replace(/^\/search\s*/i, '').trim();

  if (!query) {
    await ctx.reply(
      '🔍 <b>Search crypto news</b>\n\n' +
        'Usage: <code>/search your query</code>\n\n' +
        'Examples:\n' +
        '• <code>/search bitcoin ETF approval</code>\n' +
        '• <code>/search solana DeFi</code>\n' +
        '• <code>/search SEC regulation</code>',
      { parse_mode: 'HTML' },
    );
    return;
  }

  await ctx.replyWithChatAction('typing');

  try {
    const data = await apiFetch<SearchResponse>('/api/search', {
      q: query,
      limit: 6,
    });

    if (!data.articles?.length) {
      await ctx.reply(`No results found for "${query}". Try different keywords.`);
      return;
    }

    const lines = [
      `🔍 <b>Search:</b> ${escHtml(query)}`,
      `<i>${data.total} results</i>`,
      '',
      ...data.articles.map(a => articleLine(a)),
      '',
      '<i>cryptocurrency.cv</i>',
    ];

    await ctx.reply(lines.join('\n'), {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    console.error('search command error:', err);
    await ctx.reply('⚠️ Search failed. Please try again later.');
  }
}
