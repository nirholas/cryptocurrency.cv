/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Generate an internal article URL from a NewsArticle's title and pubDate.
 * This is a lightweight, client-safe version of generateArticleSlug from archive-v2.
 */
export function getArticleSlug(title: string, date?: string): string {
  let slug = title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  slug = slug.replace(/-$/, '');

  if (date) {
    try {
      const dateStr = new Date(date).toISOString().split('T')[0];
      slug = `${slug}-${dateStr}`;
    } catch {
      // skip date suffix on parse error
    }
  }

  return slug || 'untitled';
}

/**
 * Generate the internal article path for use in Next.js Link components.
 */
export function getArticlePath(title: string, date?: string): string {
  return `/article/${getArticleSlug(title, date)}`;
}
