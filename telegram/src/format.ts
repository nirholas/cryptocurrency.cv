/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

// ---------------------------------------------------------------------------
// Formatting helpers — Telegram MarkdownV2 / HTML utilities
// ---------------------------------------------------------------------------

/** Escape special chars for Telegram MarkdownV2 */
export function esc(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/** Escape for Telegram HTML mode */
export function escHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format a USD amount nicely */
export function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (Math.abs(n) < 0.01) return '$' + n.toFixed(6);
  if (Math.abs(n) < 1) return '$' + n.toFixed(4);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Format percent change with arrow */
export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const arrow = n >= 0 ? '🟢' : '🔴';
  const sign = n >= 0 ? '+' : '';
  return `${arrow} ${sign}${n.toFixed(2)}%`;
}

/** Truncate text */
export function truncate(str: string, max: number): string {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

/** Format a relative time string */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Sentiment emoji */
export function sentimentEmoji(s: string): string {
  const map: Record<string, string> = {
    very_bullish: '🟢🟢',
    bullish: '🟢',
    neutral: '⚪',
    bearish: '🔴',
    very_bearish: '🔴🔴',
    mixed: '🟡',
  };
  return map[s] || '⚪';
}

/** Fear & Greed emoji */
export function fearGreedEmoji(value: number): string {
  if (value <= 20) return '😱';
  if (value <= 40) return '😰';
  if (value <= 60) return '😐';
  if (value <= 80) return '😀';
  return '🤑';
}

/** Build a nicely formatted article line (HTML mode) */
export function articleLine(article: {
  title: string;
  link: string;
  source?: string;
  timeAgo?: string;
  pubDate?: string;
}): string {
  const time = article.timeAgo || (article.pubDate ? timeAgo(article.pubDate) : '');
  const src = article.source ? ` · ${escHtml(article.source)}` : '';
  const timeStr = time ? ` · <i>${escHtml(time)}</i>` : '';
  return `• <a href="${article.link}">${escHtml(truncate(article.title, 120))}</a>${src}${timeStr}`;
}
